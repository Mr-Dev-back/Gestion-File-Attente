import { create } from 'zustand';
import { api } from '../services/api';

interface DashboardMetrics {
    totalArrivals: number;
    completed: number;
    avgWaitTime: number;
    totalWeight: number;
    counts: Record<string, number>;
}

interface DataState {
    metrics: DashboardMetrics;
    isLoading: boolean;
    fetchMetrics: () => Promise<void>;
}

export const useDataStore = create<DataState>((set) => ({
    metrics: {
        totalArrivals: 0,
        completed: 0,
        avgWaitTime: 0,
        totalWeight: 0,
        counts: {},
    },
    isLoading: false,
    fetchMetrics: async () => {
        set({ isLoading: true });
        try {
            const response = await api.get('/tickets/stats');
            const data = response.data;

            set({
                metrics: {
                    totalArrivals: data.total,
                    completed: data.counts['TERMINÉ'] || 0,
                    avgWaitTime: data.avgWaitTime,
                    totalWeight: data.totalWeight,
                    counts: data.counts
                },
                isLoading: false
            });
        } catch (error) {
            console.error('Failed to fetch metrics:', error);
            set({ isLoading: false });
        }
    },
}));
