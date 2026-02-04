
import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';

const API_URL = 'http://localhost:3000/api';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// L'intercepteur de requête n'est plus nécessaire car le token est géré par Cookie HttpOnly automatiquement par le navigateur.
// On garde juste la config de base.
api.defaults.withCredentials = true; // Important pour envoyer les cookies


// Queue pour les requêtes en attente pendant que le refresh se fait
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {

            // Si c'est déjà une tentative de refresh qui échoue -> logout
            if (originalRequest.url.includes('/auth/refresh-token')) {
                useAuthStore.getState().logout();
                window.location.href = '/login';
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Tenter le refresh
                await api.post('/auth/refresh-token');

                // Si succès, on dépile la queue et on rejoue
                processQueue(null, 'success');
                isRefreshing = false;

                return api(originalRequest);
            } catch (err) {
                processQueue(err, null);
                isRefreshing = false;

                // Si refresh échoue, on déconnecte
                useAuthStore.getState().logout();
                window.location.href = '/login';
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);
