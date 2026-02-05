import { NavLink } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import {
    ChevronLeft,
    Menu,
    LogOut,
} from 'lucide-react';
import { Button } from '../../atoms/ui/button';
import { useAuthStore } from '../../../stores/useAuthStore';
import { getMenuItems } from '../../../utils/menuConfig';

interface SidebarProps {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
    const { user, logout } = useAuthStore();

    if (!user) return null;

    // Get menu items dynamically based on user permissions
    const menuItems = getMenuItems(user);

    return (
        <aside className={cn(
            "fixed left-0 top-0 z-40 h-screen bg-surface border-r border-border transition-all duration-300 flex flex-col shadow-sm backdrop-blur-xl bg-opacity-90",
            collapsed ? "w-16" : "w-64"
        )}>
            <div className="flex h-16 items-center gap-3 px-4 border-b border-border/50">
                <img src="/logo.png" alt="SIGFA" className="h-8 w-8 rounded-lg shrink-0" />
                {!collapsed && <span className="text-xl font-bold tracking-tight text-primary">SIGFA</span>}
                <div className="flex-1" />
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(!collapsed)}
                    className="text-text-muted hover:text-primary hover:bg-primary/5 shrink-0"
                >
                    {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
            </div>

            <nav className="flex-1 space-y-1 p-2 py-4">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group text-sm font-medium",
                            isActive
                                ? "bg-primary/10 text-primary border-r-2 border-primary"
                                : "text-text-muted hover:bg-secondary/5 hover:text-text-main hover:translate-x-1"
                        )}
                    >
                        <item.icon className={cn("h-5 w-5 shrink-0", collapsed && "mx-auto")} />
                        {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            <div className="p-2 border-t border-border/50">
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full justify-start text-danger hover:bg-danger/10 hover:text-danger transition-colors",
                        collapsed && "justify-center px-0"
                    )}
                    onClick={logout}
                >
                    <LogOut className="h-5 w-5 shrink-0" />
                    {!collapsed && <span className="ml-3">Déconnexion</span>}
                </Button>
            </div>
        </aside>
    );
}
