import { create } from 'zustand';
import { api } from '../services/api';

export type TruckStatus =
    | 'EN_ATTENTE'
    | 'APPELÉ'
    | 'EN_VENTE'
    | 'PESÉ_ENTRÉE'
    | 'EN_CHARGEMENT'
    | 'CHARGEMENT_TERMINÉ'
    | 'PESÉ_SORTIE'
    | 'ANOMALIE_PESÉE'
    | 'BL_GÉNÉRÉ'
    | 'TERMINÉ'
    | 'ANNULÉ';

export type TruckPriority = 'NORMAL' | 'URGENT' | 'CRITIQUE';

export interface Truck {
    id: string;
    ticketNumber: string;
    licensePlate: string;
    driverName: string;
    companyName: string;
    driverPhone?: string;
    department: string; // Deprecated but kept for compatibility
    categories: string[];
    currentCategoryIndex: number;
    orderNumber?: string;
    priority: TruckPriority;
    status: TruckStatus;
    category?: { name: string; prefix: string };
    loadedProducts?: any[];
    createdAt: string;
    arrivedAt: string;
    calledAt?: string;
    weighedInAt?: string;
    loadingStartedAt?: string;
    loadingFinishedAt?: string;
    weighedOutAt?: string;
    completedAt?: string;
    weightIn?: number;
    weightOut?: number;
    netWeight?: number;
    zone?: string;
    callZone?: string;
    notes?: string;
    qrCode?: string;
}

interface TruckStore {
    trucks: Truck[];
    isLoading: boolean;
    fetchTrucks: (filters?: { status?: string }) => Promise<void>;
    addTruck: (truckData: Partial<Truck>) => Promise<Truck>;
    updateStatus: (id: string, status: TruckStatus, extraData?: any) => Promise<void>;
    transferTicket: (id: string, newCategory: string) => Promise<{ oldTicketNumber: string; newTicketNumber: string }>;
    weighIn: (id: string, weight: number) => Promise<void>;
    weighOut: (id: string, weight: number) => Promise<void>;
    getQueuedTrucks: () => Truck[];
    getCalledTrucks: () => Truck[];
}

export const useTruckStore = create<TruckStore>((set, get) => ({
    trucks: [],
    isLoading: false,

    fetchTrucks: async (filters) => {
        set({ isLoading: true });
        try {
            const response = await api.get('/tickets', { params: filters });
            set({ trucks: response.data, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch trucks:', error);
            set({ isLoading: false });
        }
    },

    addTruck: async (truckData) => {
        try {
            const response = await api.post('/tickets', truckData);
            const newTruck = response.data.ticket;
            set((state) => ({
                trucks: [newTruck, ...state.trucks]
            }));
            return newTruck;
        } catch (error) {
            console.error('Failed to add truck:', error);
            throw error;
        }
    },

    updateStatus: async (id, status, extraData = {}) => {
        try {
            await api.put(`/tickets/${id}/status`, { status, ...extraData });
            // Refresh the specific truck in the list
            set((state) => ({
                trucks: state.trucks.map(t => t.id === id ? { ...t, status, ...extraData } : t)
            }));
        } catch (error) {
            console.error('Failed to update status:', error);
            throw error;
        }
    },

    transferTicket: async (id, newCategory) => {
        try {
            const response = await api.put(`/tickets/${id}/transfer`, { newCategory });
            // Refresh the truck list to reflect changes
            await get().fetchTrucks();
            // Return the transfer information
            return {
                oldTicketNumber: response.data.oldTicketNumber,
                newTicketNumber: response.data.newTicketNumber
            };
        } catch (error) {
            console.error('Failed to transfer ticket:', error);
            throw error;
        }
    },

    weighIn: async (id, weight) => {
        try {
            await api.post(`/tickets/${id}/weigh-in`, { weight });
            // Refresh the truck list to reflect changes
            await get().fetchTrucks();
        } catch (error) {
            console.error('Failed to weigh in:', error);
            throw error;
        }
    },

    weighOut: async (id, weight) => {
        try {
            await api.post(`/tickets/${id}/weigh-out`, { weight });
            // Refresh the truck list to reflect changes
            await get().fetchTrucks();
        } catch (error) {
            console.error('Failed to weigh out:', error);
            throw error;
        }
    },

    getQueuedTrucks: () => get().trucks.filter(t => t.status === 'EN_ATTENTE'),
    getCalledTrucks: () => get().trucks.filter(t => t.status === 'APPELÉ' || t.status === 'EN_CHARGEMENT'),
}));
