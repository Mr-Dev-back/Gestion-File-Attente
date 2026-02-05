import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/molecules/ui/table';
import { Badge } from '../components/atoms/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/molecules/ui/card';
import { Button } from '../components/atoms/ui/button';
import { Search, RefreshCcw, Megaphone, ArrowUp, Clock, Truck as TruckIcon, Printer, ArrowRightLeft, ListOrdered, Eye, CheckCircle2, Scale } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from '../components/molecules/ui/toast';
import { useTruckStore, type TruckPriority } from '../stores/useTruckStore';
import { printTicket } from '../utils/printTicket';
import { useAuthStore } from '../stores/useAuthStore';
import { api } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { useQueueStatus } from '../hooks/useQueueStatus';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/molecules/ui/tooltip';

const priorityMap = {
    CRITIQUE: { label: 'Critique', variant: 'destructive' as const, glow: 'shadow-[0_0_15px_rgba(239,68,68,0.5)]' },
    URGENT: { label: 'Urgent', variant: 'warning' as const, glow: 'shadow-[0_0_15px_rgba(245,158,11,0.5)]' },
    NORMAL: { label: 'Normal', variant: 'secondary' as const, glow: '' },
};

const zones = ['ZONE INFRA', 'ZONE ELEC', 'ZONE BAT', 'ZONE ATTENTE'];

export default function Queue() {
    const { updateStatus, transferTicket } = useTruckStore();
    const { user } = useAuthStore();
    const { queueStatus, isLoading: isQueueLoading, refetch } = useQueueStatus(user?.siteId);
    const { isConnected } = useSocket(user?.siteId);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterPriority, setFilterPriority] = useState<string | null>(null);
    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null);
    const [targetCategory, setTargetCategory] = useState<string>('');
    const [priorityModalOpen, setPriorityModalOpen] = useState(false);
    const [priorityReason, setPriorityReason] = useState('');
    const [targetPriority, setTargetPriority] = useState<TruckPriority>('NORMAL');

    const totalInFile = Object.values(queueStatus).reduce((sum, cat) => sum + cat.count, 0);
    const waitingCount = Object.values(queueStatus).reduce((sum, cat) => sum + cat.tickets.filter(t => t.status === 'EN_ATTENTE' || t.status === 'PESÉ_ENTRÉE').length, 0);
    const calledCount = Object.values(queueStatus).reduce((sum, cat) => sum + cat.tickets.filter(t => t.status === 'APPELÉ').length, 0);
    const criticalCount = Object.values(queueStatus).reduce((sum, cat) => sum + cat.tickets.filter(t => t.priority === 'CRITIQUE').length, 0);

    const handleCall = async (id: string, currentCategory: string) => {
        let zone = 'ZONE ATTENTE';
        switch (currentCategory) {
            case 'BATIMENT': zone = 'ZONE BAT'; break;
            case 'INFRA': zone = 'ZONE INFRA'; break;
            case 'ELECT': zone = 'ZONE ELEC'; break;
            default: zone = zones[Math.floor(Math.random() * zones.length)];
        }
        try {
            await updateStatus(id, 'APPELÉ', { callZone: zone });
            toast(`Camion appelé - Vers ${zone}`, 'success');
        } catch (error) {
            toast('Erreur lors de l\'appel', 'error');
        }
    };



    const handleTransfer = async () => {
        if (!selectedTruckId || !targetCategory) return;
        try {
            const result = await transferTicket(selectedTruckId, targetCategory);
            toast(`Ticket transféré : ${result.oldTicketNumber} → ${result.newTicketNumber}`, 'success');
            setTransferModalOpen(false);
            setSelectedTruckId(null);
            setTargetCategory('');
        } catch (error) {
            toast('Erreur lors du transfert', 'error');
        }
    };

    const openTransferModal = (id: string, currentCategory: string) => {
        setSelectedTruckId(id);
        const categories = ['BATIMENT', 'INFRA', 'ELECT'];
        const otherCategories = categories.filter(c => c !== currentCategory);
        setTargetCategory(otherCategories[0] || '');
        setTransferModalOpen(true);
    };

    const openDetailsModal = (id: string) => {
        setSelectedTruckId(id);
        setDetailsModalOpen(true);
    };

    const handlePriorityClick = (id: string, currentPriority: TruckPriority) => {
        setSelectedTruckId(id);
        setTargetPriority(currentPriority === 'NORMAL' ? 'URGENT' : 'CRITIQUE');
        setPriorityReason('');
        setPriorityModalOpen(true);
    };

    const confirmPriorityChange = async () => {
        if (!selectedTruckId) return;
        if (targetPriority === 'CRITIQUE' && !priorityReason.trim()) {
            toast('Une justification est requise pour la priorité CRITIQUE', 'warning');
            return;
        }

        try {
            await updateStatus(selectedTruckId, 'EN_ATTENTE', { // We use current status if available from somewhere, but usually status doesn't change here
                priority: targetPriority,
                priorityReason: priorityReason
            });
            toast(`Priorité mise à jour : ${targetPriority}`, 'success');
            setPriorityModalOpen(false);
            setSelectedTruckId(null);
            setPriorityReason('');
        } catch (error) {
            toast('Erreur mise à jour priorité', 'error');
        }
    };

    const handleReprint = async (truck: any) => {
        try {
            await api.post(`/tickets/${truck.id}/log-print`);
            printTicket(truck);
            toast('Réimpression journalisée', 'success');
        } catch (error) {
            console.error('Failed to log reprint:', error);
            printTicket(truck);
        }
    };

    const stats = {
        total: totalInFile,
        waiting: waitingCount,
        called: calledCount,
        critical: criticalCount,
    };

    return (
        <div className="space-y-8 relative pb-20">
            {/* Decorative Background Elements */}
            <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 animate-pulse-slow pointer-events-none" />
            <div className="absolute bottom-[100px] left-[-200px] w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[100px] -z-10 animate-pulse-slow pointer-events-none" style={{ animationDelay: '1.5s' }} />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/20 bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] shadow-sm animate-fade-in hover:shadow-md transition-all duration-500">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-2xl text-white shadow-lg shadow-primary/30 transform rotate-3">
                        <ListOrdered className="h-10 w-10" />
                    </div>
                    <div>
                        <h2 className="text-5xl font-black tracking-tighter text-text-main flex items-center gap-3">
                            File d'Attente
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className={cn(
                                            "w-3 h-3 rounded-full mt-4",
                                            isConnected ? "bg-success animate-pulse" : "bg-danger"
                                        )} />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{isConnected ? 'Synchronisation temps réel active' : 'Connexion perdue - Reconnexion en cours...'}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </h2>
                        <p className="text-text-muted font-bold tracking-wide mt-1 text-lg uppercase opacity-70">
                            Orchestration des flux camions
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
                        <input
                            placeholder="Rechercher..."
                            className="w-full h-12 pl-11 pr-4 rounded-xl border border-white/40 bg-white/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-muted/50 text-text-main shadow-sm"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => refetch()}
                        className="bg-white/50 backdrop-blur-sm border-white/50 hover:bg-white/80 shadow-sm rounded-xl"
                    >
                        <RefreshCcw className={cn("mr-2 h-5 w-5", isQueueLoading && "animate-spin")} />
                        Rafraîchir
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-4">
                {[
                    { label: 'Total en File', value: stats.total, icon: TruckIcon, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'En Attente', value: stats.waiting, icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
                    { label: 'Appelés', value: stats.called, icon: Megaphone, color: 'text-success', bg: 'bg-success/10' },
                    { label: 'Critiques', value: stats.critical, icon: ArrowUp, color: 'text-danger', bg: 'bg-danger/10' }
                ].map((stat, idx) => (
                    <div key={idx} className="relative overflow-hidden rounded-[2rem] p-6 backdrop-blur-md border border-white/40 bg-white/60 shadow-lg transition-all duration-300 hover:scale-[1.03] group">
                        <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -mr-10 -mt-10 opacity-50", stat.bg)} />
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-sm font-bold text-text-muted uppercase tracking-wider mb-1">{stat.label}</p>
                                <p className={cn("text-5xl font-black tracking-tighter", stat.color)}>{stat.value}</p>
                            </div>
                            <div className={cn("p-4 rounded-2xl shadow-inner", stat.bg)}>
                                <stat.icon className={cn("h-8 w-8", stat.color)} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Category Boards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {Object.entries(queueStatus).map(([prefix, data]) => {
                    const filteredTickets = data.tickets.filter(t =>
                        t.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        t.driverName.toLowerCase().includes(searchQuery.toLowerCase())
                    );

                    if (searchQuery && filteredTickets.length === 0) return null;

                    return (
                        <div key={prefix} className="flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: data.category.color }} />
                                    <h3 className="text-2xl font-black tracking-tight text-text-main uppercase">{data.category.name}</h3>
                                </div>
                                <Badge variant="secondary" className="bg-white/50 backdrop-blur-sm text-text-main font-bold px-3 py-1 rounded-full border-white/40">
                                    {data.count} camions
                                </Badge>
                            </div>

                            <Card className="border-0 shadow-xl bg-white/40 backdrop-blur-xl rounded-[2rem] overflow-hidden flex-1 border border-white/20">
                                <CardContent className="p-4 space-y-4">
                                    {filteredTickets.map((ticket) => (
                                        <div
                                            key={ticket.id}
                                            className={cn(
                                                "relative p-5 rounded-2xl border transition-all duration-300 group hover:shadow-2xl hover:-translate-y-1 overflow-hidden",
                                                ticket.priority === 'CRITIQUE' ? "bg-danger/5 border-danger/30 shadow-danger/5" :
                                                    ticket.priority === 'URGENT' ? "bg-warning/5 border-warning/30 shadow-warning/5" :
                                                        "bg-white/60 border-white/50 shadow-sm"
                                            )}
                                        >
                                            {/* Priority Glow Effect */}
                                            {ticket.priority !== 'NORMAL' && (
                                                <div className={cn(
                                                    "absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl -mr-10 -mt-10 opacity-40",
                                                    ticket.priority === 'CRITIQUE' ? "bg-danger" : "bg-warning"
                                                )} />
                                            )}

                                            <div className="flex items-start justify-between relative z-10">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-xl flex items-center justify-center text-sm font-black shadow-inner",
                                                        ticket.priority === 'CRITIQUE' ? "bg-danger text-white" :
                                                            ticket.priority === 'URGENT' ? "bg-warning text-white" :
                                                                "bg-primary/10 text-primary"
                                                    )}>
                                                        {ticket.position}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-xl tracking-tight text-text-main font-mono">
                                                            {ticket.licensePlate}
                                                        </div>
                                                        <div className="text-xs font-bold text-text-muted/70 uppercase flex items-center gap-1.5">
                                                            <Clock className="h-3 w-3" />
                                                            Attente : {ticket.estimatedWait} min
                                                        </div>
                                                    </div>
                                                </div>
                                                <Badge
                                                    variant={priorityMap[ticket.priority as TruckPriority].variant}
                                                    className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border-0"
                                                >
                                                    {ticket.priority}
                                                </Badge>
                                            </div>

                                            <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-text-muted leading-none">CHAUFFEUR</span>
                                                    <span className="text-sm font-bold text-text-main truncate max-w-[120px]">{ticket.driverName}</span>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    {ticket.status === 'EN_ATTENTE' || ticket.status === 'PESÉ_ENTRÉE' ? (
                                                        <Button
                                                            size="sm"
                                                            className="h-9 px-4 bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl font-bold text-xs group"
                                                            onClick={() => handleCall(ticket.id, prefix)}
                                                        >
                                                            <Megaphone className="h-3.5 w-3.5 mr-2 group-hover:scale-125 transition-transform" />
                                                            APPELER
                                                        </Button>
                                                    ) : (
                                                        <Badge variant="success" className="h-9 px-4 rounded-xl animate-pulse font-black text-xs border-0">
                                                            {ticket.status === 'APPELÉ' ? 'APPELÉ' : 'EN COURS'}
                                                        </Badge>
                                                    )}

                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-9 w-9 text-text-muted hover:text-primary hover:bg-primary/5 rounded-xl"
                                                                    onClick={() => handlePriorityClick(ticket.id, ticket.priority)}
                                                                >
                                                                    <ArrowUp className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Priorité</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-9 w-9 text-text-muted hover:text-primary hover:bg-primary/5 rounded-xl"
                                                                    onClick={() => openDetailsModal(ticket.id)}
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Détails</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {filteredTickets.length === 0 && (
                                        <div className="py-12 flex flex-col items-center justify-center opacity-40">
                                            <div className="p-4 bg-black/5 rounded-full mb-3">
                                                <RefreshCcw className="h-8 w-8 text-text-muted" />
                                            </div>
                                            <p className="font-bold text-xs uppercase tracking-widest text-text-muted">Aucun ticket actif</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    );
                })}
            </div>

            {/* Empty State if no categories found */}
            {Object.keys(queueStatus).length === 0 && !isQueueLoading && (
                <div className="flex flex-col items-center justify-center py-32 text-center bg-white/20 backdrop-blur-md rounded-[3rem] border border-white/30 shadow-inner">
                    <div className="bg-white/50 p-8 rounded-full mb-6 shadow-xl animate-bounce-slow">
                        <TruckIcon className="h-20 w-20 text-primary/30" />
                    </div>
                    <h3 className="text-3xl font-black text-text-main tracking-tight">Aucun camion en vue</h3>
                    <p className="text-text-muted mt-2 max-w-sm font-medium">
                        Les files d'attente sont actuellement vides pour ce site.
                    </p>
                </div>
            )}

            {isQueueLoading && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse space-y-4">
                            <div className="h-8 w-48 bg-white/30 rounded-lg" />
                            <div className="h-[400px] bg-white/30 rounded-[2.5rem]" />
                        </div>
                    ))}
                </div>
            )}

            {/* Transfer Modal - Styled */}
            {transferModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200" onClick={() => setTransferModalOpen(false)}>
                    <div className="bg-white/90 backdrop-blur-2xl rounded-[2rem] p-8 max-w-md w-full mx-4 shadow-2xl border border-white/50 transform transition-all scale-100" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                <ArrowRightLeft className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-text-main">Transférer le Ticket</h3>
                                <p className="text-sm text-text-muted font-medium">Changement de file d'attente</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold uppercase text-text-muted mb-3 tracking-wide ml-1">Nouvelle Catégorie Cible</label>
                                <div className="grid grid-cols-1 gap-3">
                                    {(['BATIMENT', 'INFRA', 'ELECT'] as const).map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setTargetCategory(cat)}
                                            className={cn(
                                                "flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 text-left hover:scale-[1.02]",
                                                targetCategory === cat
                                                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                                                    : "border-transparent bg-white shadow-sm hover:bg-white/80"
                                            )}
                                        >
                                            <span className={cn("font-bold text-lg", targetCategory === cat ? "text-primary" : "text-text-main")}>{cat}</span>
                                            {targetCategory === cat && <div className="h-3 w-3 rounded-full bg-primary shadow-sm" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end pt-2">
                                <Button variant="ghost" onClick={() => setTransferModalOpen(false)} className="rounded-xl hover:bg-text-muted/10">
                                    Annuler
                                </Button>
                                <Button onClick={handleTransfer} disabled={!targetCategory} className="rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                                    Confirmer le Transfert
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Priority Modal */}
            {priorityModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200" onClick={() => setPriorityModalOpen(false)}>
                    <div className="bg-white/90 backdrop-blur-2xl rounded-[2rem] p-8 max-w-md w-full mx-4 shadow-2xl border border-white/50" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-warning/10 rounded-2xl text-warning">
                                <ArrowUp className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-text-main">Modifier la Priorité</h3>
                                <p className="text-sm text-text-muted font-medium">Gérer l'urgence du ticket</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold uppercase text-text-muted mb-3 tracking-wide ml-1">Niveau de Priorité</label>
                                <div className="grid grid-cols-1 gap-3">
                                    {(['NORMAL', 'URGENT', 'CRITIQUE'] as const).map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setTargetPriority(p)}
                                            className={cn(
                                                "flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 text-left hover:scale-[1.02]",
                                                targetPriority === p
                                                    ? p === 'CRITIQUE' ? "border-danger bg-danger/5 shadow-md"
                                                        : p === 'URGENT' ? "border-warning bg-warning/5 shadow-md"
                                                            : "border-primary bg-primary/5 shadow-md"
                                                    : "border-transparent bg-white shadow-sm hover:bg-white/80"
                                            )}
                                        >
                                            <span className={cn("font-bold text-lg",
                                                targetPriority === p
                                                    ? p === 'CRITIQUE' ? "text-danger"
                                                        : p === 'URGENT' ? "text-warning"
                                                            : "text-primary"
                                                    : "text-text-main"
                                            )}>{priorityMap[p].label}</span>
                                            {targetPriority === p && <div className={cn("h-3 w-3 rounded-full shadow-sm",
                                                p === 'CRITIQUE' ? "bg-danger"
                                                    : p === 'URGENT' ? "bg-warning"
                                                        : "bg-primary"
                                            )} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase text-text-muted tracking-wide ml-1">
                                    Justification {targetPriority === 'CRITIQUE' && <span className="text-danger">*</span>}
                                </label>
                                <textarea
                                    className="w-full p-4 rounded-xl border border-white/40 bg-white/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-muted/50 text-text-main shadow-inner resize-none h-24"
                                    placeholder="Raison du changement de priorité..."
                                    value={priorityReason}
                                    onChange={(e) => setPriorityReason(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3 justify-end pt-2">
                                <Button variant="ghost" onClick={() => setPriorityModalOpen(false)} className="rounded-xl hover:bg-text-muted/10">
                                    Annuler
                                </Button>
                                <Button
                                    onClick={confirmPriorityChange}
                                    className={cn("rounded-xl shadow-lg hover:scale-[1.02] transition-transform",
                                        targetPriority === 'CRITIQUE' ? "bg-danger hover:bg-danger/90 shadow-danger/20" :
                                            targetPriority === 'URGENT' ? "bg-warning hover:bg-warning/90 text-text-main shadow-warning/20" : ""
                                    )}
                                >
                                    Confirmer
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {detailsModalOpen && selectedTruckId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200" onClick={() => setDetailsModalOpen(false)}>
                    <div className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] p-0 max-w-5xl w-full mx-4 shadow-2xl border border-white/50 overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="p-8 border-b border-border/50 bg-surface/50">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Badge variant="outline" className="text-xs font-mono bg-white/50">{trucks.find(t => t.id === selectedTruckId)?.ticketNumber}</Badge>
                                        <span className="text-text-muted text-sm font-bold uppercase tracking-wider">Parcours Camion</span>
                                    </div>
                                    <h2 className="text-4xl font-black text-text-main tracking-tighter">
                                        {trucks.find(t => t.id === selectedTruckId)?.licensePlate}
                                    </h2>
                                    <p className="text-lg text-text-muted font-medium mt-1">
                                        {trucks.find(t => t.id === selectedTruckId)?.driverName} • {trucks.find(t => t.id === selectedTruckId)?.companyName}
                                    </p>
                                </div>
                                <div className="p-4 bg-primary/5 rounded-3xl">
                                    <TruckIcon className="h-10 w-10 text-primary" />
                                </div>
                            </div>
                        </div>

                        {/* Road Timeline Content */}
                        <div className="p-10 overflow-x-auto bg-gradient-to-b from-blue-50/50 to-white/50">
                            <div className="min-w-[800px] relative pt-12 pb-8">
                                {/* The Road */}
                                <div className="absolute top-[60px] left-0 right-0 h-3 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full w-full bg-[linear-gradient(90deg,transparent_50%,#fff_50%)] bg-[length:20px_100%] opacity-50"></div>
                                </div>

                                {/* Active Road Progress */}
                                {trucks.find(t => t.id === selectedTruckId) && (
                                    <div
                                        className="absolute top-[60px] left-0 h-3 bg-primary rounded-full transition-all duration-1000 ease-out z-0"
                                        style={{
                                            width: `${(
                                                ['EN_ATTENTE', 'PESÉ_ENTRÉE', 'EN_VENTE', 'APPELÉ', 'CHARGEMENT_TERMINÉ', 'PESÉ_SORTIE', 'TERMINÉ'].indexOf(trucks.find(t => t.id === selectedTruckId)?.status || 'EN_ATTENTE') / 6
                                            ) * 100}%`
                                        }}
                                    />
                                )}

                                <div className="flex justify-between relative z-10">
                                    {[
                                        { label: 'Entrée', icon: CheckCircle2, status: 'EN_ATTENTE', stepIndex: 0 },
                                        { label: 'Pesée Tare', icon: Scale, status: 'PESÉ_ENTRÉE', stepIndex: 1, detail: 'weightIn' },
                                        { label: 'Vente', icon: ListOrdered, status: 'EN_VENTE', stepIndex: 2 },
                                        { label: 'Appel', icon: Megaphone, status: 'APPELÉ', stepIndex: 3, detail: 'callZone' },
                                        { label: 'Chargement', icon: TruckIcon, status: 'CHARGEMENT_TERMINÉ', stepIndex: 4 },
                                        { label: 'Pesée Total', icon: Scale, status: 'PESÉ_SORTIE', stepIndex: 5, detail: 'weightOut' },
                                        { label: 'Sortie', icon: CheckCircle2, status: 'TERMINÉ', stepIndex: 6 }
                                    ].map((step, idx) => {
                                        const truck = trucks.find(t => t.id === selectedTruckId);
                                        if (!truck) return null;

                                        const currentStatusIndex = ['EN_ATTENTE', 'PESÉ_ENTRÉE', 'EN_VENTE', 'APPELÉ', 'EN_CHARGEMENT', 'CHARGEMENT_TERMINÉ', 'PESÉ_SORTIE', 'TERMINÉ'].indexOf(truck.status);
                                        // Adjust index for simplified steps mapping
                                        const mappedCurrentIndex = truck.status === 'EN_CHARGEMENT' ? 4 : currentStatusIndex;

                                        const isCompleted = mappedCurrentIndex > idx;
                                        const isCurrent = mappedCurrentIndex === idx;

                                        // Specific data display
                                        let stepDetail = null;
                                        if (step.detail === 'weightIn' && truck.weightIn) stepDetail = `${truck.weightIn} kg`;
                                        if (step.detail === 'weightOut' && truck.weightOut) stepDetail = `${truck.weightOut} kg`;
                                        if (step.detail === 'callZone' && truck.callZone) stepDetail = truck.callZone;

                                        return (
                                            <div key={idx} className="flex flex-col items-center group relative">
                                                {/* Moving Truck Icon */}
                                                {isCurrent && (
                                                    <div className="absolute -top-14 animate-bounce-slow transition-all duration-500">
                                                        <div className="bg-primary text-white p-2 rounded-xl shadow-lg shadow-primary/30">
                                                            <TruckIcon className="h-8 w-8" />
                                                        </div>
                                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-primary"></div>
                                                    </div>
                                                )}

                                                {/* Step Node */}
                                                <div className={cn(
                                                    "w-14 h-14 rounded-full flex items-center justify-center border-4 transition-all duration-300 bg-white mb-3 z-10",
                                                    (isCompleted || isCurrent) ? "border-primary text-primary shadow-lg shadow-primary/10" : "border-slate-200 text-slate-300",
                                                    isCurrent && "scale-110 ring-4 ring-primary/10"
                                                )}>
                                                    <step.icon className="h-6 w-6" />
                                                </div>

                                                {/* Label & Details */}
                                                <div className="text-center">
                                                    <p className={cn(
                                                        "text-sm font-bold uppercase tracking-wider transition-colors",
                                                        (isCompleted || isCurrent) ? "text-primary" : "text-slate-400"
                                                    )}>
                                                        {step.label}
                                                    </p>
                                                    {stepDetail && (
                                                        <Badge variant="secondary" className="mt-1 bg-white border border-slate-200 shadow-sm text-xs">
                                                            {stepDetail}
                                                        </Badge>
                                                    )}
                                                    {isCurrent && (
                                                        <span className="inline-block mt-1 w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-surface/50 border-t border-border/50 flex justify-end">
                            <Button size="lg" onClick={() => setDetailsModalOpen(false)} className="rounded-xl px-8 shadow-lg shadow-primary/20">
                                Fermer
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
