import { io } from 'socket.io-client';

const URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '/';

export const socket = io(URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'], // Prefer WebSocket immediately to eliminate polling transport upgrades
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
});

socket.on('connect', () => {
  console.log('⚡ Connected to Emergency Response Socket Stream:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('⚠️ Socket Disconnected Reason:', reason);
});
