import { type UserRole } from '../stores/useAuthStore';

/**
 * Returns the default route for a given user role after login
 */
export const getDefaultRouteForRole = (role: UserRole): string => {
    const roleRoutes: Record<UserRole, string> = {
        ADMINISTRATOR: '/dashboard/admin',
        SUPERVISOR: '/dashboard/supervisor',
        MANAGER: '/dashboard/manager',
        AGENT_QUAI: '/queue',
    };

    return roleRoutes[role] || '/';
};

/**
 * Returns a user-friendly label for a given role
 */
export const getRoleLabel = (role: UserRole): string => {
    const roleLabels: Record<UserRole, string> = {
        ADMINISTRATOR: 'Administrateur du site',
        SUPERVISOR: 'Superviseur',
        MANAGER: 'Manager',
        AGENT_QUAI: 'Agent de Quai',
    };

    return roleLabels[role] || role;
};
