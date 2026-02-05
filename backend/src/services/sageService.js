import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOCK_PATH = path.join(__dirname, '../data/orders_sage_mock.json');

/**
 * Mock Service pour Sage X3
 * Simule les appels API pour vérifier les commandes
 */
class SageService {
    /**
     * Charge les données de simulation
     */
    async _loadMocks() {
        try {
            const data = await fs.readFile(MOCK_PATH, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading SAGE mock:', error);
            return [];
        }
    }

    /**
     * Recherche une commande par son numéro
     */
    async searchOrder(orderNumber) {
        const mocks = await this._loadMocks();
        const order = mocks.find(m => m.orderNumber.toUpperCase() === orderNumber.toUpperCase());

        if (order) {
            return { exists: true, ...order };
        }

        return { exists: false, error: 'Commande introuvable' };
    }

    /**
     * Vérifie l'existence et l'état d'une commande (Format compatible avec les anciens appels)
     * @param {string} orderNumber 
     * @returns {Promise<{exists: boolean, isPaid: boolean, customerName: string, error?: string}>}
     */
    async validateOrder(orderNumber) {
        // Simulation d'un délai réseau
        await new Promise(resolve => setTimeout(resolve, 300));

        const result = await this.searchOrder(orderNumber);
        if (result.exists) {
            return {
                exists: true,
                isPaid: result.paymentStatus === 'PAID',
                paymentStatus: result.paymentStatus,
                customerName: result.client?.name || 'Client Inconnu',
                commercialName: result.commercial?.name || 'Non assigné',
                suggestedCategories: result.categories?.map(c => c.code) || [],
                products: result.products || []
            };
        }

        return result;
    }
}

export default new SageService();
