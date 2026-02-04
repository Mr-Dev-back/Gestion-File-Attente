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

const priorityMap = {
    CRITIQUE: { label: 'Critique', variant: 'destructive' as const, glow: 'shadow-[0_0_15px_rgba(239,68,68,0.5)]' },
    URGENT: { label: 'Urgent', variant: 'warning' as const, glow: 'shadow-[0_0_15px_rgba(245,158,11,0.5)]' },
    NORMAL: { label: 'Normal', variant: 'secondary' as const, glow: '' },
};

const zones = ['ZONE INFRA', 'ZONE ELEC', 'ZONE BAT', 'ZONE ATTENTE'];

export default function Queue() {
    const { trucks, fetchTrucks, updateStatus, transferTicket } = useTruckStore();
    const { user } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPriority, setFilterPriority] = useState<string | null>(null);
    const [filterDepartment, setFilterDepartment] = useState<'INFRA' | 'ELECT' | 'BATIMENT' | null>(null);
    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null);
    const [targetCategory, setTargetCategory] = useState<string>('');
    const [priorityModalOpen, setPriorityModalOpen] = useState(false);
    const [priorityReason, setPriorityReason] = useState('');
    const [targetPriority, setTargetPriority] = useState<TruckPriority>('NORMAL');

    useEffect(() => {
        fetchTrucks();
        const interval = setInterval(() => fetchTrucks(), 30000);
        if (user?.department && user.department !== 'ALL') {
            setFilterDepartment(user.department as any);
        }
        return () => clearInterval(interval);
    }, []);

    const queueTrucks = trucks.filter(t =>
        ['PESÉ_ENTRÉE', 'EN_VENTE', 'APPELÉ', 'EN_CHARGEMENT', 'CHARGEMENT_TERMINÉ', 'BL_GÉNÉRÉ', 'PESÉ_SORTIE'].includes(t.status)
    );

    const handleCall = async (id: string) => {
        const truck = trucks.find(t => t.id === id);
        if (!truck) return;
        const currentCategory = truck.categories?.[truck.currentCategoryIndex || 0] || 'INFRA';
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
            const truck = trucks.find(t => t.id === selectedTruckId);
            await updateStatus(selectedTruckId, truck?.status || 'EN_ATTENTE', {
                priority: targetPriority,
                priorityReason: priorityReason
            });
            toast(`Priorité mise à jour : ${targetPriority}`, 'success');
            setPriorityModalOpen(false);
            setSelectedTruckId(null);
        } catch (error) {
            toast('Erreur mise à jour priorité', 'error');
        }
    };

    const filteredQueue = queueTrucks
        .filter(t =>
            t.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .filter(t => !filterPriority || t.priority === filterPriority)
        .filter(t => {
            if (!filterDepartment) return true;
            const activeCat = t.categories?.[t.currentCategoryIndex || 0] || 'TP';
            return activeCat === filterDepartment;
        })
        .sort((a, b) => {
            const priorityOrder = { CRITIQUE: 0, URGENT: 1, NORMAL: 2 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return new Date(a.arrivedAt).getTime() - new Date(b.arrivedAt).getTime();
        });

    const stats = {
        total: queueTrucks.length,
        waiting: trucks.filter(t => t.status === 'EN_VENTE' || t.status === 'PESÉ_ENTRÉE').length,
        called: trucks.filter(t => t.status === 'APPELÉ').length,
        critical: queueTrucks.filter(t => t.priority === 'CRITIQUE').length,
    };

    return (
        <div className="space-y-8 relative pb-20">
            {/* Decorative Background Elements */}
            <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 animate-pulse-slow pointer-events-none" />
            <div className="absolute bottom-[100px] left-[-200px] w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[100px] -z-10 animate-pulse-slow pointer-events-none" style={{ animationDelay: '1.5s' }} />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/20 bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] shadow-sm animate-fade-in hover:shadow-md transition-all duration-500">
                <div>
                    <h2 className="text-5xl font-black tracking-tighter text-text-main flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-2xl text-white shadow-lg shadow-primary/30 transform rotate-3">
                            <ListOrdered className="h-10 w-10" />
                        </div>
                        File d'Attente
                    </h2>
                    <p className="text-text-muted font-bold tracking-wide mt-2 ml-20 text-lg uppercase opacity-70">
                        Gestion des flux & Appels Camions
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="lg"
                    onClick={() => fetchTrucks()}
                    className="bg-white/50 backdrop-blur-sm border-white/50 hover:bg-white/80 shadow-sm rounded-xl"
                >
                    <RefreshCcw className="mr-2 h-5 w-5" />
                    Rafraîchir
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-4">
                {[
                    { label: 'Total en File', value: stats.total, icon: TruckIcon, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
                    { label: 'En Attente', value: stats.waiting, icon: Clock, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
                    { label: 'Appelés', value: stats.called, icon: Megaphone, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
                    { label: 'Critiques', value: stats.critical, icon: ArrowUp, color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20' }
                ].map((stat, idx) => (
                    <div key={idx} className={cn(
                        "relative overflow-hidden rounded-[2rem] p-6 backdrop-blur-md border shadow-lg transition-all duration-300 hover:scale-[1.03] group",
                        "bg-white/60 border-white/40"
                    )}>
                        <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -mr-10 -mt-10 opacity-50 transition-opacity group-hover:opacity-80", stat.bg)} />
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

            {/* Main Queue Card */}
            <Card className="border-0 shadow-2xl bg-white/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 p-8 border-b border-white/20 bg-white/30">
                    <CardTitle className="text-2xl font-black flex items-center gap-3">
                        <span className="w-2 h-8 bg-primary rounded-full"></span>
                        Liste des Camions
                    </CardTitle>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80 group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
                            <input
                                placeholder="Rechercher (matricule, client)..."
                                className="w-full h-12 pl-11 pr-4 rounded-xl border border-white/40 bg-white/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all placeholder:text-text-muted/50 text-text-main shadow-sm"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Department Filter Pills */}
                        {(!user?.department || user.department === 'ALL') && (
                            <div className="flex bg-white/30 p-1.5 rounded-xl border border-white/30 backdrop-blur-sm shadow-sm">
                                <button onClick={() => setFilterDepartment(null)} className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", !filterDepartment ? "bg-white text-text-main shadow-sm" : "text-text-muted hover:bg-white/50")}>TOUS</button>
                                {(['INFRA', 'ELECT', 'BATIMENT'] as const).map(dept => (
                                    <button key={dept} onClick={() => setFilterDepartment(dept)} className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", filterDepartment === dept ? "bg-primary text-white shadow-md shadow-primary/20" : "text-text-muted hover:bg-white/50")}>{dept}</button>
                                ))}
                            </div>
                        )}

                        {/* Priority Filter Pills */}
                        <div className="flex bg-white/30 p-1.5 rounded-xl border border-white/30 backdrop-blur-sm shadow-sm">
                            <button onClick={() => setFilterPriority(null)} className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", !filterPriority ? "bg-white text-text-main shadow-sm" : "text-text-muted hover:bg-white/50")}>Tous</button>
                            <button onClick={() => setFilterPriority('CRITIQUE')} className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", filterPriority === 'CRITIQUE' ? "bg-danger text-white shadow-md shadow-danger/20" : "text-text-muted hover:bg-white/50")}>Critique</button>
                            <button onClick={() => setFilterPriority('URGENT')} className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", filterPriority === 'URGENT' ? "bg-warning text-white shadow-md shadow-warning/20" : "text-text-muted hover:bg-white/50")}>Urgent</button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-white/20 hover:bg-transparent bg-white/20">
                                    <TableHead className="w-[80px] text-center font-bold text-text-main py-6">N°</TableHead>
                                    <TableHead className="font-bold text-text-main">MATRICULE</TableHead>
                                    <TableHead className="hidden md:table-cell font-bold text-text-main">DÉPT.</TableHead>
                                    <TableHead className="hidden lg:table-cell font-bold text-text-main">CLIENT</TableHead>
                                    <TableHead className="hidden md:table-cell font-bold text-text-main">ARRIVÉE</TableHead>
                                    <TableHead className="font-bold text-text-main">PRIORITÉ</TableHead>
                                    <TableHead className="font-bold text-text-main">STATUT</TableHead>
                                    <TableHead className="text-right font-bold text-text-main pr-8">ACTIONS</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredQueue.map((truck, idx) => (
                                    <TableRow
                                        key={truck.id}
                                        className={cn(
                                            "border-b border-white/10 transition-all duration-200 group hover:shadow-md cursor-default",
                                            truck.priority === 'CRITIQUE' ? "bg-danger/5 hover:bg-danger/10" : "hover:bg-white/50",
                                            truck.status === 'APPELÉ' && "bg-success/5 hover:bg-success/10"
                                        )}
                                    >
                                        <TableCell className="text-center">
                                            <div className={cn(
                                                "h-10 w-10 rounded-2xl flex items-center justify-center mx-auto text-sm font-black shadow-sm transition-transform group-hover:scale-110",
                                                truck.priority === 'CRITIQUE' ? "bg-danger text-white shadow-danger/30" :
                                                    truck.priority === 'URGENT' ? "bg-warning text-white shadow-warning/30" :
                                                        "bg-white text-text-muted border border-white/50"
                                            )}>
                                                {idx + 1}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-black text-lg tracking-tight bg-white/50 inline-block px-2 py-1 rounded-md border border-white/20 shadow-sm font-mono">
                                                {truck.licensePlate}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <Badge variant="outline" className="font-mono text-[10px] px-2 py-0.5 bg-white/50 border-white/40">
                                                {truck.categories?.[truck.currentCategoryIndex || 0] || 'TP'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            <span className="font-semibold text-text-main">{truck.companyName}</span>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex items-center gap-1.5 text-sm font-medium bg-white/30 px-2 py-1 rounded-lg w-fit">
                                                <Clock className="h-3.5 w-3.5 text-text-muted" />
                                                {new Date(truck.arrivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={priorityMap[truck.priority].variant}
                                                className={cn("px-3 py-1 text-xs border-0 backdrop-blur-xl transition-all", priorityMap[truck.priority].glow)}
                                            >
                                                {priorityMap[truck.priority].label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "inline-flex items-center rounded-xl px-3 py-1 text-xs font-bold ring-1 ring-inset shadow-sm uppercase tracking-wide",
                                                truck.status === 'APPELÉ' ? "bg-success text-white ring-success/20 shadow-success/20 animate-pulse" :
                                                    truck.status === 'PESÉ_ENTRÉE' ? "bg-blue-100 text-blue-700 ring-blue-700/10" :
                                                        truck.status === 'EN_CHARGEMENT' ? "bg-purple-100 text-purple-700 ring-purple-700/10" :
                                                            truck.status === 'CHARGEMENT_TERMINÉ' ? "bg-indigo-100 text-indigo-700 ring-indigo-700/10" :
                                                                truck.status === 'PESÉ_SORTIE' ? "bg-orange-100 text-orange-700 ring-orange-700/10" :
                                                                    "bg-white text-primary ring-primary/20"
                                            )}>
                                                {truck.status === 'APPELÉ' ? 'Appelé' :
                                                    truck.status === 'PESÉ_ENTRÉE' ? 'En Attente (Pesé)' :
                                                        truck.status === 'EN_CHARGEMENT' ? 'En Chargement' :
                                                            truck.status === 'CHARGEMENT_TERMINÉ' ? 'Chargé' :
                                                                truck.status === 'PESÉ_SORTIE' ? 'Pesé Sortie' :
                                                                    'En Attente'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                {(truck.status === 'EN_VENTE' || truck.status === 'PESÉ_ENTRÉE') && ['MANAGER', 'SUPERVISOR', 'ADMINISTRATOR', 'AGENT_QUAI'].includes(user?.role || '') && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            className="bg-success/10 text-success hover:bg-success hover:text-white border border-success/20 shadow-none hover:shadow-lg hover:shadow-success/30 transition-all rounded-xl"
                                                            onClick={() => handleCall(truck.id)}
                                                        >
                                                            <Megaphone className="h-4 w-4 mr-2" />
                                                            Appeler
                                                        </Button>
                                                        {['MANAGER', 'SUPERVISOR', 'ADMINISTRATOR'].includes(user?.role || '') && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-warning hover:text-warning hover:bg-warning/10 rounded-xl"
                                                                onClick={() => handlePriorityClick(truck.id, truck.priority)}
                                                            >
                                                                <ArrowUp className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => openDetailsModal(truck.id)}
                                                    className="text-text-muted hover:text-primary hover:bg-primary/5 rounded-xl"
                                                    title="Détails du parcours"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => printTicket(truck)}
                                                    className="text-text-muted hover:text-text-main hover:bg-white/50 rounded-xl"
                                                    title="Réimprimer"
                                                >
                                                    <Printer className="h-4 w-4" />
                                                </Button>
                                                {['SUPERVISOR', 'MANAGER', 'ADMINISTRATOR', 'AGENT_QUAI'].includes(user?.role || '') && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => openTransferModal(truck.id, truck.categories?.[truck.currentCategoryIndex || 0] || '')}
                                                        className="text-primary hover:text-primary hover:bg-primary/10 rounded-xl"
                                                        title="Transférer"
                                                    >
                                                        <ArrowRightLeft className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {filteredQueue.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="bg-white/50 p-6 rounded-full mb-4 shadow-inner">
                                <TruckIcon className="h-16 w-16 text-text-muted/20" />
                            </div>
                            <h3 className="text-xl font-bold text-text-main">Aucun camion dans la file</h3>
                            <p className="text-text-muted mt-1 max-w-sm">
                                Il n'y a actuellement aucun camion correspondant à vos critères de recherche.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

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
