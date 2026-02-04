import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from '../components/molecules/ui/toast';
import { useAuthStore } from '../stores/useAuthStore';

export interface User {
    id: string;
    username: string;
    email: string;
    role: 'ADMINISTRATOR' | 'SUPERVISOR' | 'MANAGER' | 'AGENT_QUAI';
    isActive: boolean;
    site?: {
        id: string;
        name: string;
        company?: {
            id: string;
            name: string;
        };
    };
    failedLoginAttempts?: number;
    lockUntil?: string;
    lastLoginAt?: string;
}

export const useUsers = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    const usersQuery = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const { data } = await api.get<User[]>('/users');
            return data;
        },
        enabled: user?.role === 'ADMINISTRATOR',
    });

    const createUserMutation = useMutation({
        mutationFn: async (newUser: Partial<User> & { password?: string }) => {
            const { data } = await api.post<User>('/users', newUser);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast('Utilisateur créé avec succès', 'success');
        },
        onError: (error: any) => {
            toast(error.response?.data?.error || "Erreur lors de la création de l'utilisateur", 'error');
        },
    });

    const updateUserMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
            const { data: updatedUser } = await api.put<User>(`/users/${id}`, data);
            return updatedUser;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast('Utilisateur mis à jour avec succès', 'success');
        },
        onError: (error: any) => {
            toast(error.response?.data?.error || "Erreur lors de la mise à jour", 'error');
        },
    });

    const deleteUser = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/users/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast("Utilisateur supprimé", "success");
        },
        onError: (error: any) => {
            toast(error.response?.data?.error || "Erreur lors de la suppression", "error");
        }
    });

    const toggleActive = useMutation({
        mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
            await api.put(`/users/${id}`, { isActive });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast("Statut mis à jour", "success");
        },
        onError: (error: any) => {
            toast(error.response?.data?.error || "Erreur lors de la mise à jour", "error");
        }
    });

    const unlockUser = useMutation({
        mutationFn: async (id: string) => {
            await api.put(`/users/${id}/unlock`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast("Utilisateur débloqué", "success");
        },
        onError: (error: any) => {
            toast(error.response?.data?.error || "Erreur lors du déblocage", "error");
        }
    });

    const getLoginHistory = async (id: string) => {
        const { data } = await api.get(`/users/${id}/history`);
        return data;
    };

    const getUserSessions = async (id: string) => {
        const { data } = await api.get(`/users/${id}/sessions`);
        return data;
    };

    const revokeSession = useMutation({
        mutationFn: async (sessionId: string) => {
            await api.delete(`/users/sessions/${sessionId}`);
        },
        onSuccess: () => {
            // No need to invalidate users, but might want to invalidate specific user sessions if we had a query for it
            toast("Session révoquée", "success");
        },
        onError: (error: any) => {
            toast(error.response?.data?.error || "Erreur lors de la révocation", "error");
        }
    });

    return {
        users: usersQuery.data || [],
        isLoading: usersQuery.isLoading,
        isError: usersQuery.isError,
        createUser: createUserMutation,
        updateUser: updateUserMutation,
        deleteUser,
        toggleActive,
        unlockUser,
        getLoginHistory,
        getUserSessions,
        revokeSession
    };
};
