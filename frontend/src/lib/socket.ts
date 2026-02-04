import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const socket = io(SOCKET_URL, {
    autoConnect: true,
    reconnection: true,
});

socket.on('connect', () => {
    console.log('Connected to SIGFA Real-time Engine');
});

socket.on('disconnect', () => {
    console.log('Disconnected from SIGFA Real-time Engine');
});
