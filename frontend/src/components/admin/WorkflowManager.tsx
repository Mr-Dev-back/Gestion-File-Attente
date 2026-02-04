import { useState } from 'react';
import { cn } from '../../lib/utils';
import { useWorkflows, type Workflow, type WorkflowStep } from '../../hooks/useWorkflows';
import { useQueues } from '../../hooks/useQueues';
import { Button } from '../atoms/ui/button';
import { Input } from '../atoms/ui/input';
import { Card, CardContent } from '../molecules/ui/card';
import { Badge } from '../atoms/ui/badge';
import { Loader2, Plus, Edit2, Trash2, ArrowRight, Network, Layers } from 'lucide-react';
import { Modal, ConfirmModal } from '../molecules/ui/modal';
import { toast } from '../molecules/ui/toast';

export const WorkflowManager = () => {
    const { workflows, isLoading, createWorkflow, updateWorkflow, deleteWorkflow, addStep, updateStep, deleteStep } = useWorkflows();
    const { queues } = useQueues();

    // Workflow Modal State
    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
    const [isWfModalOpen, setIsWfModalOpen] = useState(false);
    const [wfForm, setWfForm] = useState({ name: '', description: '' });

    // Step Modal State
    const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
    const [isStepModalOpen, setIsStepModalOpen] = useState(false);
    const [stepForm, setStepForm] = useState({
        name: '',
        code: '',
        queueId: '',
        order: 0,
        isInitial: false,
        isFinal: false
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

    const closeConfirm = () => setConfirmState(prev => ({ ...prev, isOpen: false }));

    const handleOpenWfModal = (workflow: Workflow | null = null) => {
        if (workflow) {
            setWfForm({ name: workflow.name, description: workflow.description || '' });
            setSelectedWorkflow(workflow);
        } else {
            setWfForm({ name: '', description: '' });
            setSelectedWorkflow(null);
        }
        setIsWfModalOpen(true);
    };

    const handleSaveWorkflow = () => {
        if (selectedWorkflow) {
            updateWorkflow.mutate({ id: selectedWorkflow.id, data: wfForm }, {
                onSuccess: () => {
                    setIsWfModalOpen(false);
                    toast('Workflow mis à jour', 'success');
                },
                onError: () => toast('Erreur lors de la mise à jour', 'error')
            });
        } else {
            createWorkflow.mutate(wfForm, {
                onSuccess: () => {
                    setIsWfModalOpen(false);
                    toast('Workflow créé avec succès', 'success');
                },
                onError: () => toast('Erreur lors de la création', 'error')
            });
        }
    };

    const handleOpenStepModal = (workflow: Workflow, step: WorkflowStep | null = null) => {
        setSelectedWorkflow(workflow);
        setSelectedStep(step);
        if (step) {
            setStepForm({
                name: step.name,
                code: step.code,
                queueId: step.queueId || '',
                order: step.order,
                isInitial: step.isInitial,
                isFinal: step.isFinal
            });
        } else {
            setStepForm({
                name: '',
                code: '',
                queueId: '',
                order: (workflow.steps?.length || 0) + 1,
                isInitial: false,
                isFinal: false
            });
        }
        setIsStepModalOpen(true);
    };

    const handleSaveStep = () => {
        if (!selectedWorkflow) return;

        const payload = { ...stepForm };
        if (!payload.code) payload.code = payload.name.toUpperCase().replace(/\s+/g, '_');
        if (payload.queueId === '') (payload as any).queueId = null;

        if (selectedStep) {
            updateStep.mutate({ id: selectedStep.id, data: payload as any }, {
                onSuccess: () => {
                    setIsStepModalOpen(false);
                    toast('Étape mise à jour', 'success');
                },
                onError: () => toast('Erreur lors de la mise à jour', 'error')
            });
        } else {
            addStep.mutate({ workflowId: selectedWorkflow.id, data: payload as any }, {
                onSuccess: () => {
                    setIsStepModalOpen(false);
                    toast('Étape ajoutée avec succès', 'success');
                },
                onError: () => toast('Erreur lors de l\'ajout', 'error')
            });
        }
    };

    if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg"><Network className="h-5 w-5 text-primary" /></div>
                    <h3 className="text-xl font-bold">Gestion des Workflows</h3>
                </div>
                <Button size="sm" onClick={() => handleOpenWfModal()} className="rounded-xl shadow-md"><Plus className="h-4 w-4 mr-2" /> Créer un Workflow</Button>
            </div>

            <div className="grid gap-6">
                {workflows.map(wf => (
                    <Card key={wf.id} className="border-0 shadow-lg bg-white/50 backdrop-blur-sm rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h4 className="font-black text-2xl text-text-main flex items-center gap-2">
                                        {wf.name}
                                        {wf.isActive ? <Badge variant="success" className="text-[10px]">Actif</Badge> : <Badge variant="secondary" className="text-[10px]">Inactif</Badge>}
                                    </h4>
                                    <p className="text-sm text-text-muted font-medium mt-1">{wf.description || 'Aucune description'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-primary/10" onClick={() => handleOpenWfModal(wf)}><Edit2 className="h-4 w-4 text-primary" /></Button>
                                    <Button size="sm" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-danger/10 text-danger" onClick={() => {
                                        setConfirmState({
                                            isOpen: true,
                                            title: 'Supprimer le workflow',
                                            message: `Voulez-vous vraiment supprimer le workflow "${wf.name}" ?`,
                                            onConfirm: () => deleteWorkflow.mutate(wf.id, {
                                                onSuccess: () => toast('Workflow supprimé', 'success'),
                                                onError: () => toast('Erreur lors de la suppression', 'error')
                                            })
                                        });
                                    }}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </div>

                            {/* Steps Visualization */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-xs font-bold text-text-muted uppercase tracking-widest pl-1">
                                    <span className="flex items-center gap-2"><Layers className="h-3 w-3" /> Étapes du flux</span>
                                    <Button variant="ghost" size="sm" className="h-6 text-[10px] text-primary hover:bg-primary/5" onClick={() => handleOpenStepModal(wf)}>+ Ajouter une étape</Button>
                                </div>

                                <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
                                    {wf.steps?.sort((a, b) => a.order - b.order).map((step, idx) => (
                                        <div key={step.id} className="flex items-center">
                                            <div
                                                className="group relative cursor-pointer"
                                                onClick={() => handleOpenStepModal(wf, step)}
                                            >
                                                <div className={cn(
                                                    "px-6 py-3 rounded-2xl border-2 transition-all duration-300 shadow-sm flex flex-col items-center gap-1",
                                                    step.isInitial ? "border-success bg-success/5" : step.isFinal ? "border-danger bg-danger/5" : "border-primary/20 bg-white"
                                                )}>
                                                    <span className="font-black text-sm whitespace-nowrap">{step.name}</span>
                                                    {step.queueId && (
                                                        <span className="text-[9px] font-bold text-primary/60 flex items-center gap-1">
                                                            <div className="w-1 h-1 bg-primary/40 rounded-full" />
                                                            {queues.find(q => q.id === step.queueId)?.name || 'Queue...'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="secondary" size="sm" className="h-6 w-6 p-0 rounded-full shadow-md"><Edit2 className="h-3 w-3" /></Button>
                                                </div>
                                            </div>
                                            {idx < (wf.steps?.length || 0) - 1 && <ArrowRight className="h-5 w-5 mx-2 text-primary/30 animate-pulse-slow" />}
                                        </div>
                                    ))}
                                    {(!wf.steps || wf.steps.length === 0) && (
                                        <div className="flex-1 text-center py-6 bg-white/20 rounded-2xl border-2 border-dashed border-primary/10">
                                            <span className="text-sm text-text-muted font-bold italic">Aucune étape définie pour ce flux</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Workflow Modal */}
            <Modal isOpen={isWfModalOpen} onClose={() => setIsWfModalOpen(false)} title={selectedWorkflow ? "Modifier le Workflow" : "Nouveau Workflow"}>
                <div className="space-y-4 py-4">
                    <div className="space-y-1">
                        <label className="text-xs font-black uppercase text-text-muted ml-1">Nom du workflow</label>
                        <Input placeholder="Ex: Flux Standard SIBM" value={wfForm.name} onChange={(e) => setWfForm({ ...wfForm, name: e.target.value })} className="rounded-xl h-12" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-black uppercase text-text-muted ml-1">Description</label>
                        <Input placeholder="Description des étapes..." value={wfForm.description} onChange={(e) => setWfForm({ ...wfForm, description: e.target.value })} className="rounded-xl h-12" />
                    </div>
                    <div className="flex justify-end gap-2 pt-6">
                        <Button variant="outline" onClick={() => setIsWfModalOpen(false)} className="rounded-xl h-12 px-8">Annuler</Button>
                        <Button onClick={handleSaveWorkflow} className="rounded-xl h-12 px-8 shadow-lg shadow-primary/20">{selectedWorkflow ? 'Enregistrer' : 'Créer'}</Button>
                    </div>
                </div>
            </Modal>

            {/* Step Modal */}
            <Modal isOpen={isStepModalOpen} onClose={() => setIsStepModalOpen(false)} title={selectedStep ? `Étape: ${selectedStep.name}` : "Nouvelle Étape"}>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-black uppercase text-text-muted ml-1">Nom</label>
                            <Input placeholder="Nom de l'étape" value={stepForm.name} onChange={(e) => setStepForm({ ...stepForm, name: e.target.value })} className="rounded-xl h-11" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-black uppercase text-text-muted ml-1">Code (Auto)</label>
                            <Input placeholder="CODE_ETAPE" value={stepForm.code} onChange={(e) => setStepForm({ ...stepForm, code: e.target.value })} className="rounded-xl h-11" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-black uppercase text-text-muted ml-1">File d'attente associée</label>
                        <select
                            className="w-full h-11 px-3 border-2 border-primary/10 rounded-xl focus:border-primary outline-none transition-all font-bold text-sm bg-white"
                            value={stepForm.queueId}
                            onChange={(e) => setStepForm({ ...stepForm, queueId: e.target.value })}
                        >
                            <option value="">-- Aucune file d'attente --</option>
                            {queues.filter(q => q.workflowId === selectedWorkflow?.id || !q.workflowId).map(q => (
                                <option key={q.id} value={q.id}>{q.name}</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-text-muted mt-1 ml-1 font-bold italic">L'étape sera regroupée dans cette file d'attente.</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 border-t border-primary/5 pt-4">
                        <div className="flex flex-col items-center gap-2 p-3 bg-primary/5 rounded-2xl border border-primary/10">
                            <span className="text-[10px] font-black uppercase">Ordre</span>
                            <Input type="number" value={stepForm.order} onChange={(e) => setStepForm({ ...stepForm, order: parseInt(e.target.value) })} className="h-8 w-16 text-center rounded-lg" />
                        </div>
                        <div className="flex flex-col items-center gap-2 p-3 bg-success/5 rounded-2xl border border-success/10">
                            <span className="text-[10px] font-black uppercase text-success">Initial</span>
                            <input type="checkbox" checked={stepForm.isInitial} onChange={(e) => setStepForm({ ...stepForm, isInitial: e.target.checked })} className="h-5 w-5 rounded accent-success" />
                        </div>
                        <div className="flex flex-col items-center gap-2 p-3 bg-danger/5 rounded-2xl border border-danger/10">
                            <span className="text-[10px] font-black uppercase text-danger">Final</span>
                            <input type="checkbox" checked={stepForm.isFinal} onChange={(e) => setStepForm({ ...stepForm, isFinal: e.target.checked })} className="h-5 w-5 rounded accent-danger" />
                        </div>
                    </div>

                    <div className="flex justify-between gap-2 pt-6">
                        {selectedStep && (
                            <Button variant="ghost" onClick={() => {
                                setConfirmState({
                                    isOpen: true,
                                    title: 'Supprimer l\'étape',
                                    message: `Voulez-vous vraiment supprimer l'étape "${selectedStep.name}" ?`,
                                    onConfirm: () => deleteStep.mutate(selectedStep.id, {
                                        onSuccess: () => {
                                            setIsStepModalOpen(false);
                                            toast('Étape supprimée', 'success');
                                        },
                                        onError: () => toast('Erreur lors de la suppression', 'error')
                                    })
                                });
                            }} className="rounded-xl h-11 text-danger hover:bg-danger/10">
                                <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                            </Button>
                        )}
                        <div className="flex gap-2 ml-auto">
                            <Button variant="outline" onClick={() => setIsStepModalOpen(false)} className="rounded-xl h-11 px-6">Annuler</Button>
                            <Button onClick={handleSaveStep} className="rounded-xl h-11 px-8 shadow-lg shadow-primary/20">{selectedStep ? 'Enregistrer' : 'Ajouter'}</Button>
                        </div>
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
