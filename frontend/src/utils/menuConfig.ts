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
    roles?: UserRole[]; // Optional now
    requiredPermission?: string;
}

/**
 * All available menu items in the application
 */
const allMenuItems: MenuItem[] = [
    {
        label: 'Borne / Entrée',
        icon: Home,
        path: '/',
        // Public or basic access
    },
    {
        label: 'File d\'Attente',
        icon: ListOrdered,
        path: '/queue',
        requiredPermission: 'queue:read'
    },
    {
        label: 'Pont Bascule',
        icon: Scale,
        path: '/weighing',
        requiredPermission: 'ticket:status'
    },
    {
        label: 'Administration',
        icon: Settings,
        path: '/admin',
        requiredPermission: 'config:read' // Or user:read
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
 * Returns the menu items for a specific user based on Role AND Permissions
 */
export const getMenuItems = (user: any): MenuItem[] => {
    if (!user) return [];

    // Get the dashboard item for this role (Legacy/Role-based dashboard still applies)
    const role = user.role as UserRole;
    const dashboardItem = dashboardMenuItems[role];

    // Filter common items based on permissions
    const accessibleItems = allMenuItems.filter(item => {
        // If specific roles defined, check them (Legacy support)
        if (item.roles && item.roles.length > 0) {
            if (!item.roles.includes(role)) return false;
        }

        // Check permission if required
        if (item.requiredPermission) {
            // Admin always has access
            if (role === 'ADMINISTRATOR') return true;

            // Check if user has permission
            if (!user.permissions?.includes(item.requiredPermission)) {
                return false;
            }
        }

        return true;
    });

    const items = dashboardItem ? [dashboardItem, ...accessibleItems] : accessibleItems;

    // Deduplicate by path
    const uniqueItems = items.filter((item, index, self) =>
        index === self.findIndex((t) => (
            t.path === item.path
        ))
    );

    return uniqueItems;
};
export const getMenuItemsForRole = (role: UserRole) => getMenuItems({ role, permissions: [] }); // Fallback
