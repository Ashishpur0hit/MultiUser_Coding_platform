const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');

const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('build'));
app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const userSocketMap = {};
function getAllConnectedClients(roomId) {
    // Map
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            };
        }
    );
}

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        socket.broadcast.to(roomId).emit("new_peer", {
            socketId: socket.id,
            micOn: true, // You can track mic state here
        });
        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });

        });
    });


   

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    // Handle mic toggle event
    socket.on("mic_toggle", ({ roomId, username, micOn }) => {
        console.log(`${username} toggled mic: ${micOn}`);
        // Notify others in the room about the mic status
        socket.to(roomId).emit("mic_toggle_responce", {
            username,
            micOn,
        });
    });

    socket.on(ACTIONS.DRAW_EVENT, ({ roomId, currentShape }) => {
        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit('drawn',currentShape);
        });
        console.log('drawn event send');
        
      });
      

    socket.on(ACTIONS.TOGGLE, ({ roomId,username,state }) => {
        console.log("toggle event received at server");
        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit("toggle_responce", {
                username : username,
                state : state
            });
        });
    });


    // Server-side socket events for voice chat

socket.on('send_offer', ({ sdp, to }) => {
    console.log("offer Recieved On server");
    socket.to(to).emit('recieve_offer', { sdp, from: socket.id });
});

socket.on('send_answer', ({ sdp, to }) => {
    console.log("answer Recieved On server");
    socket.to(to).emit('recieve_answer', { sdp, from: socket.id });
});

socket.on('ICE_candidates', ({ candidate, socketId }) => {
    console.log("ICE Recieved On server");
    
    io.to(socketId).emit('recieve_ice_candidate', { candidate, from: socket.id });
    console.log(userSocketMap[socketId]);
});

    

   
    

    socket.on('disconnecting', () => {

        // Object.keys(peersRef.current).forEach((peerId) => {
        //     peersRef.current[peerId].close();
        //     delete peersRef.current[peerId];
        // });


        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
        socket.leave();
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
