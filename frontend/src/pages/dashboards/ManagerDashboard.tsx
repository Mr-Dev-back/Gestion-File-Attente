import { useAuthStore } from '../../stores/useAuthStore';
import { StatCard } from '../../components/organisms/dashboard/StatCard';
import { QuickActionCard } from '../../components/organisms/dashboard/QuickActionCard';
import { RecentActivityList } from '../../components/organisms/dashboard/RecentActivityList';
import { useManagerStats, useManagerPerformance } from '../../hooks/useDashboardStats';
import {
    Truck,
    Activity,
    TrendingUp,
    Users,
    List,
    BarChart3,
    FileText
} from 'lucide-react';

export default function ManagerDashboard() {
    const { user } = useAuthStore();
    const { data: stats, isLoading: statsLoading } = useManagerStats(user?.department);
    const { data: performance, isLoading: perfLoading } = useManagerPerformance(user?.department);

    const departmentLabel = user?.department === 'INFRA' ? 'Infrastructure' :
        user?.department === 'BATIMENT' ? 'Bâtiment' :
            user?.department === 'ELECT' ? 'Électricité' : 'Tous';

    if (statsLoading || perfLoading) {
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

    const recentActivities = [
        {
            id: '1',
            title: 'Ticket complété',
            description: `Ticket - ${departmentLabel}`,
            timestamp: 'Il y a 3 minutes',
            type: 'success' as const
        }
    ];

    return (
        <div className="p-6 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Tableau de Bord Manager
                </h1>
                <p className="text-muted-foreground">
                    Bienvenue, {user?.username} - Département: {departmentLabel}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Tickets Aujourd'hui"
                    value={stats?.todayTickets || 0}
                    icon={Truck}
                    trend={{ value: 15, isPositive: true }}
                    iconColor="text-blue-600"
                    iconBgColor="bg-blue-100"
                />
                <StatCard
                    title="En Attente"
                    value={stats?.pendingTickets || 0}
                    icon={Activity}
                    iconColor="text-orange-600"
                    iconBgColor="bg-orange-100"
                />
                <StatCard
                    title="Complétés"
                    value={stats?.completedToday || 0}
                    icon={TrendingUp}
                    trend={{ value: 8, isPositive: true }}
                    iconColor="text-green-600"
                    iconBgColor="bg-green-100"
                />
                <StatCard
                    title="Temps Moyen"
                    value={`${stats?.avgWaitTime || 0}min`}
                    icon={Activity}
                    iconColor="text-purple-600"
                    iconBgColor="bg-purple-100"
                />
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions Rapides</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <QuickActionCard
                        title="File d'Attente"
                        description="Voir la file d'attente en temps réel"
                        icon={List}
                        href="/queue"
                        iconColor="text-blue-600"
                        iconBgColor="bg-blue-100"
                    />
                    <QuickActionCard
                        title="Rapports"
                        description="Consulter les rapports du département"
                        icon={BarChart3}
                        href="/queue"
                        iconColor="text-purple-600"
                        iconBgColor="bg-purple-100"
                    />
                    <QuickActionCard
                        title="Historique"
                        description="Voir l'historique des tickets"
                        icon={FileText}
                        href="/queue"
                        iconColor="text-gray-600"
                        iconBgColor="bg-gray-100"
                    />
                </div>
            </div>

            {/* Recent Activity & Department Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecentActivityList activities={recentActivities} />

                {/* Department Performance */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        Performance du Département
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">Taux de Complétion</span>
                                <span className="text-sm font-medium text-gray-900">{performance?.completionRate || 0}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${performance?.completionRate || 0}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">Efficacité</span>
                                <span className="text-sm font-medium text-gray-900">{performance?.efficiency || 0}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${performance?.efficiency || 0}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">Satisfaction</span>
                                <span className="text-sm font-medium text-gray-900">{performance?.satisfaction || 0}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${performance?.satisfaction || 0}%` }}></div>
                            </div>
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
