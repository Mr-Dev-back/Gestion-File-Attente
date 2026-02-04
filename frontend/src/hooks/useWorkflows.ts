import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export interface WorkflowStep {
    id: string;
    workflowId: string;
    queueId?: string;
    name: string;
    code: string;
    order: number;
    color: string;
    isInitial: boolean;
    isFinal: boolean;
}

export interface WorkflowTransition {
    id: string;
    fromStepId: string;
    toStepId: string;
    allowedRoles: string[];
}

export interface Workflow {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    steps?: WorkflowStep[];
    transitions?: WorkflowTransition[];
}

export function useWorkflows() {
    const queryClient = useQueryClient();

    const { data: workflows = [], isLoading } = useQuery<Workflow[]>({
        queryKey: ['workflows'],
        queryFn: async () => {
            const { data } = await api.get('/workflows');
            return data;
        },
    });

    const createWorkflow = useMutation({
        mutationFn: (data: Partial<Workflow>) => api.post('/workflows', data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }),
    });

    const updateWorkflow = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Workflow> }) => api.put(`/workflows/${id}`, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }),
    });

    const deleteWorkflow = useMutation({
        mutationFn: (id: string) => api.delete(`/workflows/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }),
    });

    // Step Mutations
    const addStep = useMutation({
        mutationFn: ({ workflowId, data }: { workflowId: string; data: Partial<WorkflowStep> }) => api.post(`/workflows/${workflowId}/steps`, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }),
    });

    const updateStep = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<WorkflowStep> }) => api.put(`/workflows/steps/${id}`, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }),
    });

    const deleteStep = useMutation({
        mutationFn: (id: string) => api.delete(`/workflows/steps/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }),
    });

    // Transition Mutations
    const addTransition = useMutation({
        mutationFn: ({ workflowId, data }: { workflowId: string; data: Partial<WorkflowTransition> }) => api.post(`/workflows/${workflowId}/transitions`, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }),
    });

    const deleteTransition = useMutation({
        mutationFn: (id: string) => api.delete(`/workflows/transitions/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }),
    });

    return {
        workflows,
        isLoading,
        createWorkflow,
        updateWorkflow,
        deleteWorkflow,
        addStep,
        updateStep,
        deleteStep,
        addTransition,
        deleteTransition
    };
}
