const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Serve static files with proper MIME types for PWA
app.use(express.static(path.join(__dirname), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.json')) {
            res.setHeader('Content-Type', 'application/json');
        } else if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));

// PWA routes
app.get('/manifest.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(path.join(__dirname, 'manifest.json'));
});

app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'sw.js'));
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Store connected users
let connectedUsers = new Set();
let messageHistory = [];
const MAX_HISTORY = 50; // Keep last 50 messages

// Auto-delete chat history when no one is online
let chatCleanupTimer = null;
const CLEANUP_DELAY = parseInt(process.env.CHAT_CLEANUP_DELAY) || 30 * 60 * 1000; // Default: 5 minutes after last user leaves
let chatWasCleared = false; // Flag to track if chat was auto-cleared

// Function to clear chat history
function clearChatHistory() {
    const messageCount = messageHistory.length;
    messageHistory = [];
    chatWasCleared = true;
    console.log(`🗑️  Auto-cleared ${messageCount} messages from chat history (no users online for ${CLEANUP_DELAY / 1000} seconds)`);
}

// Function to schedule chat cleanup
function scheduleChatCleanup() {
    // Clear any existing timer
    if (chatCleanupTimer) {
        clearTimeout(chatCleanupTimer);
    }
    
    // Only schedule cleanup if no users are connected
    if (connectedUsers.size === 0 && messageHistory.length > 0) {
        console.log(`⏰ Scheduling chat cleanup in ${CLEANUP_DELAY / 1000} seconds (no users online)`);
        chatCleanupTimer = setTimeout(() => {
            clearChatHistory();
            chatCleanupTimer = null;
        }, CLEANUP_DELAY);
    }
}

// Function to cancel chat cleanup
function cancelChatCleanup() {
    if (chatCleanupTimer) {
        clearTimeout(chatCleanupTimer);
        chatCleanupTimer = null;
        console.log('⏰ Chat cleanup cancelled (user reconnected)');
    }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // Add user to connected users
    connectedUsers.add(socket.id);
    
    // Cancel any pending chat cleanup since someone is now online
    cancelChatCleanup();
    
    // Send current user count to all clients
    io.emit('userCount', connectedUsers.size);
    
    // Send recent message history to new user
    messageHistory.forEach(message => {
        socket.emit('message', message);
    });
    
    // If chat was previously cleared, notify the user
    if (chatWasCleared && messageHistory.length === 0) {
        socket.emit('chatCleared', {
            message: 'Chat history was automatically cleared due to inactivity',
            timestamp: new Date().toISOString()
        });
        // Reset the flag after the first user reconnects
        chatWasCleared = false;
    }
    
    // Notify others that a user joined
    socket.broadcast.emit('userJoined', { userId: socket.id });
    
    // Handle incoming messages
    socket.on('message', (data) => {
        // Add server timestamp and socket ID
        const messageData = {
            ...data,
            socketId: socket.id,
            serverTimestamp: new Date().toISOString()
        };
        
        // Add to message history
        messageHistory.push(messageData);
        
        // Keep only recent messages
        if (messageHistory.length > MAX_HISTORY) {
            messageHistory = messageHistory.slice(-MAX_HISTORY);
        }
        
        // Broadcast message to all connected clients
        io.emit('message', messageData);
        
        const logText = data.type === 'file' ? `File: ${data.fileName}` : data.text;
        console.log(`Message from ${socket.id}: ${logText}`);
    });
    
    // Handle reactions
    socket.on('reaction', (data) => {
        // Broadcast reaction to all connected clients
        io.emit('reaction', {
            ...data,
            socketId: socket.id,
            timestamp: new Date().toISOString()
        });
        
        console.log(`Reaction from ${socket.id}: ${data.emoji} on message ${data.messageId}`);
    });
    
    // Handle typing indicators
    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', data);
    });
    
    // Handle user disconnect
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        
        // Remove user from connected users
        connectedUsers.delete(socket.id);
        
        // Send updated user count to all clients
        io.emit('userCount', connectedUsers.size);
        
        // Notify others that a user left
        socket.broadcast.emit('userLeft', { userId: socket.id });
        
        // Schedule chat cleanup if no users are left online
        if (connectedUsers.size === 0) {
            scheduleChatCleanup();
        }
    });
});

// Error handling
server.on('error', (err) => {
    console.error('Server error:', err);
});

// Start the server
server.listen(PORT, () => {
    console.log(`Anonymous Chat Server running on port ${PORT}`);
    console.log(`Open your browser and go to: http://localhost:${PORT}`);
    console.log(`🗑️  Auto-cleanup enabled: Chat history will be cleared ${CLEANUP_DELAY / 1000} seconds after all users disconnect`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
