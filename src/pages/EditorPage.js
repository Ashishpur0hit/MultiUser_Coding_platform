import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import Bot from '../components/Bot';
import {
    useLocation,
    useNavigate,
    Navigate,
    useParams,
} from 'react-router-dom';
import WhiteBoard from '../components/WhiteBoard';
import Group from '../components/Group';


const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const localStream = useRef(null);
    const peersRef = useRef({});
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();

    const [clients, setClients] = useState([]);
    const [show_whiteboard, set_show_whiteboard] = useState(false);
    const [micOn, setMicOn] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                // Initialize Socket
                socketRef.current = await initSocket();
                socketRef.current.on('connect_error', handleErrors);
                socketRef.current.on('connect_failed', handleErrors);

                function handleErrors(err) {
                    console.error('Socket Error:', err);
                    toast.error('Socket connection failed, try again later.');
                    reactNavigator('/');
                }




                // Join Room
                socketRef.current.emit(ACTIONS.JOIN, {
                    roomId,
                    username: location.state?.username,
                });

                // Listen for JOINED event
                socketRef.current.on(ACTIONS.JOINED, ({ clients, username, socketId }) => {
                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room.`);
                    }
                    setClients(clients);
                    socketRef.current.emit(ACTIONS.SYNC_CODE, {
                        code: codeRef.current,
                        socketId,
                    });
                });

                // Listen for new peers
                socketRef.current.on('new_peer', ({ socketId, micOn }) => {
                    if (!peersRef.current[socketId]) {
                        handleNewPeer({ socketId, micOn });
                        console.log("New Peer Found with id : ", socketId);
                    }

                });


                socketRef.current.on('toggle_responce', ({ username, state }) => {
                    set_show_whiteboard(state);
                    localStorage.setItem("show_whiteboard", JSON.stringify(state));
                    if (show_whiteboard) {
                        toast.success(`${username} swithed to WhiteBoard`);
                    }
                    else {
                        toast.success(`${username} swithed to Editor`);
                    }
                })

                // Listen for mic toggle updates
                socketRef.current.on('mic_toggle_responce', ({ username, micOn }) => {
                    toast.success(`${username} ${micOn ? 'enabled' : 'disabled'} their mic.`);
                });

                // Listen for disconnections
                socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
                    toast.success(`${username} left the room.`);
                    setClients((prev) => prev.filter((client) => client.socketId !== socketId));
                    if (peersRef.current[socketId]) {
                        peersRef.current[socketId].close();
                        delete peersRef.current[socketId];
                    }
                });

                // Handle ICE candidate reception
                socketRef.current.on('recieve_ice_candidate', ({ candidate, from }) => {
                    const peerConnection = peersRef.current[from];

                    if (peerConnection) {
                        peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
                            .catch((err) => console.error('Error adding ICE candidate:', err));
                    }
                    console.log('ICE candidate Recieve');
                });

                // Handle receiving an answer
                socketRef.current.on('recieve_answer', ({ sdp, from }) => {
                    const peerConnection = peersRef.current[from];
                    console.log("Answer Recieved");
                    if (peerConnection) {
                        peerConnection.setRemoteDescription(new RTCSessionDescription(sdp))
                            .catch((err) => console.error('Error setting remote description:', err));
                    }
                });



                socketRef.current.on('recieve_offer', ({ sdp, from }) => {
                    console.log("Received offer from socket ID:", from);
                    console.log("Peers currently in peersRef:", Object.keys(peersRef.current));

                    // Check if peerConnection already exists, otherwise create one
                    let peerConnection = peersRef.current[from];
                    if (!peerConnection) {
                        console.log(`No peer connection found for socket ID ${from}. Creating a new one.`);

                        peerConnection = new RTCPeerConnection({
                            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
                        });

                        // Set up event listeners for the new peer connection
                        peerConnection.ontrack = (event) => {
                            const remoteAudio = new Audio();
                            remoteAudio.srcObject = event.streams[0];
                            remoteAudio.play();
                        };

                        peerConnection.onicecandidate = (event) => {
                            if (event.candidate) {
                                socketRef.current.emit('ICE_candidates', {
                                    candidate: event.candidate,
                                    socketId: from,
                                });
                                console.log("ICE Candidate Sent");
                            }
                        };

                        // Store the new peer connection in peersRef
                        peersRef.current[from] = peerConnection;
                    }

                    // Process the offer
                    console.log("Offer Received");
                    peerConnection.setRemoteDescription(new RTCSessionDescription(sdp))
                        .then(() => peerConnection.createAnswer())
                        .then((answer) => peerConnection.setLocalDescription(answer))
                        .then(() => {
                            socketRef.current.emit('send_answer', {
                                sdp: peerConnection.localDescription,
                                to: from,
                            });
                            console.log("Answer Sent");
                        })
                        .catch((err) => console.error('Error handling offer:', err));
                });



            } catch (error) {
                console.error('Initialization Error:', error);
                toast.error('Failed to initialize room.');
                reactNavigator('/');
            }
        };

        init();
        if (localStorage.getItem("show_whiteboard") !== null) set_show_whiteboard(JSON.parse(localStorage.getItem("show_whiteboard")));
        else localStorage.setItem("show_whiteboard", JSON.stringify(show_whiteboard));
        return () => {
            // Cleanup on unmount
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            Object.keys(peersRef.current).forEach((peerId) => {
                peersRef.current[peerId].close();
                delete peersRef.current[peerId];
            });
        };
    }, [reactNavigator, location.state, roomId]);

    useEffect(() => {
        const initializeAudio = async () => {
            try {
                localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                localStream.current.getTracks().forEach((track) => (track.enabled = micOn));
            } catch (error) {
                toast.error('Could not access microphone.');
                console.error(error);
            }
        };

        initializeAudio();
    }, [micOn]);

    const handleNewPeer = ({ socketId, micOn }) => {

        console.log("In handleNew Peer SocketId Found: ", socketId);

        if (!localStream.current) return;


        const peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });

        // Add local stream tracks to the peer connection
        localStream.current.getTracks().forEach((track) => {
            peerConnection.addTrack(track, localStream.current);
        });

        peerConnection.ontrack = (event) => {
            const remoteAudio = new Audio();
            remoteAudio.srcObject = event.streams[0];
            remoteAudio.muted = true; // Prevent playback restrictions
            remoteAudio.play().catch((err) => console.error('Audio playback error:', err));
        };




        // When ICE candidates are generated, send them to the server
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit('ICE_candidates', {
                    candidate: event.candidate,
                    socketId,
                });
                console.log("ICE Candidate Send");
            }
        };

        peersRef.current[socketId] = peerConnection;
        console.log(peersRef)

        // Create an offer and send it to the new peer
        peerConnection.createOffer()
            .then((offer) => {
                return peerConnection.setLocalDescription(offer);
            })
            .then(() => {
                socketRef.current.emit('send_offer', {
                    sdp: peerConnection.localDescription,
                    to: socketId,
                });

                console.log("offer send");
            })
            .catch((err) => console.error('Error creating offer:', err));
    };

    const toggleMic = () => {
        const newMicState = !micOn;
        setMicOn(newMicState);
        if (localStream.current) {
            localStream.current.getTracks().forEach((track) => (track.enabled = newMicState));
        }
        socketRef.current.emit('mic_toggle', {
            roomId,
            username: location.state?.username,
            micOn: newMicState,
        });
    };

    const copyRoomId = async () => {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has been copied to your clipboard.');
        } catch (error) {
            toast.error('Could not copy the Room ID.');
        }
    };




    const leaveRoom = () => reactNavigator('/');

    const toggleWhiteBoard = () => {
        const newState = !show_whiteboard;
        set_show_whiteboard(newState);
        socketRef.current.emit(ACTIONS.TOGGLE, {
            roomId,
            username: location.state?.username,
            state: newState,
        });
    };



    if (!location.state) {
        return <Navigate to="/" />;
    }








    












    return (
        <div className='flex h-screen'>

            <div className="w-1/5 h-full bg-gray-800 flex flex-col justify-between">

                <div>
                    <div className="p-4 border-b border-gray-700">
                        <h1 className="text-lg font-bold text-gray-200">Code Collab</h1>
                    </div>

                    <button
                        onClick={toggleMic}
                        className={`w-full block p-3 hover:bg-gray-700 rounded-md text-gray-200`}
                    >
                        {micOn ? 'Mic On' : 'Mic Off'}
                    </button>

                    <button onClick={copyRoomId} className='w-full block p-3 hover:bg-gray-700 rounded-md text-gray-200'>
                        Copy Room ID
                    </button>
                    <button onClick={leaveRoom} className=' w-full block p-3 hover:bg-gray-700 rounded-md text-gray-200 '>
                        Leave
                    </button>

                    <button onClick={toggleWhiteBoard} className='w-full block p-3 hover:bg-gray-700 rounded-md text-gray-200'>
                        Switch
                    </button>
                    
                    <ul class="mt-4 space-y-2 bg-gray-800 p-4 w-full flex items-center flex-col">
            <li class="flex items-center space-x-2 text-white w-full block p-3 hover:bg-gray-700 rounded-md text-gray-200">
              <span class="text-green-500">•</span>
              <span>Main.html</span>
            </li>
            <li class="flex items-center space-x-2 text-white w-full block p-3 hover:bg-gray-700 rounded-md text-gray-200">
              <span class="text-yellow-500">•</span>
              <span>Check.config.json</span>
            </li>
            <li class="flex items-center space-x-2 text-white w-full block p-3 hover:bg-gray-700 rounded-md text-gray-200">
              <span class="text-red-500">•</span>
              <span>Readme.md</span>
            </li>
          </ul>
                    

                </div>

               

                <div className="p-4">
                    <button onClick={leaveRoom} className="w-full bg-red-500 hover:bg-red-700 py-2 px-4 rounded-md text-gray-200">Log Out</button>
                </div>
            </div>


            <div className="w-4/5 flex flex-col">

                <div className="flex items-center justify-between bg-gray-800 px-4 py-2">
                    <div className="flex items-center space-x-4">
                        <button className="bg-gray-700 hover:bg-gray-600 text-sm px-4 py-2 rounded-md text-gray-200">New Project</button>
                        <button className="bg-gray-700 hover:bg-gray-600 text-sm px-4 py-2 rounded-md text-gray-200">File</button>
                        <button className="bg-gray-700 hover:bg-gray-600 text-sm px-4 py-2 rounded-md text-gray-200">Edit</button>
                    </div>
                    <div className="text-sm text-gray-200">
                        <img className='w-10 border-round rounded-full' src='https://toppng.com/uploads/preview/cool-avatar-transparent-image-cool-boy-avatar-11562893383qsirclznyw.png'>
                        </img>
                    </div>
                </div>


                   <div className="flex flex-1">

                       <div className="w-1/4 bg-gray-850 p-4 border-r border-gray-700">
                           <h3 className="text-gray-400 text-sm font-semibold mb-12">Members</h3>


                        {clients.map((client) => (
                                                <Client
                                                    key={client.socketId} 
                                                    username={client.username}
                                                    socketRef={socketRef}
                                                    roomId={roomId}
                                                />
                                            ))}
                    </div>


                    <div className="flex-1 flex flex-col w-4/5">

                        


                        <div className="flex-1 bg-gray-850 p-4 text-sm font-mono leading-relaxed overflow-y-auto text-white">
                        {!show_whiteboard ? <Editor socketRef={socketRef} roomId={roomId} onCodeChange={(code) => { codeRef.current = code }} /> : <WhiteBoard canDraw={true} socket_ref={socketRef} roomId={roomId} />}
                        </div>



                    </div>
                </div>
            </div>

            

            {/* <div className='h-screen col-span-2 sm:col-span-7 md:col-span-10 overflow-y-auto scrollbar-hide items-top'>
                {!show_whiteboard ? <Editor socketRef={socketRef} roomId={roomId} onCodeChange={(code) => { codeRef.current = code }} /> : <WhiteBoard canDraw={true} socket_ref={socketRef} roomId={roomId} />}
            </div> */}
        </div>
    );


};

export default EditorPage;
