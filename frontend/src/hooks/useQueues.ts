import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export interface Queue {
    id: string;
    name: string;
    siteId: string;
    workflowId?: string;
    priority: number;
    isActive: boolean;
    site?: { name: string };
    workflow?: { name: string };
}

export function useQueues(siteId?: string) {
    const queryClient = useQueryClient();

    const { data: queues = [], isLoading } = useQuery<Queue[]>({
        queryKey: ['queues', siteId],
        queryFn: async () => {
            const params = siteId ? { siteId } : {};
            const { data } = await api.get('/queues', { params });
            return data;
        },
    });

    const createQueue = useMutation({
        mutationFn: (data: Partial<Queue>) => api.post('/queues', data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['queues'] }),
    });

    const updateQueue = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Queue> }) => api.put(`/queues/${id}`, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['queues'] }),
    });

    const deleteQueue = useMutation({
        mutationFn: (id: string) => api.delete(`/queues/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['queues'] }),
    });

    return {
        queues,
        isLoading,
        createQueue,
        updateQueue,
        deleteQueue
    };
}
