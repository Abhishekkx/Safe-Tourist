import { io } from 'socket.io-client';

// Connect to live Render backend URL or localhost in development
const URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://safe-tourist-oktn.onrender.com';

export const socket = io(URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
});

socket.on('connect', () => {
  console.log('⚡ Connected to Emergency Response Socket Stream:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('⚠️ Socket Disconnected Reason:', reason);
});
