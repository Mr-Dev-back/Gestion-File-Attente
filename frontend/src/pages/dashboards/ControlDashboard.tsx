import { useAuthStore } from '../../stores/useAuthStore';
import { StatCard } from '../../components/organisms/dashboard/StatCard';
import { QuickActionCard } from '../../components/organisms/dashboard/QuickActionCard';
import { useControlStats, useControlPending } from '../../hooks/useDashboardStats';
import {
    ClipboardCheck,
    AlertTriangle,
    CheckCircle,
    XCircle,
    List,
    BarChart3
} from 'lucide-react';
import { Card } from '../../components/molecules/ui/card';

export default function ControlDashboard() {
    const { user } = useAuthStore();
    const { data: stats, isLoading: statsLoading } = useControlStats();
    const { data: pendingData, isLoading: pendingLoading } = useControlPending();

    if (statsLoading || pendingLoading) {
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

    const pendingControls = pendingData?.tickets || [];

    return (
        <div className="p-6 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Tableau de Bord Contrôle
                </h1>
                <p className="text-muted-foreground">
                    Bienvenue, {user?.username} - Gestion du contrôle qualité
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="À Contrôler"
                    value={stats?.toControl || 0}
                    icon={ClipboardCheck}
                    iconColor="text-orange-600"
                    iconBgColor="bg-orange-100"
                />
                <StatCard
                    title="Approuvés"
                    value={stats?.approved || 0}
                    icon={CheckCircle}
                    trend={{ value: 5, isPositive: true }}
                    iconColor="text-green-600"
                    iconBgColor="bg-green-100"
                />
                <StatCard
                    title="Rejetés"
                    value={stats?.rejected || 0}
                    icon={XCircle}
                    iconColor="text-red-600"
                    iconBgColor="bg-red-100"
                />
                <StatCard
                    title="Taux de Conformité"
                    value={`${stats?.complianceRate || 0}%`}
                    icon={BarChart3}
                    iconColor="text-blue-600"
                    iconBgColor="bg-blue-100"
                />
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions Rapides</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <QuickActionCard
                        title="File d'Attente"
                        description="Voir tous les tickets"
                        icon={List}
                        href="/queue"
                        iconColor="text-blue-600"
                        iconBgColor="bg-blue-100"
                    />
                    <QuickActionCard
                        title="Rapports"
                        description="Statistiques de contrôle"
                        icon={BarChart3}
                        href="/queue"
                        iconColor="text-purple-600"
                        iconBgColor="bg-purple-100"
                    />
                    <QuickActionCard
                        title="Alertes"
                        description="Voir les non-conformités"
                        icon={AlertTriangle}
                        href="/queue"
                        iconColor="text-red-600"
                        iconBgColor="bg-red-100"
                    />
                </div>
            </div>

            {/* Pending Controls */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Tickets en Attente de Contrôle</h2>
                <Card className="p-6">
                    <div className="space-y-3">
                        {pendingControls.map((ticket: any) => (
                            <div key={ticket.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${ticket.priority === 'high' ? 'bg-red-500' :
                                        ticket.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                        }`}></div>
                                    <div>
                                        <p className="font-medium text-gray-900">{ticket.id}</p>
                                        <p className="text-sm text-muted-foreground">Catégorie: {ticket.category}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-muted-foreground">En attente: {ticket.time}</span>
                                    <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
                                        Contrôler
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
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
