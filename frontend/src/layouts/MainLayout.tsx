import { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from '../components/organisms/layout/Sidebar';
import { Topbar } from '../components/organisms/layout/Topbar';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import { socket } from '../lib/socket';
import { cn } from '../lib/utils';

export function MainLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const { user } = useAuthStore();
    const { addNotification } = useNotificationStore();

    const playNotificationSound = () => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
            oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.5); // A4

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.warn('Audio notification failed:', e);
        }
    };
    useEffect(() => {
        if (!user) return;

        // Listen for new tickets
        socket.on('new-ticket', (data: any) => {
            addNotification({
                title: 'Nouveau Camion',
                message: `Le camion ${data.licensePlate} (${data.ticketNumber}) vient d'arriver au poste de contrôle.`,
                type: 'info'
            });
            // Sound for Sales/Admin on new registration
            if (user?.role === 'AGENT_QUAI' || user?.role === 'ADMINISTRATOR') {
                playNotificationSound();
            }
        });

        // Listen for status updates
        socket.on('ticket-status-updated', (data: any) => {
            let message = '';
            let type: 'info' | 'success' | 'warning' | 'error' = 'info';

            switch (data.status) {
                case 'APPELÉ':
                    message = `Le camion ${data.ticketNumber} est appelé vers zone ${data.zone || 'de chargement'}.`;
                    type = 'success';
                    break;
                case 'PESÉ_ENTRÉE':
                    message = `Première pesée effectuée pour ${data.ticketNumber}.`;
                    // Specific sound for Sales Agent
                    if (user?.role === 'AGENT_QUAI' || user?.role === 'ADMINISTRATOR') {
                        playNotificationSound();
                    }
                    break;
                case 'PESÉ_SORTIE':
                    message = `Pesée de sortie terminée pour ${data.ticketNumber}.`;
                    type = 'success';
                    break;
                case 'TERMINÉ':
                    message = `Le ticket ${data.ticketNumber} est clôturé.`;
                    break;
            }

            if (message) {
                addNotification({
                    title: 'Mise à jour Ticket',
                    message,
                    type
                });
            }
        });

        return () => {
            socket.off('new-ticket');
            socket.off('ticket-status-updated');
        };
    }, [user, addNotification]);

    // Protect routes
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

            <div className={cn(
                "flex-1 flex flex-col transition-all duration-300 min-h-screen",
                collapsed ? "pl-16" : "pl-64"
            )}>
                <Topbar />
                <main className="flex-1 p-6 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
