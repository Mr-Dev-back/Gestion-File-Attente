import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from '../components/molecules/ui/toast';

export interface Site {
    id: string;
    name: string;
    companyId: string;
    workflowId?: string;
    isMonoUserProcess: boolean;
    config: {
        stages: string[];
        allowDirectPass: boolean;
    };
    establishmentName?: string;
    alertThreshold?: number;
    company?: {
        name: string;
    };
}

export const useSites = () => {
    const queryClient = useQueryClient();

    const sitesQuery = useQuery({
        queryKey: ['sites'],
        queryFn: async () => {
            const { data } = await api.get<Site[]>('/sites');
            return data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (newSite: Partial<Site>) => {
            const { data } = await api.post<Site>('/sites', newSite);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sites'] });
            toast('Site créé avec succès', 'success');
        },
        onError: (error: any) => {
            toast(error.response?.data?.error || "Erreur lors de la création", 'error');
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Site> }) => {
            const { data: updated } = await api.put<Site>(`/sites/${id}`, data);
            return updated;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sites'] });
            toast('Site mis à jour', 'success');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/sites/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sites'] });
            toast('Site supprimé', 'success');
        },
    });

    return {
        sites: sitesQuery.data || [],
        isLoading: sitesQuery.isLoading,
        createSite: createMutation,
        updateSite: updateMutation,
        deleteSite: deleteMutation
    };
};
