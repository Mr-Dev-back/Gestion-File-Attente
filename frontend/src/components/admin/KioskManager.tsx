import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socket } from '../../lib/socket';
import { useKiosks, type Kiosk } from '../../hooks/useKiosks';
import { useSites } from '../../hooks/useSites';
import { useQueues } from '../../hooks/useQueues';
import { Button } from '../atoms/ui/button';
import { Input } from '../atoms/ui/input';
import { Card, CardContent } from '../molecules/ui/card';
import { Badge } from '../atoms/ui/badge';
import { Loader2, Plus, Edit2, Trash2, Monitor, WifiOff } from 'lucide-react';
import { Modal, ConfirmModal } from '../molecules/ui/modal';
import { toast } from '../molecules/ui/toast';

const KioskStatusBadge = ({ status }: { status: Kiosk['status'] }) => {
    switch (status) {
        case 'ONLINE': return <Badge className="bg-success text-white">En ligne</Badge>;
        case 'OFFLINE': return <Badge variant="secondary"><WifiOff className="h-3 w-3 mr-1" />Hors ligne</Badge>;
        case 'MAINTENANCE': return <Badge className="bg-warning text-black">Maintenance</Badge>;
        case 'PAPER_EMPTY': return <Badge className="bg-destructive text-white">Papier vide</Badge>;
        case 'ERROR': return <Badge className="bg-destructive text-white">Erreur</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
};

export const KioskManager = () => {
    const { kiosks, isLoading, createKiosk, updateKiosk, deleteKiosk } = useKiosks();
    const { sites } = useSites();
    const { queues } = useQueues();
    const queryClient = useQueryClient();

    // Real-time updates
    useEffect(() => {
        const handleUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ['kiosks'] });
        };
        socket.on('kiosk-update', handleUpdate);
        return () => {
            socket.off('kiosk-update', handleUpdate);
        };
    }, [queryClient]);

    const [selectedKiosk, setSelectedKiosk] = useState<Kiosk | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState<Partial<Kiosk>>({ name: '', type: 'ENTRANCE', status: 'OFFLINE', siteId: '', queueId: '' });

    const handleOpenModal = (kiosk: Kiosk | null = null) => {
        if (kiosk) {
            setForm({
                name: kiosk.name,
                type: kiosk.type,
                status: kiosk.status,
                siteId: kiosk.siteId,
                queueId: kiosk.queueId || '',
                ipAddress: kiosk.ipAddress || ''
            });
            setSelectedKiosk(kiosk);
        } else {
            setForm({ name: '', type: 'ENTRANCE', status: 'OFFLINE', siteId: '', queueId: '', ipAddress: '' });
            setSelectedKiosk(null);
        }
        setIsModalOpen(true);
    };

    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    const closeConfirm = () => setConfirmState(prev => ({ ...prev, isOpen: false }));

    const handleSave = () => {
        const payload = { ...form };
        if (!payload.queueId) delete payload.queueId; // Remove if empty
        if (!payload.ipAddress) delete payload.ipAddress;

        if (selectedKiosk) {
            updateKiosk.mutate({ id: selectedKiosk.id, data: payload }, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    toast('Borne mise à jour', 'success');
                },
                onError: () => toast('Erreur lors de la mise à jour', 'error')
            });
        } else {
            createKiosk.mutate(payload, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    toast('Borne créée avec succès', 'success');
                },
                onError: () => toast('Erreur lors de la création', 'error')
            });
        }
    };

    // Derived: queues filtered by currently selected site in form
    const filteredQueues = queues ? queues.filter(q => q.siteId === form.siteId) : [];

    if (isLoading) return <Loader2 className="animate-spin" />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold flex items-center gap-2"><Monitor className="h-5 w-5" /> Bornes Terrain</h3>
                <Button size="sm" onClick={() => handleOpenModal()}><Plus className="h-4 w-4 mr-2" /> Nouvelle Borne</Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kiosks.map(kiosk => (
                    <Card key={kiosk.id} className="border-border/50 hover:border-primary/20 transition-all">
                        <CardContent className="p-4 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Monitor className="h-4 w-4 text-primary" />
                                        <h4 className="font-bold">{kiosk.name}</h4>
                                    </div>
                                    <span className="text-xs text-text-muted">{kiosk.type}</span>
                                </div>
                                <KioskStatusBadge status={kiosk.status} />
                            </div>

                            <div className="text-sm space-y-1">
                                <div className="flex justify-between border-b border-border/10 pb-1">
                                    <span className="text-text-muted">Site</span>
                                    <span className="font-medium">{kiosk.site?.name || '?'}</span>
                                </div>
                                <div className="flex justify-between border-b border-border/10 pb-1">
                                    <span className="text-text-muted">File</span>
                                    <span className="font-medium">{kiosk.queue?.name || '-'}</span>
                                </div>
                                {kiosk.ipAddress && (
                                    <div className="flex justify-between pt-1">
                                        <span className="text-text-muted">IP</span>
                                        <span className="font-mono text-xs">{kiosk.ipAddress}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-border/10 mt-auto">
                                <Button size="sm" variant="ghost" className="h-8" onClick={() => handleOpenModal(kiosk)}><Edit2 className="h-3.5 w-3.5" /></Button>
                                <Button size="sm" variant="ghost" className="h-8 text-danger" onClick={() => {
                                    setConfirmState({
                                        isOpen: true,
                                        title: 'Supprimer la borne',
                                        message: `Voulez-vous vraiment supprimer la borne "${kiosk.name}" ?`,
                                        onConfirm: () => deleteKiosk.mutate(kiosk.id, {
                                            onSuccess: () => toast('Borne supprimée', 'success'),
                                            onError: () => toast('Erreur lors de la suppression', 'error')
                                        })
                                    });
                                }}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedKiosk ? "Modifier Borne" : "Nouvelle Borne"}>
                <div className="space-y-4 py-4">
                    <Input placeholder="Nom de la borne" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase mb-1 block">Type</label>
                            <select className="w-full p-2 border rounded-md" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
                                <option value="ENTRANCE">Entrée</option>
                                <option value="INFO">Information</option>
                                <option value="WEIGHING_BRIDGE">Pont Bascule</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase mb-1 block">Statut</label>
                            <select className="w-full p-2 border rounded-md" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
                                <option value="ONLINE">En ligne</option>
                                <option value="OFFLINE">Hors ligne</option>
                                <option value="MAINTENANCE">Maintenance</option>
                                <option value="PAPER_EMPTY">Papier vide</option>
                            </select>
                        </div>
                    </div>

                    <Input placeholder="Adresse IP (optionnel)" value={form.ipAddress} onChange={(e) => setForm({ ...form, ipAddress: e.target.value })} />

                    <div>
                        <label className="text-xs font-bold uppercase mb-1 block">Site</label>
                        <select className="w-full p-2 border rounded-md" value={form.siteId} onChange={(e) => setForm({ ...form, siteId: e.target.value, queueId: '' })}>
                            <option value="">-- Sélectionner un Site --</option>
                            {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    {form.siteId && (
                        <div>
                            <label className="text-xs font-bold uppercase mb-1 block">File associée (optionnel)</label>
                            <select className="w-full p-2 border rounded-md" value={form.queueId} onChange={(e) => setForm({ ...form, queueId: e.target.value })}>
                                <option value="">-- Aucune --</option>
                                {filteredQueues.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                        <Button onClick={handleSave}>{selectedKiosk ? 'Modifier' : 'Créer'}</Button>
                    </div>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmState.onConfirm}
                title={confirmState.title}
                message={confirmState.message}
                variant="danger"
            />
        </div>
    );
};
