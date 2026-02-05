import { Op } from 'sequelize';
import { RefreshToken } from '../models/index.js';
import logger from '../config/logger.js';

/**
 * Service de nettoyage périodique de la base de données
 */
class CleanupService {
    constructor() {
        this.interval = null;
    }

    /**
     * Démarre le nettoyage automatique toutes les 24 heures
     */
    start() {
        logger.info('Service de nettoyage démarré.');

        // Exécuter une fois au démarrage
        this.cleanExpiredTokens();

        // Puis toutes les 24 heures
        this.interval = setInterval(() => {
            this.cleanExpiredTokens();
        }, 24 * 60 * 60 * 1000);
    }

    /**
     * Supprime les tokens de rafraîchissement expirés ou révoqués depuis plus de 7 jours
     */
    async cleanExpiredTokens() {
        try {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            const deletedCount = await RefreshToken.destroy({
                where: {
                    [Op.or]: [
                        { expiresAt: { [Op.lt]: new Date() } }, // Expire
                        {
                            revoked: true,
                            updatedAt: { [Op.lt]: sevenDaysAgo } // Révoqué depuis > 7j
                        }
                    ]
                }
            });

            if (deletedCount > 0) {
                logger.info(`Nettoyage: ${deletedCount} refresh tokens expirés supprimés.`);
            }
        } catch (error) {
            logger.error('Erreur lors du nettoyage des tokens:', error);
        }
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
}

export default new CleanupService();
