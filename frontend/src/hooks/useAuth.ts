
import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { getDefaultRouteForRole } from '../utils/roleBasedRouting';

export const useAuth = () => {
    const { setAuth } = useAuthStore();
    const navigate = useNavigate();

    const loginMutation = useMutation({
        mutationFn: async (credentials: any) => {
            const response = await api.post('/auth/login', credentials);
            return response.data;
        },
        onSuccess: (data) => {
            setAuth(data.user);
            // Token managed by HttpOnly cookie
            const defaultRoute = getDefaultRouteForRole(data.user.role);
            navigate(defaultRoute);
        },
    });

    const registerMutation = useMutation({
        mutationFn: async (userData: any) => {
            const response = await api.post('/auth/register', userData);
            return response.data;
        },
        onSuccess: (data) => {
            setAuth(data.user);
            // Token managed by HttpOnly cookie
            const defaultRoute = getDefaultRouteForRole(data.user.role);
            navigate(defaultRoute);
        },
    });

    return {
        login: loginMutation,
        register: registerMutation,
    };
};
