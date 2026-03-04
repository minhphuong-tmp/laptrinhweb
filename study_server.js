const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.STUDY_SERVER_PORT || 3002;

app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('👤 A user connected to Study Support Server:', socket.id);

    socket.on('join-session', (sessionId) => {
        socket.join(sessionId);
        console.log(`📡 User joined study session: ${sessionId}`);
    });

    socket.on('send-message', (data) => {
        // data: { sessionId, text, user }
        io.to(data.sessionId).emit('receive-message', data);

        // Chatbot logic simplified for now
        if (data.text.includes('@chatbot')) {
            setTimeout(() => {
                io.to(data.sessionId).emit('receive-message', {
                    text: "Tôi là trợ lý học tập KMA. Bạn cần hỏi gì về môn này?",
                    user: { name: 'Chatbot', isBot: true },
                    sessionId: data.sessionId
                });
            }, 1000);
        }
    });

    socket.on('disconnect', () => {
        console.log('👤 User disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Study Support Server running on port ${PORT}`);
});
