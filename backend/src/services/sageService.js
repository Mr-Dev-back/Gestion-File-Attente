/**
 * Mock Service pour Sage X3
 * Simule les appels API pour vérifier les commandes
 */
class SageService {
    /**
     * Vérifie l'existence et l'état d'une commande
     * @param {string} orderNumber 
     * @returns {Promise<{exists: boolean, isPaid: boolean, customerName: string, error?: string}>}
     */
    async validateOrder(orderNumber) {
        // Simulation d'un délai réseau
        await new Promise(resolve => setTimeout(resolve, 500));

        // Simulation de données
        const mockOrders = {
            'CMD001': { exists: true, isPaid: true, customerName: 'ENTREPRISE BTP DÉCO' },
            'CMD002': { exists: true, isPaid: false, customerName: 'CONSTRUCTION PLUS' },
            'CMD-SOLD': { exists: true, isPaid: true, customerName: 'SIBM CLIENT TEST' }
        };

        if (mockOrders[orderNumber]) {
            return mockOrders[orderNumber];
        }

        // Si le numéro commence par "CMD", on simule qu'elle existe mais n'est pas soldée par défaut
        if (orderNumber.startsWith('CMD')) {
            return { exists: true, isPaid: false, customerName: 'CLIENT INCONNU SAGE' };
        }

        return { exists: false, error: 'Commande introuvable dans Sage X3' };
    }
}

export default new SageService();
