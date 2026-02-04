import { useState } from 'react';
import { useQueues, type Queue } from '../../hooks/useQueues';
import { useWorkflows } from '../../hooks/useWorkflows';
import { useSites } from '../../hooks/useSites';
import { Button } from '../atoms/ui/button';
import { Input } from '../atoms/ui/input';
import { Card, CardContent } from '../molecules/ui/card';
import { Badge } from '../atoms/ui/badge';
import { Loader2, Plus, Edit2, Trash2, ListOrdered, Building2, Network } from 'lucide-react';
import { Modal, ConfirmModal } from '../molecules/ui/modal';
import { toast } from '../molecules/ui/toast';

export const QueueManager = () => {
    const { queues, isLoading, createQueue, updateQueue, deleteQueue } = useQueues();
    const { sites } = useSites();
    const { workflows } = useWorkflows();

    const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({ name: '', siteId: '', workflowId: '', priority: 0, isActive: true });

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

    const handleOpenModal = (queue: Queue | null = null) => {
        if (queue) {
            setForm({
                name: queue.name,
                siteId: queue.siteId,
                workflowId: queue.workflowId || '',
                priority: queue.priority,
                isActive: queue.isActive
            });
            setSelectedQueue(queue);
        } else {
            setForm({ name: '', siteId: '', workflowId: '', priority: 0, isActive: true });
            setSelectedQueue(null);
        }
        setIsModalOpen(true);
    };

    const handleSave = () => {
        const payload = { ...form };
        if (!payload.workflowId) delete (payload as any).workflowId;

        if (selectedQueue) {
            updateQueue.mutate({ id: selectedQueue.id, data: payload }, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    toast('File d\'attente mise à jour', 'success');
                },
                onError: () => toast('Erreur lors de la mise à jour', 'error')
            });
        } else {
            createQueue.mutate(payload, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    toast('File d\'attente créée avec succès', 'success');
                },
                onError: () => toast('Erreur lors de la création', 'error')
            });
        }
    };

    if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg"><ListOrdered className="h-5 w-5 text-primary" /></div>
                    <h3 className="text-xl font-bold">Files d'attente</h3>
                </div>
                <Button size="sm" onClick={() => handleOpenModal()} className="rounded-xl shadow-md"><Plus className="h-4 w-4 mr-2" /> Créer une file</Button>
            </div>

            <div className="grid gap-4">
                {queues.map(queue => (
                    <Card key={queue.id} className="border-0 shadow-lg bg-white/50 backdrop-blur-sm rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <h4 className="font-black text-text-main text-lg">{queue.name}</h4>
                                    <Badge variant={queue.isActive ? 'success' : 'secondary'} className="text-[10px]">{queue.isActive ? 'Active' : 'Inactive'}</Badge>
                                    <Badge variant="outline" className="text-[10px] border-primary/20 text-primary bg-primary/5">Priorité: {queue.priority}</Badge>
                                </div>
                                <div className="flex flex-wrap gap-4 pt-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-text-muted">
                                        <Building2 className="h-3.5 w-3.5 opacity-50" />
                                        <span>{queue.site?.name || 'Aucun site'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary/60">
                                        <Network className="h-3.5 w-3.5 opacity-50" />
                                        <span>{queue.workflow?.name || 'Aucun workflow'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-primary/10" onClick={() => handleOpenModal(queue)}><Edit2 className="h-4 w-4 text-primary" /></Button>
                                <Button size="sm" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-danger/10 text-danger" onClick={() => {
                                    setConfirmState({
                                        isOpen: true,
                                        title: 'Supprimer la file',
                                        message: `Voulez-vous vraiment supprimer la file d'attente "${queue.name}" ?`,
                                        onConfirm: () => deleteQueue.mutate(queue.id, {
                                            onSuccess: () => toast('File d\'attente supprimée', 'success'),
                                            onError: () => toast('Erreur lors de la suppression', 'error')
                                        })
                                    });
                                }}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedQueue ? "Modifier la file d'attente" : "Nouvelle file d'attente"}>
                <div className="space-y-5 py-4">
                    <div className="space-y-1">
                        <label className="text-xs font-black uppercase text-text-muted ml-1">Nom de la file</label>
                        <Input placeholder="Ex: File d'attente Ventes" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl h-11" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-black uppercase text-text-muted ml-1">Site</label>
                            <select
                                className="w-full h-11 px-3 border-2 border-primary/10 rounded-xl focus:border-primary outline-none transition-all font-bold text-sm bg-white"
                                value={form.siteId}
                                onChange={(e) => setForm({ ...form, siteId: e.target.value })}
                            >
                                <option value="">-- Sélectionner --</option>
                                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-black uppercase text-text-muted ml-1">Workflow</label>
                            <select
                                className="w-full h-11 px-3 border-2 border-primary/10 rounded-xl focus:border-primary outline-none transition-all font-bold text-sm bg-white"
                                value={form.workflowId}
                                onChange={(e) => setForm({ ...form, workflowId: e.target.value })}
                            >
                                <option value="">-- Sélectionner --</option>
                                {workflows.map(wf => <option key={wf.id} value={wf.id}>{wf.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <div className="space-y-1">
                            <label className="text-xs font-black uppercase text-text-muted">Priorité</label>
                            <p className="text-[10px] text-text-muted italic">Ordre d'affichage (0-100)</p>
                        </div>
                        <Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })} className="h-10 w-24 text-center rounded-xl font-black text-lg" />
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl border border-white/40">
                        <input type="checkbox" id="queue-active" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-5 w-5 rounded accent-primary" />
                        <label htmlFor="queue-active" className="text-sm font-bold cursor-pointer">File d'attente active</label>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl h-11 px-6">Annuler</Button>
                        <Button onClick={handleSave} className="rounded-xl h-11 px-8 shadow-lg shadow-primary/20">{selectedQueue ? 'Enregistrer' : 'Créer'}</Button>
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
