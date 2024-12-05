import React, { useState } from 'react';
import { v4 as uuidV4 } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Globe from '../components/Globe';
import Room from '../components/Room';
import Lappy from '../components/Lappy';
const Home = () => {
    const navigate = useNavigate();

    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');
    const createNewRoom = (e) => {
        e.preventDefault();
        const id = uuidV4();
        setRoomId(id);
        toast.success('Created a new room');
    };

    const joinRoom = () => {
        if (!roomId || !username) {
            toast.error('ROOM ID & username is required');
            return;
        }

        // Redirect
        navigate(`/editor/${roomId}`, {
            state: {
                username,
            },
        });
    };

    const handleInputEnter = (e) => {
        if (e.code === 'Enter') {
            joinRoom();
        }
    };

    return (
        <div className='h-full w-full  bg-black'>
            <Lappy />

            <div className='flex w-full h-screen'>


                <div className='w-1/2 flex p-12 justify-center items-center flex-col'>
                    <p className='text-6xl font-extrabold text-white'>Code Collab: Real-time Collaborative Coding</p>
                    <p className='text-xl font-semibold text-white mt-4'>Join us as we unveil Code Collab, a revolutionary platform designed to empower teams to code together seamlessly in real-time. Discover the power of shared coding spaces, synchronized editing, and collaborative features that enhance team productivity and streamline development workflows.
                    </p>
                    <button class="px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-gray-100 border border-black shadow-md">
                        Get Started
                    </button>

                </div>

                <div className=' w-1/2'>
                    <Globe />
                </div>
            </div>

            <div className='w-full flex justify-center mt-2'>
                <p className='text-6xl font-extrabold text-white'>Meet Our Founding Team</p>
            </div>

            <div className='w-full flex justify-around mt-6'>
                <div className='h-80 w-1/3'>
                    <Room />
                </div>
                <div className='  w-2/5 flex justify-center  p-4'>
                    <div className='bg-gray-200 p-4 rounded-lg'>
                        <p className='text-2xl font-extrabold text-black'>Kauhsal Bisht</p>
                        <p className='text-xl font-semibold text-black mt-4'>We sincerely appreciate the amazing effort Kaushal has put into handling the frontend design of our project. Your creativity, attention to detail, and dedication have elevated the project's design and user experience to the next level.
                        </p>

                        <p className='text-xl font-semibold text-black mt-4'>Thank you for your hard work and for making everything look seamless and professional. Your contributions truly make a difference! 👏💻✨
                        </p>
                    </div>
                </div>
            </div>


            <div className='w-full flex justify-around mt-6'>

                <div className=' w-2/5 flex justify-center  p-4'>
                    <div className='bg-gray-200 p-4 rounded-lg'>
                        <p className='text-2xl font-extrabold text-black'>Ashish Purohit</p>
                        <p className='text-xl font-semibold text-black mt-4'>A big thank you to Ashish for his exceptional work in server management and version control for our project. Your expertise and reliability have ensured smooth operations and seamless collaboration within the team.
                        </p>


                    </div>
                </div>

                <div className='  w-2/5 flex justify-center  p-4'>
                    <div className='bg-gray-200 p-4 rounded-lg'>
                        <p className='text-2xl font-extrabold text-black'>Bhuwnesh Tripathi</p>
                        <p className='text-xl font-semibold text-black mt-4'>We want to express our heartfelt appreciation to Bhawnesh for his incredible work in integrating our project with frontend libraries like React and seamlessly managing frontend and backend development.
                        </p>


                    </div>
                </div>
            </div>


            <div className='flex w-full h-screen'>


                <div className='w-1/2 flex p-12 justify-center items-center flex-col'>
                    <p className='text-6xl font-extrabold text-white'>Join or Create a Virtual Space</p>
                    <p className='text-xl font-semibold text-white mt-8'>The platform provides a unified virtual workspace for all participants, allowing them to collaborate seamlessly.
                    </p>

                    <p className='text-xl font-semibold text-white mt-4'>All tools, including code editor, whiteboard, and chat, are seamlessly integrated within the virtual space.

                    </p>


                </div>

                <div className=' w-1/2'>

                    <div className="homePageWrapper bg-black">
                        
                        <div className="formWrapper bg-black">
                            <img
                                className="homePageLogo"
                                src="/code-sync.png"
                                alt="code-sync-logo"
                            />
                            <h4 className="mainLabel text-black">Paste invitation ROOM ID</h4>
                            <div className="inputGroup">
                                <input
                                    type="text"
                                    className="inputBox"
                                    placeholder="ROOM ID"
                                    onChange={(e) => setRoomId(e.target.value)}
                                    value={roomId}
                                    onKeyUp={handleInputEnter}

                                    style={{
                                        color: "black"
                                    }}
                                />
                                <input
                                    type="text"
                                    className="inputBox"
                                    placeholder="USERNAME"
                                    onChange={(e) => setUsername(e.target.value)}
                                    value={username}
                                    onKeyUp={handleInputEnter}
                                    style={{
                                        color: "black"
                                    }}
                                />
                                <button className="btn joinBtn" onClick={joinRoom}>
                                    Join
                                </button>
                                <span className="createInfo  text-black">
                                    If you don't have an invite then create &nbsp;
                                    <a
                                        onClick={createNewRoom}
                                        href=""
                                        className=" text-black"
                                    >
                                        new room
                                    </a>
                                </span>
                            </div>
                        </div>
                        
                    </div>

                </div>
            </div>


           




        </div>
    );




};

export default Home;
