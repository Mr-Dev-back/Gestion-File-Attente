import { useEffect, useState } from 'react';
import { socket } from '../lib/socket';

export const useSocket = (siteId?: string, queueId?: string) => {
    const [isConnected, setIsConnected] = useState(socket.connected);

    useEffect(() => {
        const onConnect = () => setIsConnected(true);
        const onDisconnect = () => setIsConnected(false);

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        if (socket.connected) {
            if (siteId) socket.emit('join-site', siteId);
            if (queueId) socket.emit('join-queue', queueId);
        }

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
        };
    }, [siteId, queueId]);

    // Re-join rooms when reconnected
    useEffect(() => {
        if (isConnected) {
            if (siteId) socket.emit('join-site', siteId);
            if (queueId) socket.emit('join-queue', queueId);
        }
    }, [isConnected, siteId, queueId]);

    return {
        socket,
        isConnected
    };
};
