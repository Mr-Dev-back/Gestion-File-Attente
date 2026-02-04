import { api } from './api';

export const dashboardApi = {
    // Admin endpoints
    getAdminStats: () => api.get('/dashboard/admin/stats'),
    getAdminRecentActivity: () => api.get('/dashboard/admin/recent-activity'),

    // Supervisor endpoints
    getSupervisorStats: () => api.get('/dashboard/supervisor/stats'),
    getSupervisorDepartments: () => api.get('/dashboard/supervisor/departments'),

    // Manager endpoints
    getManagerStats: (department?: string) =>
        api.get('/dashboard/manager/stats', { params: { department } }),
    getManagerPerformance: (department?: string) =>
        api.get('/dashboard/manager/performance', { params: { department } }),

    // Sales endpoints
    getSalesStats: () => api.get('/dashboard/sales/stats'),
    getSalesSummary: () => api.get('/dashboard/sales/summary'),

    // Control endpoints
    getControlStats: () => api.get('/dashboard/control/stats'),
    getControlPending: () => api.get('/dashboard/control/pending'),
};
