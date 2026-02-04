import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

class RedisService {
    constructor() {
        this.client = createClient({
            url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 0) return false;
                    return 500;
                }
            }
        });

        // Gestion silencieuse des erreurs de connexion (pour le dev local sans Redis)
        this.client.on('error', (err) => {
            if (err.code === 'ECONNREFUSED') {
                // On affiche juste un warning au premier échec, pas de stack trace
                // Le health check indiquera le statut déconnecté
                return;
            }
            console.warn('Redis Client Warning:', err.message);
        });
    }

    getInstance() {
        return this.client;
    }
}

const redisService = new RedisService();
export const redisClient = redisService.getInstance();
