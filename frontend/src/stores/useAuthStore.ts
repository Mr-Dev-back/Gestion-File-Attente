import { create } from 'zustand';
import { persist } from 'zustand/middleware';



export type UserRole = 'SUPERVISOR' | 'MANAGER' | 'AGENT_QUAI' | 'ADMINISTRATOR';

interface User {
    id: string;
    username: string;
    role: UserRole;
    email: string;

}

interface AuthState {
    user: User | null;
    token: string | null; // Kept for types but unused
    isAuthenticated: boolean;
    setAuth: (user: User) => void;
    logout: () => void;
    // Helper Methods
    hasRole: (roles: UserRole[]) => boolean;
    isAdmin: () => boolean;
    isSupervisor: () => boolean;
    isManager: () => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            setAuth: (user: User) => {
                set({ user, isAuthenticated: true });
            },
            logout: async () => {
                try {
                    await import('../services/api').then(m => m.api.post('/auth/logout'));
                } catch (e) { console.error(e); }
                set({ user: null, isAuthenticated: false });
            },
            hasRole: (roles: UserRole[]) => {
                const user = get().user;
                return user ? roles.includes(user.role) : false;
            },
            isAdmin: () => get().user?.role === 'ADMINISTRATOR',
            isSupervisor: () => get().user?.role === 'SUPERVISOR',
            isManager: () => get().user?.role === 'MANAGER',
        }),
        {
            name: 'sigfa-auth-storage',
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
