import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useNotificationStore } from '../../../stores/useNotificationStore';
import { Bell, Search, User, Check, AlertTriangle, Info, X } from 'lucide-react';
import { Button } from '../../atoms/ui/button';
import { Input } from '../../atoms/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import axios from 'axios';
import { cn } from '../../../lib/utils';

export function Topbar() {
    const { user } = useAuthStore();
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotificationStore();
    const [isOnline, setIsOnline] = useState(window.navigator.onLine);
    const [isServerUp, setIsServerUp] = useState(true);
    const [showNotifications, setShowNotifications] = useState(false);

    // Track online/offline status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Periodic health check
        const checkHealth = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                await axios.get(`${API_URL}/health`, { timeout: 3000 });
                setIsServerUp(true);
            } catch (err) {
                setIsServerUp(false);
            }
        };

        const interval = setInterval(checkHealth, 10000);
        checkHealth();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    const getStatusConfig = () => {
        if (!isOnline) return { color: 'bg-danger', text: 'Hors Ligne (Internet)' };
        if (!isServerUp) return { color: 'bg-warning', text: 'Serveur Déconnecté' };
        return { color: 'bg-success', text: 'Système Connecté' };
    };

    const status = getStatusConfig();

    return (
        <header className="h-16 flex items-center justify-between px-6 bg-surface border-b border-border shadow-sm sticky top-0 z-30">
            <div className="flex items-center gap-4 w-96">
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-muted" />
                    <Input placeholder="Rechercher..." className="pl-9 bg-background/50 border-transparent focus:bg-background" />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-background/50 rounded-full border border-border/50">
                    <div className={cn("h-2 w-2 rounded-full animate-pulse", status.color)} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{status.text}</span>
                </div>

                <div className="relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("relative transition-all", showNotifications && "bg-primary/10 text-primary")}
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 flex h-4 w-4 transform translate-x-1/2 -translate-y-1/2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-danger text-[10px] font-bold transition-all text-white items-center justify-center">
                                    {unreadCount}
                                </span>
                            </span>
                        )}
                    </Button>

                    {showNotifications && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                            <div className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-4 border-b border-border flex items-center justify-between bg-primary/5">
                                    <h3 className="font-bold text-sm">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={() => markAllAsRead()}
                                            className="text-[10px] text-primary hover:underline font-bold uppercase"
                                        >
                                            Tout lire
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center text-text-muted">
                                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                            <p className="text-xs">Aucune notification</p>
                                        </div>
                                    ) : (
                                        notifications.map((n) => (
                                            <div
                                                key={n.id}
                                                className={cn(
                                                    "p-4 border-b border-border hover:bg-background transition-colors relative flex gap-3",
                                                    !n.read && "bg-primary/[0.02]"
                                                )}
                                                onClick={() => markAsRead(n.id)}
                                            >
                                                <div className={cn(
                                                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                                                    n.type === 'success' ? "bg-success/10 text-success" :
                                                        n.type === 'warning' ? "bg-warning/10 text-warning" :
                                                            n.type === 'error' ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"
                                                )}>
                                                    {n.type === 'success' ? <Check className="h-4 w-4" /> :
                                                        n.type === 'warning' ? <AlertTriangle className="h-4 w-4" /> :
                                                            n.type === 'error' ? <X className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className={cn("text-xs font-bold leading-tight", n.read ? "text-text-main" : "text-primary")}>{n.title}</p>
                                                    <p className="text-[11px] text-text-muted mt-0.5 line-clamp-2">{n.message}</p>
                                                    <p className="text-[9px] text-text-muted mt-2 opacity-70">
                                                        {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true, locale: fr })}
                                                    </p>
                                                </div>
                                                {!n.read && (
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                                {notifications.length > 0 && (
                                    <div className="p-3 bg-background border-t border-border flex justify-center">
                                        <button
                                            onClick={clearNotifications}
                                            className="text-[10px] text-text-muted hover:text-danger font-bold uppercase transition-colors"
                                        >
                                            Effacer l'historique
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="h-8 w-[1px] bg-border mx-2" />

                <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-text-main">{user?.username || 'Utilisateur'}</p>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider opacity-70">{user?.role?.replace('_', ' ') || 'Invité'}</p>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                        <User className="h-5 w-5 text-primary" />
                    </div>
                </div>
            </div>
        </header>
    );
}
