import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from '../components/molecules/ui/toast';

export interface Company {
    id: string;
    name: string;
    description?: string;
}

export const useCompanies = () => {
    const queryClient = useQueryClient();

    const companiesQuery = useQuery({
        queryKey: ['companies'],
        queryFn: async () => {
            const { data } = await api.get<Company[]>('/companies');
            return data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (newCompany: Partial<Company>) => {
            const { data } = await api.post<Company>('/companies', newCompany);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            toast('Société créée avec succès', 'success');
        },
        onError: (error: any) => {
            toast(error.response?.data?.error || "Erreur lors de la création", 'error');
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Company> }) => {
            const { data: updated } = await api.put<Company>(`/companies/${id}`, data);
            return updated;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            toast('Société mise à jour', 'success');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/companies/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            toast('Société supprimée', 'success');
        },
    });

    return {
        companies: companiesQuery.data || [],
        isLoading: companiesQuery.isLoading,
        createCompany: createMutation,
        updateCompany: updateMutation,
        deleteCompany: deleteMutation
    };
};
