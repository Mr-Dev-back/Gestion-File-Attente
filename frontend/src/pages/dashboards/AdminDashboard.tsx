import { useAuthStore } from '../../stores/useAuthStore';
import { StatCard } from '../../components/organisms/dashboard/StatCard';
import { QuickActionCard } from '../../components/organisms/dashboard/QuickActionCard';
import { RecentActivityList, type Activity as ActivityItem } from '../../components/organisms/dashboard/RecentActivityList';
import { useAdminStats, useAdminRecentActivity } from '../../hooks/useDashboardStats';
import {
    Users,
    Truck,
    Activity,
    Settings,
    BarChart3,
    UserCog,
    FileText,
    Shield
} from 'lucide-react';

export default function AdminDashboard() {
    const { user } = useAuthStore();
    const { data: stats, isLoading: statsLoading } = useAdminStats();
    const { data: activityData, isLoading: activityLoading } = useAdminRecentActivity();

    if (statsLoading) {
        return (
            <div className="p-6 space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Tableau de Bord Administrateur
                </h1>
                <p className="text-muted-foreground">
                    Bienvenue, {user?.username} - Vue d'ensemble du système SIGFA
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Utilisateurs Actifs"
                    value={stats?.activeUsers || 0}
                    icon={Users}
                    trend={{ value: 12, isPositive: true }}
                    iconColor="text-blue-600"
                    iconBgColor="bg-blue-100"
                />
                <StatCard
                    title="Tickets en Cours"
                    value={stats?.activeTickets || 0}
                    icon={Truck}
                    iconColor="text-green-600"
                    iconBgColor="bg-green-100"
                />
                <StatCard
                    title="Entrées Aujourd'hui"
                    value={stats?.todayEntries || 0}
                    icon={Activity}
                    trend={{ value: 8, isPositive: true }}
                    iconColor="text-purple-600"
                    iconBgColor="bg-purple-100"
                />
                <StatCard
                    title="Santé Système"
                    value="100%"
                    icon={Shield}
                    iconColor="text-emerald-600"
                    iconBgColor="bg-emerald-100"
                />
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions Rapides</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <QuickActionCard
                        title="Gestion Utilisateurs"
                        description="Créer, modifier ou désactiver des utilisateurs"
                        icon={UserCog}
                        href="/admin"
                        iconColor="text-blue-600"
                        iconBgColor="bg-blue-100"
                    />
                    <QuickActionCard
                        title="Rapports & Statistiques"
                        description="Consulter les rapports détaillés du système"
                        icon={BarChart3}
                        href="/admin"
                        iconColor="text-purple-600"
                        iconBgColor="bg-purple-100"
                    />
                    <QuickActionCard
                        title="Configuration Système"
                        description="Paramètres et configuration avancée"
                        icon={Settings}
                        href="/admin"
                        iconColor="text-gray-600"
                        iconBgColor="bg-gray-100"
                    />
                    <QuickActionCard
                        title="File d'Attente"
                        description="Voir la file d'attente en temps réel"
                        icon={Truck}
                        href="/queue"
                        iconColor="text-green-600"
                        iconBgColor="bg-green-100"
                    />
                    <QuickActionCard
                        title="Historique"
                        description="Consulter l'historique complet des tickets"
                        icon={FileText}
                        href="/admin"
                        iconColor="text-orange-600"
                        iconBgColor="bg-orange-100"
                    />
                </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {!activityLoading && activityData?.activities && (
                    <RecentActivityList
                        activities={activityData.activities.map(activity => {
                            let type: ActivityItem['type'] = 'info';
                            const lowerType = activity.type.toLowerCase();
                            if (['error', 'fail', 'echec', 'critical', 'danger'].some(t => lowerType.includes(t))) type = 'error';
                            else if (['warning', 'alert', 'warn'].some(t => lowerType.includes(t))) type = 'warning';
                            else if (['success', 'ok', 'created', 'updated', 'deleted', 'completed'].some(t => lowerType.includes(t))) type = 'success';

                            return {
                                id: activity.id,
                                title: activity.type,
                                description: activity.description,
                                timestamp: activity.timestamp,
                                type
                            };
                        })}
                    />
                )}

                {/* System Status */}
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 border border-primary/20">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">État du Système</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Base de données</span>
                            <span className="text-sm font-medium text-green-600">● Opérationnel</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">API Backend</span>
                            <span className="text-sm font-medium text-green-600">● Opérationnel</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">WebSocket</span>
                            <span className="text-sm font-medium text-green-600">● Connecté</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Sage X3</span>
                            <span className="text-sm font-medium text-yellow-600">● Limité</span>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
