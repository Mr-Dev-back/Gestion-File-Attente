import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/molecules/ui/card';
import { Button } from '../components/atoms/ui/button';
import { Input } from '../components/atoms/ui/input';
import { Badge } from '../components/atoms/ui/badge';
import { cn } from '../lib/utils';
import { toast } from '../components/molecules/ui/toast';
import { useTruckStore } from '../stores/useTruckStore';
import { Truck, Scale, ArrowRight, CheckCircle2, Search, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Weighing() {
    const { trucks, fetchTrucks, weighIn, weighOut } = useTruckStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null);
    const [weight, setWeight] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'ENTRY' | 'EXIT'>('ENTRY');

    useEffect(() => {
        fetchTrucks();
        const interval = setInterval(() => fetchTrucks(), 30000);
        return () => clearInterval(interval);
    }, []);

    // Filter trucks for Weigh In (Tare)
    // Status should be EN_ATTENTE? No, Entry starts the process. 
    // Wait... In the plan: 
    // Entry Weighing -> PESÉ_ENTRÉE.
    // So trucks waiting for Entry connection are likely just arrived? 
    // Usually they are registered at Entry first. 
    // Let's assume Entry Guard registers them -> Status EN_ATTENTE.
    // Then they go to Weighbridge. 
    const entryTrucks = trucks.filter(t => t.status === 'EN_ATTENTE');

    // Filter trucks for Weigh Out (Gross)
    // Status should be CHARGEMENT_TERMINÉ (Loading done, ready to exit)
    // Or BL_GÉNÉRÉ if BL is done before weighing? 
    // Usually Loading -> Weighing Out -> BL.
    // Let's look at controller allowed transitions:
    // 'CHARGEMENT_TERMINÉ': ['TERMINÉ', 'BL_GÉNÉRÉ', 'EN_ATTENTE'...]
    // 'BL_GÉNÉRÉ': ['TERMINÉ', 'PESÉ_SORTIE'...]
    // It seems BL_GÉNÉRÉ -> PESÉ_SORTIE is allowed. 
    // Wait, let's check what sales does. Sales moves to BL_GÉNÉRÉ.
    // So trucks waiting for Exit Weighing are 'BL_GÉNÉRÉ'.
    const exitTrucks = trucks.filter(t => t.status === 'BL_GÉNÉRÉ' || t.status === 'CHARGEMENT_TERMINÉ');

    const filteredEntry = entryTrucks.filter(t =>
        t.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredExit = exitTrucks.filter(t =>
        t.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleWeighIn = async () => {
        if (!selectedTruckId || !weight) return;

        setIsSubmitting(true);
        try {
            await weighIn(selectedTruckId, parseFloat(weight));
            toast('Pesée entrée enregistrée (Tare)', 'success');
            setWeight('');
            setSelectedTruckId(null);
        } catch (error) {
            toast('Erreur lors de la pesée entrée', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleWeighOut = async () => {
        if (!selectedTruckId || !weight) return;

        setIsSubmitting(true);
        try {
            await weighOut(selectedTruckId, parseFloat(weight));
            toast('Pesée sortie enregistrée (Poids Total)', 'success');
            setWeight('');
            setSelectedTruckId(null);
        } catch (error: any) {
            toast(error.response?.data?.error || 'Erreur lors de la pesée sortie', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedTruck = trucks.find(t => t.id === selectedTruckId);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-text-main">Pont Bascule</h2>
                    <p className="text-text-muted text-sm">Gestion des pesées entrée (Tare) et sortie (Poids Total)</p>
                </div>
                <div className="bg-surface border rounded-lg p-1 flex items-center gap-1">
                    <Button
                        variant={activeTab === 'ENTRY' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => { setActiveTab('ENTRY'); setSelectedTruckId(null); }}
                        className="gap-2"
                    >
                        <Scale className="h-4 w-4" />
                        Pesée Entrée (Tare)
                        <Badge variant="secondary" className="ml-1 bg-background/20 text-current">{entryTrucks.length}</Badge>
                    </Button>
                    <Button
                        variant={activeTab === 'EXIT' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => { setActiveTab('EXIT'); setSelectedTruckId(null); }}
                        className="gap-2"
                    >
                        <Truck className="h-4 w-4" />
                        Pesée Sortie (Chargé)
                        <Badge variant="secondary" className="ml-1 bg-background/20 text-current">{exitTrucks.length}</Badge>
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Truck List */}
                <Card className="lg:col-span-2 h-[calc(100vh-12rem)] flex flex-col">
                    <CardHeader className="border-b pb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
                            <Input
                                placeholder="Rechercher matricule, ticket..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto p-0">
                        <div className="divide-y">
                            {(activeTab === 'ENTRY' ? filteredEntry : filteredExit).length === 0 ? (
                                <div className="p-8 text-center text-text-muted opacity-50">
                                    <Scale className="h-12 w-12 mx-auto mb-2" />
                                    <p>Aucun camion en attente de pesée</p>
                                </div>
                            ) : (
                                (activeTab === 'ENTRY' ? filteredEntry : filteredExit).map(truck => (
                                    <div
                                        key={truck.id}
                                        className={cn(
                                            "p-4 hover:bg-secondary/5 cursor-pointer transition-colors flex items-center justify-between group",
                                            selectedTruckId === truck.id && "bg-primary/5 border-l-4 border-l-primary"
                                        )}
                                        onClick={() => setSelectedTruckId(truck.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs",
                                                activeTab === 'ENTRY' ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"
                                            )}>
                                                {activeTab === 'ENTRY' ? 'IN' : 'OUT'}
                                            </div>
                                            <div>
                                                <p className="font-mono font-bold text-text-main">{truck.licensePlate}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold uppercase text-text-muted">{truck.ticketNumber}</span>
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1">{truck.companyName}</Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-text-muted flex items-center justify-end gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDistanceToNow(new Date(truck.arrivedAt), { addSuffix: true, locale: fr })}
                                            </p>
                                            {activeTab === 'EXIT' && truck.weightIn && (
                                                <p className="text-xs font-medium text-text-main mt-1">
                                                    Tare: <span className="font-mono">{truck.weightIn} kg</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Weighing Form */}
                <div className="lg:col-span-1">
                    {selectedTruck ? (
                        <Card className="border-t-4 border-t-primary shadow-lg sticky top-6">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Scale className="h-5 w-5 text-primary" />
                                    Saisie du Poids
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="bg-secondary/10 p-4 rounded-lg space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-text-muted">Matricule</span>
                                        <span className="font-mono font-bold text-lg">{selectedTruck.licensePlate}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-text-muted">Chauffeur</span>
                                        <span className="font-medium">{selectedTruck.driverName}</span>
                                    </div>
                                    {activeTab === 'EXIT' && (
                                        <div className="pt-2 mt-2 border-t border-border/50 flex justify-between items-center text-blue-600">
                                            <span className="text-sm font-medium">Poids Tare (Entrée)</span>
                                            <span className="font-mono font-bold">{selectedTruck.weightIn} kg</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-text-main block">
                                        {activeTab === 'ENTRY' ? 'Poids P1 (Tare/Vide)' : 'Poids P2 (Total/Chargé)'}
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            className="h-16 text-3xl font-mono text-center font-bold tracking-wider"
                                            value={weight}
                                            onChange={e => setWeight(e.target.value)}
                                            autoFocus
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">KG</span>
                                    </div>

                                    {activeTab === 'EXIT' && weight && selectedTruck.weightIn && (
                                        <div className={cn(
                                            "text-center p-2 rounded text-sm font-bold",
                                            (parseFloat(weight) - selectedTruck.weightIn) > 0 ? "text-success bg-success/10" : "text-danger bg-danger/10"
                                        )}>
                                            Net Estimé: {parseFloat(weight) - selectedTruck.weightIn} kg
                                        </div>
                                    )}
                                </div>

                                <Button
                                    className="w-full h-12 text-lg font-bold"
                                    onClick={activeTab === 'ENTRY' ? handleWeighIn : handleWeighOut}
                                    isLoading={isSubmitting}
                                    disabled={!weight}
                                >
                                    <CheckCircle2 className="mr-2 h-5 w-5" />
                                    VALIDER LA PESÉE
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-dashed h-full flex items-center justify-center p-8 bg-surface/50">
                            <div className="text-center text-text-muted">
                                <ArrowRight className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>Sélectionnez un camion dans la liste pour effectuer la pesée</p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
