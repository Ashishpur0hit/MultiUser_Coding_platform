import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import {
    useLocation,
    useNavigate,
    Navigate,
    useParams,
} from 'react-router-dom';
import WhiteBoard from '../components/WhiteBoard';

const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);
    const [show_whiteboard, set_show_whiteboard] = useState(false);

    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();
            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
                reactNavigator('/');
            }

            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
            });

            // Listening for joined event
            socketRef.current.on(
                ACTIONS.JOINED,
                ({ clients, username, socketId }) => {
                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room.`);
                        console.log(`${username} joined`);
                    }
                    setClients(clients);
                    socketRef.current.emit(ACTIONS.SYNC_CODE, {
                        code: codeRef.current,
                        socketId,
                    });
                }
            );

            // Listening for disconnected
            socketRef.current.on(
                ACTIONS.DISCONNECTED,
                ({ socketId, username }) => {
                    toast.success(`${username} left the room.`);
                    setClients((prev) => {
                        return prev.filter(
                            (client) => client.socketId !== socketId
                        );
                    });
                }
            );


            socketRef.current.on(
                ACTIONS.TOGGLE_RESPONCE,
                ({ username, state }) => {
                    set_show_whiteboard(state);
                    toast.success(`${username} switched to WhiteBoard`);
                }
            )
        };
        init();
        return () => {
            socketRef.current.disconnect();
            socketRef.current.off(ACTIONS.JOINED);
            socketRef.current.off(ACTIONS.DISCONNECTED);
        };
    }, []);

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has been copied to your clipboard');
        } catch (err) {
            toast.error('Could not copy the Room ID');
            console.error(err);
        }
    }

    function leaveRoom() {
        reactNavigator('/');
    }

    if (!location.state) {
        return <Navigate to="/" />;
    }

    function emitEvent() {
        console.log("button Clicked");
        const newState = !show_whiteboard;
        set_show_whiteboard(newState);
        socketRef.current.emit(ACTIONS.TOGGLE, {
            roomId,
            username: location.state?.username,
            state: newState
        });
    }

    return (
        <div className='grid grid-cols-3 sm:grid-cols-10 md:grid-cols-12 h-screen bg-gray-800'>
    
          <div className='bg-gray-800 flex flex-col items-center h-screen col-span-1 sm:col-span-3 md:col-span-2 overflow-y-auto scrollbar-hide'>
            <img className='h-24' src='https://static.vecteezy.com/system/resources/previews/009/887/458/original/coding-illustration-3d-png.png' alt="code-sync-logo" />
            <p className='text-white font-semibold ms-5 text-xl'>Connected</p>
            <div className="clientsList">
                        {clients.map((client) => (
                            <Client
                                key={client.socketId}
                                username={client.username}
                                socketRef={socketRef}
                                roomId ={roomId}
                            />
                        ))}
                    </div>
    
            <button onClick={copyRoomId} className='hover:bg-green-600 rounded-lg ps-5 pe-5 pt-2 pb-2 bg-green-500 mt-16 text-white font-semibold text-sm w-full sm:w-auto'>
              Copy Room ID
            </button>
            <button onClick={leaveRoom} className='hover:bg-gray-900 rounded-lg ps-5 pe-5 pt-2 pb-2 bg-black mt-2 text-white font-semibold w-full sm:w-auto text-sm'>
              Leave
            </button>
    
            <button onClick={emitEvent} className='hover:bg-gray-900 rounded-lg ps-5 pe-5 pt-2 pb-2 bg-black mt-2 text-white font-semibold w-full sm:w-auto text-sm'>
              Switch
            </button>
          </div>
    
          <div className='h-screen col-span-2 sm:col-span-7 md:col-span-10 overflow-y-auto scrollbar-hide items-top'>
            {!show_whiteboard ? <Editor socketRef={socketRef} roomId={roomId} onCodeChange={(code) => { codeRef.current = code }} /> : <WhiteBoard canDraw={true} socket_ref={socketRef} roomId={roomId} />}
          </div>
        </div>
      );


};

export default EditorPage;
