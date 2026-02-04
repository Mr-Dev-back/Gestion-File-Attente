import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from '../components/molecules/ui/toast';

export interface Product {
    id: string;
    code: string;
    designation: string;
    weight: number;
    categoryId: string;
    category?: {
        id: string;
        name: string;
        prefix: string;
    };
}

export const useProducts = () => {
    const queryClient = useQueryClient();

    const productsQuery = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const { data } = await api.get<Product[]>('/products');
            return data;
        },
    });

    const createProductMutation = useMutation({
        mutationFn: async (newProduct: Partial<Product>) => {
            const { data } = await api.post<Product>('/products', newProduct);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast('Produit créé avec succès', 'success');
        },
        onError: (error: any) => {
            toast(error.response?.data?.error || "Erreur lors de la création du produit", 'error');
        },
    });

    const updateProductMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
            const { data: updatedProduct } = await api.put<Product>(`/products/${id}`, data);
            return updatedProduct;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast('Produit mis à jour avec succès', 'success');
        },
        onError: (error: any) => {
            toast(error.response?.data?.error || "Erreur lors de la mise à jour", 'error');
        },
    });

    const deleteProductMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/products/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast('Produit supprimé', 'info');
        },
        onError: (error: any) => {
            toast(error.response?.data?.error || "Erreur lors de la suppression", 'error');
        },
    });

    return {
        products: productsQuery.data || [],
        isLoading: productsQuery.isLoading,
        isError: productsQuery.isError,
        createProduct: createProductMutation,
        updateProduct: updateProductMutation,
        deleteProduct: deleteProductMutation,
    };
};
