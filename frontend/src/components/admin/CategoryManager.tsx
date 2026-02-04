import { useState } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { useQueues } from '../../hooks/useQueues';
import { Button } from '../atoms/ui/button';
import { Input } from '../atoms/ui/input';
import { Card, CardContent } from '../molecules/ui/card';
import { Badge } from '../atoms/ui/badge';
import { Loader2, Plus, Edit2, Trash2, Tag, Truck } from 'lucide-react';
import { Modal, ConfirmModal } from '../molecules/ui/modal';
import { toast } from '../molecules/ui/toast';

export const CategoryManager = () => {
    const { categories, isLoading, createCategory, updateCategory, deleteCategory } = useCategories();
    const { queues } = useQueues();

    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({
        name: '',
        prefix: '',
        estimatedDuration: 30,
        description: '',
        color: '#3b82f6',
        queueIds: [] as string[]
    });

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

    const handleOpenModal = (category: any = null) => {
        if (category) {
            setForm({
                name: category.name,
                prefix: category.prefix,
                estimatedDuration: category.estimatedDuration,
                description: category.description || '',
                color: category.color || '#3b82f6',
                queueIds: category.queues ? category.queues.map((q: any) => q.id) : []
            });
            setSelectedCategory(category);
        } else {
            setForm({ name: '', prefix: '', estimatedDuration: 30, description: '', color: '#3b82f6', queueIds: [] });
            setSelectedCategory(null);
        }
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (selectedCategory) {
            updateCategory.mutate({ id: selectedCategory.id, data: form } as any, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    toast('Catégorie mise à jour', 'success');
                },
                onError: () => toast('Erreur lors de la mise à jour', 'error')
            });
        } else {
            createCategory.mutate(form as any, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    toast('Catégorie créée avec succès', 'success');
                },
                onError: () => toast('Erreur lors de la création', 'error')
            });
        }
    };

    const toggleQueue = (queueId: string) => {
        setForm(prev => {
            const newIds = prev.queueIds.includes(queueId)
                ? prev.queueIds.filter(id => id !== queueId)
                : [...prev.queueIds, queueId];
            return { ...prev, queueIds: newIds };
        });
    };

    if (isLoading) return <Loader2 className="animate-spin" />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold flex items-center gap-2"><Tag className="h-5 w-5" /> Catégories de produits</h3>
                <Button size="sm" onClick={() => handleOpenModal()}><Plus className="h-4 w-4 mr-2" /> Nouvelle Catégorie</Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category: any) => (
                    <Card key={category.id} className="border-border/50 hover:border-primary/20 transition-all">
                        <CardContent className="p-4 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: category.color || '#3b82f6' }} />
                                    <div>
                                        <h4 className="font-bold">{category.name}</h4>
                                        <span className="text-xs text-text-muted font-mono bg-white/5 px-1 rounded">{category.prefix}</span>
                                    </div>
                                </div>
                                <Badge variant={category.isActive ? "success" : "secondary"}>{category.isActive ? "Actif" : "Inactif"}</Badge>
                            </div>

                            <p className="text-sm text-text-muted line-clamp-2 min-h-[2.5em]">{category.description || "Aucune description"}</p>

                            <div className="flex flex-wrap gap-1 mt-2">
                                {category.queues && category.queues.length > 0 ? category.queues.map((q: any) => (
                                    <Badge key={q.id} variant="outline" className="text-[10px] bg-primary/5 border-primary/20"><Truck className="h-3 w-3 mr-1" />{q.name}</Badge>
                                )) : <span className="text-xs text-text-muted italic">Aucune file associée</span>}
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-border/10 mt-auto">
                                <Button size="sm" variant="ghost" className="h-8" onClick={() => handleOpenModal(category)}><Edit2 className="h-3.5 w-3.5" /></Button>
                                <Button size="sm" variant="ghost" className="h-8 text-danger" onClick={() => {
                                    setConfirmState({
                                        isOpen: true,
                                        title: 'Supprimer la catégorie',
                                        message: `Voulez-vous vraiment supprimer la catégorie "${category.name}" ?`,
                                        onConfirm: () => deleteCategory.mutate(category.id, {
                                            onSuccess: () => toast('Catégorie supprimée', 'success'),
                                            onError: () => toast('Erreur lors de la suppression', 'error')
                                        })
                                    });
                                }}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedCategory ? "Modifier Catégorie" : "Nouvelle Catégorie"}>
                <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label className="text-xs font-bold uppercase mb-1 block">Nom</label>
                            <Input placeholder="Ex: Blé dur" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase mb-1 block">Couleur</label>
                            <div className="flex items-center gap-2">
                                <input type="color" className="h-9 w-full cursor-pointer rounded border p-1" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase mb-1 block">Préfixe Ticket</label>
                            <Input placeholder="Ex: BLE" value={form.prefix} onChange={(e) => setForm({ ...form, prefix: e.target.value.toUpperCase() })} maxLength={5} />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase mb-1 block">Durée Est. (min)</label>
                            <Input type="number" value={form.estimatedDuration} onChange={(e) => setForm({ ...form, estimatedDuration: parseInt(e.target.value) })} />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase mb-1 block">Description</label>
                        <textarea
                            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            rows={3}
                            placeholder="Description optionnelle..."
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                    </div>

                    <div className="border-t border-border/10 pt-4">
                        <label className="text-xs font-bold uppercase mb-2 block flex items-center gap-2"><Truck className="h-4 w-4" /> Postes de vente associés</label>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-secondary/5 rounded-lg border border-border/10">
                            {queues.map(q => (
                                <label key={q.id} className="flex items-center gap-2 p-2 rounded hover:bg-white/5 cursor-pointer border border-transparent hover:border-primary/20 transition-all">
                                    <input
                                        type="checkbox"
                                        checked={form.queueIds.includes(q.id)}
                                        onChange={() => toggleQueue(q.id)}
                                        className="rounded border-primary/30 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm">{q.name}</span>
                                </label>
                            ))}
                            {queues.length === 0 && <span className="text-xs text-text-muted col-span-2 text-center py-4">Aucune file disponible. Créez des files d'abord.</span>}
                        </div>
                        <p className="text-[10px] text-text-muted mt-1">Sélectionnez les files capables de traiter ce type de produit.</p>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                        <Button onClick={handleSave}>{selectedCategory ? 'Modifier' : 'Créer'}</Button>
                    </div>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmState.onConfirm}
                title={confirmState.title}
                message={confirmState.message}
                variant="danger"
            />
        </div>
    );
};
