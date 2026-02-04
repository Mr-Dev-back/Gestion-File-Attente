import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useToastStore } from '../components/molecules/ui/toast';

export const useCategories = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToastStore();

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data } = await api.get('/categories');
            return data;
        }
    });

    const createCategory = useMutation({
        mutationFn: (data) => api.post('/categories', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            addToast('Catégorie créée', 'success');
        },
        onError: (err: any) => addToast(err.response?.data?.error || 'Erreur création', 'error')
    });

    const updateCategory = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => api.put(`/categories/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            addToast('Catégorie mise à jour', 'success');
        },
        onError: (err: any) => addToast(err.response?.data?.error || 'Erreur mise à jour', 'error')
    });

    const deleteCategory = useMutation({
        mutationFn: (id: string) => api.delete(`/categories/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            addToast('Catégorie supprimée', 'success');
        },
        onError: (err: any) => addToast(err.response?.data?.error || 'Erreur suppression', 'error')
    });

    return {
        categories,
        isLoading,
        createCategory,
        updateCategory,
        deleteCategory
    };
};
