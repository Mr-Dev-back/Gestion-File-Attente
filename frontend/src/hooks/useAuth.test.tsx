import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from './useAuth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import * as apiModule from '../services/api';

// Mock the API module
vi.mock('../services/api', () => ({
    api: {
        post: vi.fn(),
    },
}));

// Mock the auth store
vi.mock('../stores/useAuthStore', () => ({
    useAuthStore: vi.fn(() => ({
        setAuth: vi.fn(),
        user: null,
        token: null,
    })),
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('useAuth Hook', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
        vi.clearAllMocks();
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </BrowserRouter>
    );

    it('should successfully login with valid credentials', async () => {
        const mockResponse = {
            data: {
                user: { id: '1', email: 'test@example.com', role: 'ADMINISTRATOR' },
                token: 'mock-token',
            },
        };

        vi.spyOn(apiModule.api, 'post').mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useAuth(), { wrapper });

        result.current.login.mutate({
            email: 'test@example.com',
            password: 'password123',
        });

        await waitFor(() => {
            expect(result.current.login.isSuccess).toBe(true);
        });

        expect(apiModule.api.post).toHaveBeenCalledWith('/auth/login', {
            email: 'test@example.com',
            password: 'password123',
        });
    });

    it('should handle login failure', async () => {
        vi.spyOn(apiModule.api, 'post').mockRejectedValueOnce(
            new Error('Invalid credentials')
        );

        const { result } = renderHook(() => useAuth(), { wrapper });

        result.current.login.mutate({
            email: 'wrong@example.com',
            password: 'wrongpass',
        });

        await waitFor(() => {
            expect(result.current.login.isError).toBe(true);
        });
    });
});
