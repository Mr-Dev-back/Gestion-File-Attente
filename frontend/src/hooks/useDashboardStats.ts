import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../services/dashboardApi';
import type {
    AdminStatsResponse,
    AdminRecentActivityResponse,
    SupervisorStatsResponse,
    SupervisorDepartmentsResponse,
    ManagerStatsResponse,
    ManagerPerformanceResponse,
    SalesStatsResponse,
    SalesSummaryResponse,
    ControlStatsResponse,
    ControlPendingResponse,
} from '../types/dashboard';

// Refresh interval for dashboard data (30 seconds)
const DASHBOARD_REFRESH_INTERVAL = 30000;

/**
 * Admin Dashboard Hooks
 */
export const useAdminStats = () => {
    return useQuery<AdminStatsResponse>({
        queryKey: ['dashboard', 'admin', 'stats'],
        queryFn: async () => {
            const { data } = await dashboardApi.getAdminStats();
            return data;
        },
        refetchInterval: DASHBOARD_REFRESH_INTERVAL,
        staleTime: 20000,
    });
};

export const useAdminRecentActivity = () => {
    return useQuery<AdminRecentActivityResponse>({
        queryKey: ['dashboard', 'admin', 'activity'],
        queryFn: async () => {
            const { data } = await dashboardApi.getAdminRecentActivity();
            return data;
        },
        refetchInterval: DASHBOARD_REFRESH_INTERVAL,
        staleTime: 20000,
    });
};

/**
 * Supervisor Dashboard Hooks
 */
export const useSupervisorStats = () => {
    return useQuery<SupervisorStatsResponse>({
        queryKey: ['dashboard', 'supervisor', 'stats'],
        queryFn: async () => {
            const { data } = await dashboardApi.getSupervisorStats();
            return data;
        },
        refetchInterval: DASHBOARD_REFRESH_INTERVAL,
        staleTime: 20000,
    });
};

export const useSupervisorDepartments = () => {
    return useQuery<SupervisorDepartmentsResponse>({
        queryKey: ['dashboard', 'supervisor', 'departments'],
        queryFn: async () => {
            const { data } = await dashboardApi.getSupervisorDepartments();
            return data;
        },
        refetchInterval: DASHBOARD_REFRESH_INTERVAL,
        staleTime: 20000,
    });
};

/**
 * Manager Dashboard Hooks
 */
export const useManagerStats = (department?: string) => {
    return useQuery<ManagerStatsResponse>({
        queryKey: ['dashboard', 'manager', 'stats', department],
        queryFn: async () => {
            const { data } = await dashboardApi.getManagerStats(department);
            return data;
        },
        refetchInterval: DASHBOARD_REFRESH_INTERVAL,
        staleTime: 20000,
    });
};

export const useManagerPerformance = (department?: string) => {
    return useQuery<ManagerPerformanceResponse>({
        queryKey: ['dashboard', 'manager', 'performance', department],
        queryFn: async () => {
            const { data } = await dashboardApi.getManagerPerformance(department);
            return data;
        },
        refetchInterval: DASHBOARD_REFRESH_INTERVAL,
        staleTime: 20000,
    });
};

/**
 * Sales Dashboard Hooks
 */
export const useSalesStats = () => {
    return useQuery<SalesStatsResponse>({
        queryKey: ['dashboard', 'sales', 'stats'],
        queryFn: async () => {
            const { data } = await dashboardApi.getSalesStats();
            return data;
        },
        refetchInterval: DASHBOARD_REFRESH_INTERVAL,
        staleTime: 20000,
    });
};

export const useSalesSummary = () => {
    return useQuery<SalesSummaryResponse>({
        queryKey: ['dashboard', 'sales', 'summary'],
        queryFn: async () => {
            const { data } = await dashboardApi.getSalesSummary();
            return data;
        },
        refetchInterval: DASHBOARD_REFRESH_INTERVAL,
        staleTime: 20000,
    });
};

/**
 * Control Dashboard Hooks
 */
export const useControlStats = () => {
    return useQuery<ControlStatsResponse>({
        queryKey: ['dashboard', 'control', 'stats'],
        queryFn: async () => {
            const { data } = await dashboardApi.getControlStats();
            return data;
        },
        refetchInterval: DASHBOARD_REFRESH_INTERVAL,
        staleTime: 20000,
    });
};

export const useControlPending = () => {
    return useQuery<ControlPendingResponse>({
        queryKey: ['dashboard', 'control', 'pending'],
        queryFn: async () => {
            const { data } = await dashboardApi.getControlPending();
            return data;
        },
        refetchInterval: DASHBOARD_REFRESH_INTERVAL,
        staleTime: 20000,
    });
};
