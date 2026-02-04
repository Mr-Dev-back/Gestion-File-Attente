import { useEffect, useState } from 'react';
import { useTruckStore } from '../stores/useTruckStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/molecules/ui/card';
import { Badge } from '../components/atoms/ui/badge';
import { Truck, Megaphone, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function PublicTV() {
    const { trucks, fetchTrucks } = useTruckStore();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        fetchTrucks();
        const interval = setInterval(() => fetchTrucks(), 10000); // Refresh every 10s
        const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);

        return () => {
            clearInterval(interval);
            clearInterval(timeInterval);
        };
    }, []);

    const calledTrucks = trucks.filter(t => t.status === 'APPELÉ');
    const waitingTrucks = trucks
        .filter(t => t.status === 'EN_VENTE')
        .sort((a, b) => {
            const priorityOrder = { CRITIQUE: 0, URGENT: 1, NORMAL: 2 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return new Date(a.arrivedAt).getTime() - new Date(b.arrivedAt).getTime();
        });

    return (
        <div className="min-h-screen bg-background p-6 flex flex-col gap-6 overflow-hidden relative">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse-slow" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px] -z-10 animate-pulse-slow" style={{ animationDelay: '1s' }} />

            {/* Header */}
            <div className="flex items-center justify-between pb-6 pt-2 px-4">
                <div className="flex items-center gap-6 animate-slide-in-right">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-50"></div>
                        <img src="/logo.png" alt="Logo" className="relative h-24 w-24 rounded-2xl border border-white/50 shadow-lg transition-transform group-hover:scale-105 object-contain bg-white/50 backdrop-blur-sm" />
                    </div>
                    <div>
                        <h1 className="text-6xl font-black tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 dropshadow-sm">
                            FILE D'ATTENTE
                        </h1>
                        <p className="text-xl text-text-muted font-bold tracking-[0.2em] uppercase opacity-80 mt-2 ml-1">
                            Gestion des Flux Logistiques
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-3 animate-fade-in">
                    <div className="bg-white/40 backdrop-blur-md px-8 py-3 rounded-full border border-white/50 shadow-sm hover:bg-white/60 transition-colors">
                        <div className="text-7xl font-mono font-black text-primary tracking-tighter leading-none font-variant-numeric: tabular-nums">
                            {format(currentTime, 'HH:mm', { locale: fr })}
                        </div>
                    </div>
                    <div className="text-xl font-bold text-text-muted capitalize flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-1.5 rounded-full border border-white/10">
                        <Clock className="h-5 w-5 text-primary" />
                        {format(currentTime, 'EEEE d MMMM yyyy', { locale: fr })}
                    </div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-8 h-full overflow-hidden px-2 pb-2">
                {/* Called Trucks - Left Side (Larger) */}
                <div className="col-span-12 lg:col-span-5 flex flex-col gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <Card className="flex-1 border-white/40 bg-white/40 backdrop-blur-md flex flex-col overflow-hidden shadow-2xl rounded-[2rem]">
                        <CardHeader className="bg-gradient-to-r from-success/90 to-success text-white py-8 px-8 shadow-md relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            <CardTitle className="flex items-center justify-center text-4xl font-black uppercase tracking-widest gap-4 relative z-10">
                                <Megaphone className="h-10 w-10 animate-shake" />
                                CAMIONS APPELÉS
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 overflow-y-auto custom-scrollbar bg-gradient-to-b from-white/50 to-transparent">
                            {calledTrucks.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-success/20 p-12">
                                    <Megaphone className="h-40 w-40 mb-6 opacity-20" />
                                    <p className="text-3xl font-black opacity-30 tracking-widest uppercase text-center">Aucun appel<br />en cours</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-success/10">
                                    {calledTrucks.map((truck) => (
                                        <div key={truck.id} className="flex items-center justify-between p-8 bg-white/60 backdrop-blur-sm animate-in slide-in-from-left duration-500 border-l-8 border-success hover:bg-white/80 transition-colors">
                                            <div className="flex items-center gap-8">
                                                <div className="h-28 w-28 rounded-3xl bg-success text-white flex items-center justify-center text-4xl font-black shadow-lg shadow-success/20">
                                                    {truck.ticketNumber}
                                                </div>
                                                <div>
                                                    <div className="text-6xl font-black text-text-main font-mono tracking-tighter">
                                                        {truck.licensePlate}
                                                    </div>
                                                    <div className="text-2xl mt-2 text-text-muted font-bold flex items-center gap-3">
                                                        <div className="p-1.5 bg-text-muted/10 rounded-full"><Truck className="h-5 w-5" /></div>
                                                        {truck.companyName}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <Badge className="text-3xl px-8 py-3 bg-success hover:bg-success/90 text-white animate-pulse shadow-lg border-0 rounded-xl">
                                                    {truck.callZone || 'QUAI 1'}
                                                </Badge>
                                                <span className="text-sm font-black text-success tracking-widest uppercase bg-success/10 px-3 py-1 rounded-md">Se rendre immédiatement</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Waiting Queue - Right Side */}
                <div className="col-span-12 lg:col-span-7 flex flex-col gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <Card className="flex-1 border-white/40 bg-white/40 backdrop-blur-md flex flex-col overflow-hidden shadow-2xl rounded-[2rem]">
                        <CardHeader className="bg-white/50 backdrop-blur-sm py-6 px-8 border-b border-black/5 shadow-sm">
                            <CardTitle className="flex items-center text-3xl font-black text-text-main gap-4 tracking-tight">
                                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                    <Clock className="h-8 w-8" />
                                </div>
                                PROCHAINS DÉPARTS
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 overflow-y-auto bg-white/20">
                            {waitingTrucks.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-text-muted p-12">
                                    <Truck className="h-32 w-32 mb-4 opacity-10" />
                                    <p className="text-2xl font-bold opacity-30">La file d'attente est vide</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-black/5">
                                    {waitingTrucks.map((truck, idx) => (
                                        <div key={truck.id} className={cn(
                                            "flex items-center justify-between p-6 transition-all duration-300",
                                            idx === 0 ? "bg-primary/5 shadow-inner" : "hover:bg-white/40"
                                        )}>
                                            <div className="flex items-center gap-6">
                                                <div className={cn(
                                                    "h-16 w-16 rounded-2xl flex items-center justify-center text-2xl font-black border transition-all",
                                                    idx === 0
                                                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-110"
                                                        : "bg-white text-text-muted border-black/5 shadow-sm"
                                                )}>
                                                    #{idx + 1}
                                                </div>
                                                <div>
                                                    <div className={cn(
                                                        "font-mono font-bold tracking-tighter transition-colors",
                                                        idx === 0 ? "text-5xl text-primary" : "text-4xl text-text-main"
                                                    )}>
                                                        {truck.licensePlate}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <Badge variant="outline" className="text-xs font-mono bg-white/50 backdrop-blur-sm">
                                                            {truck.categories?.[truck.currentCategoryIndex || 0] || 'STANDARD'}
                                                        </Badge>
                                                        <span className="text-xl text-text-muted font-medium truncate max-w-[300px] block opacity-80">
                                                            {truck.companyName}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {truck.priority === 'CRITIQUE' && (
                                                    <Badge variant="destructive" className="text-lg px-4 py-1.5 animate-pulse shadow-md rounded-lg">
                                                        PRIORITAIRE
                                                    </Badge>
                                                )}
                                                {truck.priority === 'URGENT' && (
                                                    <Badge className="text-lg px-4 py-1.5 shadow-md bg-warning text-white rounded-lg hover:bg-warning">
                                                        URGENT
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Footer / Ticker */}
            <div className="bg-primary text-white py-4 px-6 rounded-2xl shadow-xl shadow-primary/10 overflow-hidden whitespace-nowrap border border-white/10 backdrop-blur-md relative z-10 mx-2 mb-2">
                <div className="animate-marquee inline-block text-xl font-medium tracking-wide">
                    ⚠️ Bienvenue sur le site SIGFA. Veuillez attendre votre appel en salle d'attente. Pour toute urgence, contactez le poste de garde. • Le port des EPI est obligatoire sur le site. • Respectez les consignes de sécurité. ⚠️
                </div>
            </div>
        </div>
    );
}
