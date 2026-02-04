import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '../components/molecules/ui/card';
import { Button } from '../components/atoms/ui/button';
import { Input } from '../components/atoms/ui/input';
import { Badge } from '../components/atoms/ui/badge';
import { Truck, User, Save, Printer, CheckCircle2, Search, ArrowLeft, Home, Loader2, Clock, Monitor } from 'lucide-react';
import { printTicket } from '../utils/printTicket';
import { toast } from '../components/molecules/ui/toast';
import { useTruckStore } from '../stores/useTruckStore';
import { useCategories } from '../hooks/useCategories';
import { api } from '../services/api';

export default function Entry() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'HOME' | 'ENTRY'>('HOME');
    const [isLoading, setIsLoading] = useState(false);
    const [isValidatingOrder, setIsValidatingOrder] = useState(false);

    const { categories: availableCategories, isLoading: isLoadingCats } = useCategories();
    const { addTruck, fetchTrucks, getQueuedTrucks } = useTruckStore();

    const [successTicket, setSuccessTicket] = useState<any>(null);
    const [customerName, setCustomerName] = useState('');

    const [formData, setFormData] = useState({
        licensePlate: '',
        driverName: '',
        driverPhone: '',
        orderNumber: '',
        categories: [] as string[],
        priority: 'NORMAL' as 'NORMAL' | 'URGENT' | 'CRITIQUE',
    });

    useEffect(() => {
        fetchTrucks();
        const interval = setInterval(() => fetchTrucks(), 30000);
        return () => clearInterval(interval);
    }, []);

    const handleReset = () => {
        setFormData({
            licensePlate: '',
            driverName: '',
            driverPhone: '',
            orderNumber: '',
            categories: [],
            priority: 'NORMAL',
        });
        setCustomerName('');
        setSuccessTicket(null);
    };

    const handleValidateOrder = async () => {
        if (!formData.orderNumber) return;
        setIsValidatingOrder(true);
        try {
            const { data } = await api.get(`/tickets/validate-order/${formData.orderNumber}`);
            if (data.exists) {
                setCustomerName(data.customerName);
                toast(`Commande valide : ${data.customerName}`, 'success');
            } else {
                toast('Commande introuvable dans Sage X3', 'warning');
            }
        } catch (error) {
            toast('Lien Sage X3 indisponible', 'error');
        } finally {
            setIsValidatingOrder(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.licensePlate || !formData.driverName || formData.categories.length === 0) {
            toast('Veuillez remplir les champs obligatoires', 'warning');
            return;
        }

        setIsLoading(true);
        try {
            const ticket = await addTruck({
                ...formData,
                companyName: customerName || 'PASSAGER',
                loadedProducts: []
            } as any);

            toast('Ticket généré !', 'success');
            setSuccessTicket(ticket);
            fetchTrucks();
        } catch (error: any) {
            toast(error.response?.data?.error || 'Erreur lors de l\'enregistrement', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const queuedTrucks = getQueuedTrucks();

    const Header = () => (
        <div className="bg-background/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
                <div className="flex items-center gap-4 animate-slide-in-right">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 rounded-xl blur-md group-hover:blur-lg transition-all opacity-50"></div>
                        <img src="/logo.png" alt="SIGFA" className="relative h-12 w-12 rounded-xl border border-white/50 shadow-sm transition-transform group-hover:scale-105 object-contain bg-white/50" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">SIGFA</h1>
                        <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase opacity-80">Système Intégré de Gestion de File d'Attente</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end mr-2 animate-fade-in bg-surface/50 px-4 py-1.5 rounded-full border border-border/50 backdrop-blur-sm">
                        <span className="text-xs font-bold text-text-main capitalize flex items-center gap-2">
                            <Clock className="h-3 w-3 text-primary" />
                            {format(new Date(), 'EEEE d MMMM', { locale: fr })}
                        </span>
                    </div>
                    {viewMode !== 'HOME' && <Button variant="ghost" size="sm" onClick={() => setViewMode('HOME')} className="rounded-full hover:bg-primary/5 hover:text-primary transition-colors"><Home className="h-4 w-4 mr-2" />Accueil</Button>}
                    <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="rounded-full hover:bg-primary/5 hover:text-primary transition-colors"><User className="h-4 w-4 mr-2" />Connexion</Button>
                </div>
            </div>
        </div>
    );

    if (viewMode === 'HOME') {
        return (
            <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 animate-pulse-slow" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px] -z-10 animate-pulse-slow" style={{ animationDelay: '1s' }} />

                <Header />

                <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full flex flex-col justify-center">
                    {/* Hero Section */}
                    <div className="text-center mb-16 animate-slide-up space-y-4">
                        <h2 className="text-4xl md:text-5xl font-black text-text-main tracking-tight mb-4">
                            Bienvenue sur <span className="text-primary relative inline-block">
                                SIGFA
                                <span className="absolute bottom-1 left-0 w-full h-2 bg-primary/10 -z-10 rounded-full"></span>
                            </span>
                        </h2>
                        <p className="text-xl text-text-muted max-w-2xl mx-auto leading-relaxed">
                            Notre plateforme centralisée pour la gestion des files d'attente des camions.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20 animate-slide-up w-full" style={{ animationDelay: '0.1s' }}>
                        {/* Entry Card */}
                        <div
                            onClick={() => setViewMode('ENTRY')}
                            className="group relative overflow-hidden bg-white rounded-3xl p-8 shadow-sm border border-border/50 hover:shadow-2xl hover:border-primary/30 transition-all duration-500 cursor-pointer text-center"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="h-32 w-32 bg-primary/10 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-primary text-primary group-hover:text-white transition-all duration-500 shadow-inner">
                                    <Truck className="h-14 w-14" />
                                </div>
                                <h3 className="text-3xl font-bold text-text-main mb-3">Nouvelle Entrée</h3>
                                <p className="text-text-muted mb-8 text-lg">Enregistrer un camion entrant et générer un ticket.</p>
                                <Button size="lg" className="rounded-full px-8 h-12 text-base shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all">
                                    Commencer l'enregistrement
                                </Button>
                            </div>
                        </div>

                        {/* TV Card */}
                        <div
                            onClick={() => navigate('/tv')}
                            className="group relative overflow-hidden bg-white rounded-3xl p-8 shadow-sm border border-border/50 hover:shadow-2xl hover:border-secondary/30 transition-all duration-500 cursor-pointer text-center"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="h-32 w-32 bg-secondary/10 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-secondary text-secondary group-hover:text-white transition-all duration-500 shadow-inner">
                                    <Monitor className="h-14 w-14" />
                                </div>
                                <h3 className="text-3xl font-bold text-text-main mb-3">Écran Public</h3>
                                <p className="text-text-muted mb-8 text-lg">Afficher la file d'attente sur l'écran de la salle.</p>
                                <Button size="lg" variant="secondary" className="rounded-full px-8 h-12 text-base shadow-lg group-hover:shadow-xl transition-all">
                                    Lancer l'affichage
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Dashboard Summary */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-sm max-w-5xl mx-auto w-full animate-fade-in" style={{ animationDelay: '0.3s' }}>
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-lg font-bold flex items-center gap-3 text-text-main">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <Clock className="h-5 w-5" />
                                </div>
                                File d'attente en temps réel
                            </h4>
                            <Badge variant="outline" className="px-3 py-1 bg-white ml-auto border-primary/20 text-primary">
                                {queuedTrucks.length} Camions
                            </Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {queuedTrucks.length === 0 ? (
                                <p className="col-span-full text-center py-6 text-text-muted italic bg-surface/50 rounded-lg border border-dashed">
                                    Aucun camion en attente actuellement.
                                </p>
                            ) : (
                                queuedTrucks.slice(0, 8).map(t => (
                                    <div key={t.id} className="bg-white p-3 rounded-xl border border-border/50 flex items-center justify-between text-sm shadow-sm hover:shadow-md transition-shadow">
                                        <span className="font-mono font-bold text-text-main">{t.licensePlate}</span>
                                        <Badge variant="secondary" className="text-[10px] scale-90">{t.categories?.[0] || 'N/A'}</Badge>
                                    </div>
                                ))
                            )}
                            {queuedTrucks.length > 8 && (
                                <div className="flex items-center justify-center text-xs text-text-muted font-medium bg-secondary/5 rounded-xl border border-transparent">
                                    + {queuedTrucks.length - 8} autres...
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden pb-10">
            {/* Consistent decorative background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 animate-pulse-slow" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px] -z-10 animate-pulse-slow" style={{ animationDelay: '1s' }} />

            <Header />
            <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in">
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => setViewMode('HOME')} className="rounded-full hover:bg-surface/80"><ArrowLeft className="h-4 w-4 mr-2" /> Retour</Button>
                        <h2 className="text-3xl font-black tracking-tight text-text-main">Enregistrement Camion</h2>
                    </div>
                </div>

                <div className="relative group">
                    <Card className="relative border-white/50 bg-white/60 backdrop-blur-xl shadow-2xl rounded-[1.8rem] overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary opacity-50"></div>
                        <CardHeader className="bg-surface/30 border-b border-border/40 pb-6 pt-8">
                            <CardTitle className="text-xl font-bold flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl text-primary shadow-inner">
                                    <Truck className="h-6 w-6" />
                                </div>
                                Informations du Transport
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8 p-8">
                            {successTicket ? (
                                <div className="text-center py-12 space-y-6 animate-scale-in">
                                    <div className="inline-block p-6 rounded-full bg-success/10 mb-4 animate-bounce-message">
                                        <CheckCircle2 className="h-20 w-20 text-success" />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-text-main mb-2">Ticket Généré !</h3>
                                        <p className="text-xl text-text-muted font-mono tracking-wider">{successTicket.ticketNumber}</p>
                                    </div>
                                    <div className="flex gap-4 justify-center pt-6">
                                        <Button onClick={() => printTicket(successTicket)} variant="outline" size="lg" className="rounded-full shadow-sm hover:shadow-md transition-all"><Printer className="mr-2 h-5 w-5" />Imprimer le Ticket</Button>
                                        <Button onClick={handleReset} size="lg" className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">Nouveau Camion</Button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div className="space-y-3 group/input">
                                            <label className="text-sm font-bold text-text-main uppercase tracking-wider ml-1">Matricule *</label>
                                            <div className="relative transform transition-all duration-300 focus-within:scale-[1.02]">
                                                <Input
                                                    placeholder="AA-123-BB"
                                                    value={formData.licensePlate}
                                                    onChange={e => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                                                    required
                                                    className="h-12 bg-white/70 border-border/50 focus:border-primary/50 focus:ring-primary/20 text-lg font-mono font-bold tracking-wider rounded-xl shadow-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3 group/input">
                                            <label className="text-sm font-bold text-text-main uppercase tracking-wider ml-1">Chauffeur *</label>
                                            <div className="relative transform transition-all duration-300 focus-within:scale-[1.02]">
                                                <Input
                                                    placeholder="Nom complet"
                                                    value={formData.driverName}
                                                    onChange={e => setFormData({ ...formData, driverName: e.target.value })}
                                                    required
                                                    className="h-12 bg-white/70 border-border/50 focus:border-primary/50 focus:ring-primary/20 text-lg rounded-xl shadow-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3 group/input">
                                            <label className="text-sm font-bold text-text-main uppercase tracking-wider ml-1">Bon de Commande</label>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Rechercher SAP/SAGE..."
                                                    value={formData.orderNumber}
                                                    onChange={e => setFormData({ ...formData, orderNumber: e.target.value })}
                                                    className="h-12 bg-white/70 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl shadow-sm flex-1"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    onClick={handleValidateOrder}
                                                    disabled={isValidatingOrder || !formData.orderNumber}
                                                    className="h-12 px-4 rounded-xl shadow-sm hover:shadow-md transition-all"
                                                >
                                                    {isValidatingOrder ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-3 group/input">
                                            <label className="text-sm font-bold text-text-main uppercase tracking-wider ml-1">Client / Société</label>
                                            <Input
                                                placeholder="Client identifié"
                                                value={customerName}
                                                onChange={e => setCustomerName(e.target.value)}
                                                readOnly={!!formData.orderNumber}
                                                className={`h-12 border-border/50 rounded-xl shadow-sm ${formData.orderNumber ? 'bg-primary/5 font-bold text-primary border-primary/20' : 'bg-white/70'}`}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-text-main uppercase tracking-wider ml-1">Type d'opération *</label>
                                        <div className="flex flex-wrap gap-3">
                                            {isLoadingCats ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : availableCategories.map(cat => (
                                                <Badge
                                                    key={cat.id}
                                                    variant={formData.categories.includes(cat.name) ? "default" : "outline"}
                                                    className={`cursor-pointer py-2.5 px-5 text-sm rounded-full transition-all duration-300 border shadow-sm hover:shadow-md hover:scale-105 active:scale-95 ${formData.categories.includes(cat.name)
                                                            ? 'bg-primary border-primary text-white shadow-primary/20'
                                                            : 'bg-white border-border/60 hover:border-primary/30 hover:bg-primary/5'
                                                        }`}
                                                    onClick={() => {
                                                        const newCats = formData.categories.includes(cat.name)
                                                            ? formData.categories.filter(c => c !== cat.name)
                                                            : [...formData.categories, cat.name];
                                                        setFormData({ ...formData, categories: newCats });
                                                    }}
                                                >
                                                    {formData.categories.includes(cat.name) && <CheckCircle2 className="h-3.5 w-3.5 mr-2" />}
                                                    {cat.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <Button
                                            type="submit"
                                            size="lg"
                                            className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.01] transition-all duration-300"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : <Save className="mr-3 h-6 w-6" />}
                                            Enregistrer le Camion
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
