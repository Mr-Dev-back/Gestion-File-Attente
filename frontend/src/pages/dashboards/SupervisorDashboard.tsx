import { useAuthStore } from '../../stores/useAuthStore';
import { StatCard } from '../../components/organisms/dashboard/StatCard';
import { QuickActionCard } from '../../components/organisms/dashboard/QuickActionCard';
import { useSupervisorStats, useSupervisorDepartments } from '../../hooks/useDashboardStats';
import {
    Truck,
    Activity,
    Building2,
    List,
    BarChart3,
    Users,
    AlertTriangle
} from 'lucide-react';
import { Card } from '../../components/molecules/ui/card';

export default function SupervisorDashboard() {
    const { user } = useAuthStore();
    const { data: stats, isLoading: statsLoading } = useSupervisorStats();
    const { data: deptData, isLoading: deptLoading } = useSupervisorDepartments();

    if (statsLoading || deptLoading) {
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

    const departmentStats = deptData?.departments || [];

    return (
        <div className="p-6 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Tableau de Bord Superviseur
                </h1>
                <p className="text-muted-foreground">
                    Bienvenue, {user?.username} - Vue multi-départements
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Tickets"
                    value={stats?.totalTickets || 0}
                    icon={Truck}
                    trend={{ value: 12, isPositive: true }}
                    iconColor="text-blue-600"
                    iconBgColor="bg-blue-100"
                />
                <StatCard
                    title="Tickets Actifs"
                    value={stats?.activeTickets || 0}
                    icon={Activity}
                    iconColor="text-green-600"
                    iconBgColor="bg-green-100"
                />
                <StatCard
                    title="Départements"
                    value={stats?.departments || 0}
                    icon={Building2}
                    iconColor="text-purple-600"
                    iconBgColor="bg-purple-100"
                />
                <StatCard
                    title="Alertes"
                    value={stats?.alerts || 0}
                    icon={AlertTriangle}
                    iconColor="text-red-600"
                    iconBgColor="bg-red-100"
                />
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions Rapides</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <QuickActionCard
                        title="File d'Attente"
                        description="Vue globale en temps réel"
                        icon={List}
                        href="/queue"
                        iconColor="text-blue-600"
                        iconBgColor="bg-blue-100"
                    />
                    <QuickActionCard
                        title="Rapports"
                        description="Statistiques détaillées"
                        icon={BarChart3}
                        href="/queue"
                        iconColor="text-purple-600"
                        iconBgColor="bg-purple-100"
                    />
                    <QuickActionCard
                        title="Gestion Utilisateurs"
                        description="Voir les utilisateurs actifs"
                        icon={Users}
                        href="/admin"
                        iconColor="text-green-600"
                        iconBgColor="bg-green-100"
                    />
                    <QuickActionCard
                        title="Pesée"
                        description="Interface de pesée"
                        icon={Activity}
                        href="/weighing"
                        iconColor="text-orange-600"
                        iconBgColor="bg-orange-100"
                    />
                </div>
            </div>

            {/* Department Overview */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Vue par Département</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {departmentStats.map((dept) => (
                        <Card key={dept.name} className="p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-3 h-3 rounded-full ${dept.color}`}></div>
                                <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Total</span>
                                    <span className="text-2xl font-bold text-gray-900">{dept.tickets}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">En attente</span>
                                    <span className="text-lg font-semibold text-orange-600">{dept.pending}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Complétés</span>
                                    <span className="text-lg font-semibold text-green-600">{dept.tickets - dept.pending}</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Alerts Section */}
            {stats?.alerts && stats.alerts > 0 && (
                <Card className="p-6 border-l-4 border-l-red-500 bg-red-50">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-red-900 mb-2">Alertes Actives</h3>
                            <ul className="space-y-2 text-sm text-red-800">
                                <li>• Temps d'attente élevé pour le département Bâtiment</li>
                                <li>• 2 tickets en retard de traitement</li>
                            </ul>
                        </div>
                    </div>
                </Card>
            )}

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
