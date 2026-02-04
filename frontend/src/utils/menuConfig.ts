import { type UserRole } from '../stores/useAuthStore';
import {
    LayoutDashboard,
    Home,
    ListOrdered,
    Scale,
    Settings,
    type LucideIcon
} from 'lucide-react';

export interface MenuItem {
    label: string;
    icon: LucideIcon;
    path: string;
    roles: UserRole[];
}

/**
 * All available menu items in the application
 */
const allMenuItems: MenuItem[] = [
    {
        label: 'Borne / Entrée',
        icon: Home,
        path: '/',
        roles: ['SUPERVISOR', 'MANAGER', 'ADMINISTRATOR', 'AGENT_QUAI']
    },
    {
        label: 'File d\'Attente',
        icon: ListOrdered,
        path: '/queue',
        roles: ['SUPERVISOR', 'MANAGER', 'ADMINISTRATOR', 'AGENT_QUAI']
    },
    {
        label: 'Pont Bascule',
        icon: Scale,
        path: '/weighing',
        roles: ['SUPERVISOR', 'ADMINISTRATOR', 'AGENT_QUAI']
    },
    {
        label: 'Administration',
        icon: Settings,
        path: '/admin',
        roles: ['ADMINISTRATOR', 'SUPERVISOR']
    }
];

/**
 * Dashboard menu items for each role
 */
const dashboardMenuItems: Record<UserRole, MenuItem> = {
    ADMINISTRATOR: {
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/dashboard/admin',
        roles: ['ADMINISTRATOR']
    },
    SUPERVISOR: {
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/dashboard/supervisor',
        roles: ['SUPERVISOR']
    },
    MANAGER: {
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/dashboard/manager',
        roles: ['MANAGER']
    },
    AGENT_QUAI: {
        label: 'File d\'Attente',
        icon: ListOrdered,
        path: '/queue',
        roles: ['AGENT_QUAI']
    }
};

/**
 * Returns the menu items for a specific user role
 * Dashboard is always first, followed by accessible menu items
 */
export const getMenuItemsForRole = (role: UserRole): MenuItem[] => {
    // Get the dashboard item for this role
    const dashboardItem = dashboardMenuItems[role];

    // For operational agents (AGENT_QUAI), only show their main interface
    if (role === 'AGENT_QUAI') {
        return [dashboardItem];
    }



    // For other roles, filter menu items they have access to
    const accessibleItems = allMenuItems.filter(item => item.roles.includes(role));

    // Return dashboard first, then other accessible items
    return [dashboardItem, ...accessibleItems];
};
