
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export interface SystemSetting {
    key: string;
    value: string;
    type: 'STRING' | 'INTEGER' | 'FLOAT' | 'BOOLEAN' | 'JSON' | 'ENUM';
    scope: 'GLOBAL' | 'COMPANY' | 'SITE';
    scopeId?: string;
    category: string;
    description?: string;
    inheritedFrom?: 'GLOBAL' | 'COMPANY' | 'SITE';
}

export const useSystemSettings = () => {
    const queryClient = useQueryClient();

    const fetchSettings = async () => {
        const response = await api.get<SystemSetting[]>('/settings');
        return response.data;
    };

    const updateSetting = async (setting: Partial<SystemSetting>) => {
        const response = await api.post('/settings', setting);
        return response.data;
    };

    const settingsQuery = useQuery({
        queryKey: ['systemSettings'],
        queryFn: fetchSettings,
        staleTime: 5 * 60 * 1000,
    });

    const updateSettingMutation = useMutation({
        mutationFn: updateSetting,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
        },
    });

    return {
        settings: settingsQuery.data || [],
        isLoading: settingsQuery.isLoading,
        error: settingsQuery.error,
        updateSetting: updateSettingMutation,
    };
};
