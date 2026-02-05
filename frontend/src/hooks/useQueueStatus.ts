import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../services/api';
import { useSocket } from './useSocket';

export interface CategoryQueue {
    category: {
        id: string;
        name: string;
        prefix: string;
        color: string;
        estimatedDuration: number;
    };
    tickets: any[];
    count: number;
}

export function useQueueStatus(siteId?: string) {
    const queryClient = useQueryClient();
    const { socket } = useSocket(siteId);

    const { data: queueStatus = {}, isLoading, refetch } = useQuery<Record<string, CategoryQueue>>({
        queryKey: ['queue-status', siteId],
        queryFn: async () => {
            const params = siteId ? { siteId } : {};
            const { data } = await api.get('/tickets/queue-status', { params });
            return data;
        },
        refetchInterval: 60000, // Backup polling every 60s
    });

    useEffect(() => {
        const handleQueueUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ['queue-status', siteId] });
        };

        socket.on('queue-updated', handleQueueUpdate);
        socket.on('ticket-status-updated', handleQueueUpdate);

        return () => {
            socket.off('queue-updated', handleQueueUpdate);
            socket.off('ticket-status-updated', handleQueueUpdate);
        };
    }, [socket, queryClient, siteId]);

    return {
        queueStatus,
        isLoading,
        refetch
    };
}
