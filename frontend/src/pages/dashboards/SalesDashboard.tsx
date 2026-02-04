import { useAuthStore } from '../../stores/useAuthStore';
import { StatCard } from '../../components/organisms/dashboard/StatCard';
import { QuickActionCard } from '../../components/organisms/dashboard/QuickActionCard';
import { RecentActivityList } from '../../components/organisms/dashboard/RecentActivityList';
import { useSalesStats, useSalesSummary } from '../../hooks/useDashboardStats';
import {
    DollarSign,
    FileText,
    TrendingUp,
    Clock,
    List,
    BarChart3,
    Receipt
} from 'lucide-react';

export default function SalesDashboard() {
    const { user } = useAuthStore();
    const { data: stats, isLoading: statsLoading } = useSalesStats();
    const { data: summary, isLoading: summaryLoading } = useSalesSummary();

    if (statsLoading || summaryLoading) {
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
            title: 'Facture générée',
            description: 'Ticket facturé',
            timestamp: 'Il y a 2 minutes',
            type: 'success' as const
        }
    ];

    return (
        <div className="p-6 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Tableau de Bord Commercial
                </h1>
                <p className="text-muted-foreground">
                    Bienvenue, {user?.username} - Gestion des ventes et facturations
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Ventes Aujourd'hui"
                    value={`${stats?.todaySales?.toLocaleString() || 0} FCFA`}
                    icon={DollarSign}
                    trend={{ value: 18, isPositive: true }}
                    iconColor="text-green-600"
                    iconBgColor="bg-green-100"
                />
                <StatCard
                    title="Factures en Attente"
                    value={stats?.pendingInvoices || 0}
                    icon={Clock}
                    iconColor="text-orange-600"
                    iconBgColor="bg-orange-100"
                />
                <StatCard
                    title="Complétées"
                    value={stats?.completedToday || 0}
                    icon={FileText}
                    trend={{ value: 12, isPositive: true }}
                    iconColor="text-blue-600"
                    iconBgColor="bg-blue-100"
                />
                <StatCard
                    title="Valeur Moyenne"
                    value={`${stats?.avgTicketValue?.toLocaleString() || 0} FCFA`}
                    icon={TrendingUp}
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
                        description="Voir les tickets en attente"
                        icon={List}
                        href="/queue"
                        iconColor="text-blue-600"
                        iconBgColor="bg-blue-100"
                    />
                    <QuickActionCard
                        title="Facturation"
                        description="Générer des factures"
                        icon={Receipt}
                        href="/queue"
                        iconColor="text-green-600"
                        iconBgColor="bg-green-100"
                    />
                    <QuickActionCard
                        title="Rapports de Ventes"
                        description="Consulter les statistiques"
                        icon={BarChart3}
                        href="/queue"
                        iconColor="text-purple-600"
                        iconBgColor="bg-purple-100"
                    />
                </div>
            </div>

            {/* Recent Activity & Sales Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecentActivityList activities={recentActivities} />

                {/* Sales Summary */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        Résumé des Ventes
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-green-200">
                            <span className="text-sm text-gray-600">Aujourd'hui</span>
                            <span className="text-lg font-bold text-green-700">{summary?.today?.toLocaleString() || 0} FCFA</span>
                        </div>
                        <div className="flex items-center justify-between pb-3 border-b border-green-200">
                            <span className="text-sm text-gray-600">Cette Semaine</span>
                            <span className="text-lg font-bold text-green-700">{summary?.week?.toLocaleString() || 0} FCFA</span>
                        </div>
                        <div className="flex items-center justify-between pb-3 border-b border-green-200">
                            <span className="text-sm text-gray-600">Ce Mois</span>
                            <span className="text-lg font-bold text-green-700">{summary?.month?.toLocaleString() || 0} FCFA</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Objectif Mensuel</span>
                            <span className="text-sm font-medium text-gray-900">{summary?.goalProgress || 0}% atteint</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${summary?.goalProgress || 0}%` }}></div>
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
