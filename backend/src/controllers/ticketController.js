import { Ticket, User, Site, Company } from '../models/index.js';
import { sequelize } from '../config/database.js';
import { Op } from 'sequelize';
import QRCode from 'qrcode';
import logger from '../config/logger.js';
import sageService from '../services/sageService.js';

class TicketController {
    /**
     * Créer un nouveau ticket à l'entrée (Gate In)
     */
    async createTicket(req, res) {
        try {
            const {
                licensePlate,
                driverName,
                driverPhone,
                companyName,
                salesRepresentative,
                orderNumber,
                categories, // NEW
                priority,
                priorityReason,
                notes,
                loadedProducts
            } = req.body;



            // 1. Validation Sage X3 (Mock)
            let customerNameFromSage = null;
            if (orderNumber) {
                const sageValidation = await sageService.validateOrder(orderNumber);

                if (sageValidation.exists) {
                    // Si elle existe on vérifie si elle est soldée (ici simulated by isPaid)
                    if (sageValidation.isPaid) {
                        // Si déjà soldée, on pourrait bloquer ou avertir.
                        // L'utilisateur dit : "on vérifie si elle soldée, sinon on peut continuer l'enregistrement"
                        // Traduction : "Si PAS soldée, on continue".
                    }
                    customerNameFromSage = sageValidation.customerName;
                }
            }

            // 2. Récupérer les infos du site de l'utilisateur
            const agent = await User.findByPk(req.user?.id, {
                include: [{ model: Site, as: 'site' }]
            });

            // 3. Générer le numéro de ticket
            const ticketNumber = await Ticket.generateTicketNumber(categories);

            // 4. Générer le QR Code
            const qrCodeData = await QRCode.toDataURL(ticketNumber);

            // 5. Créer le ticket
            const ticket = await Ticket.create({
                ticketNumber,
                qrCode: qrCodeData,
                licensePlate,
                driverName,
                driverPhone,
                companyName: customerNameFromSage || companyName,
                customerName: customerNameFromSage || companyName,
                salesRepresentative,
                orderNumber,
                categories: categories || [],
                priority: priority || 'NORMAL',
                priorityReason,
                notes,
                loadedProducts,
                createdById: req.user?.id,
                siteId: agent?.siteId,
                companyId: agent?.site?.companyId,
                status: 'EN_ATTENTE',
                arrivedAt: new Date()
            });

            // 5. Notifier via Socket.io (si disponible)
            const io = req.app.get('io');
            if (io) {
                io.emit('new-ticket', {
                    id: ticket.id,
                    ticketNumber: ticket.ticketNumber,
                    licensePlate: ticket.licensePlate,
                    status: ticket.status
                });
                logger.info(`Notification Socket envoyée pour le ticket ${ticketNumber}`);
            }

            res.status(201).json({
                message: 'Ticket créé avec succès.',
                ticket
            });

        } catch (error) {
            logger.error('Erreur lors de la création du ticket:', error);
            res.status(500).json({ error: 'Erreur interne lors de la création du ticket.' });
        }
    }

    /**
     * Récupérer tous les tickets (avec filtres optionnels)
     */
    async getAllTickets(req, res) {
        try {
            const { status, categoryId } = req.query;
            const where = {};
            if (status) where.status = status;

            // Filter by department if user has specific department
            // TODO: Update logic for multi-category support
            // if (req.user && req.user.department && req.user.department !== 'ALL') {
            //     where.department = req.user.department;
            // }

            const tickets = await Ticket.findAll({
                where,
                order: [['createdAt', 'DESC']]
            });

            // Filter by department if user has specific department
            // In-memory filter to handle dynamic JSON array indexing
            let filteredTickets = tickets;
            if (req.user && req.user.department && req.user.department !== 'ALL') {
                filteredTickets = tickets.filter(t => {
                    const currentCat = t.categories && t.categories[t.currentCategoryIndex || 0];
                    // If no categories, maybe fallback to TP or show nothing?
                    // Assuming 'TP' default for legacy or empty.
                    const activeCategory = currentCat || 'TP';

                    // Show if active category matches user department
                    // OR if user is involved in a global queue?
                    // Strict matching for Sales/Park agents:
                    return activeCategory === req.user.department;
                });
            }

            res.status(200).json(filteredTickets);
        } catch (error) {
            logger.error('Erreur récupération tickets:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des tickets.' });
        }
    }

    /**
     * Récupérer un ticket par son ID
     */
    async getTicketById(req, res) {
        try {
            const ticket = await Ticket.findByPk(req.params.id);

            if (!ticket) {
                return res.status(404).json({ error: 'Ticket non trouvé.' });
            }

            res.status(200).json(ticket);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Mettre à jour le statut d'un ticket (Avec validation BPM)
     */
    async updateTicketStatus(req, res) {
        try {
            const { status, weightIn, weightOut, notes, loadedProducts, zone, callZone, priority } = req.body;
            const ticket = await Ticket.findByPk(req.params.id);

            if (!ticket) {
                return res.status(404).json({ error: 'Ticket non trouvé.' });
            }

            // Définition des transitions autorisées (BPM Linéaire & Boucle)
            const ALLOWED_TRANSITIONS = {
                'EN_ATTENTE': ['PESÉ_ENTRÉE', 'ANNULÉ'],
                'PESÉ_ENTRÉE': ['EN_VENTE', 'ANNULÉ'],
                'EN_VENTE': ['APPELÉ', 'ANNULÉ'],
                'APPELÉ': ['EN_CHARGEMENT', 'ANNULÉ'],
                'EN_CHARGEMENT': ['CHARGEMENT_TERMINÉ', 'ANNULÉ'],
                // Loop: Can go back to EN_ATTENTE (next cat) or TERMINÉ / BL_GÉNÉRÉ (finished)
                'CHARGEMENT_TERMINÉ': ['TERMINÉ', 'BL_GÉNÉRÉ', 'EN_ATTENTE', 'ANNULÉ'],
                'BL_GÉNÉRÉ': ['TERMINÉ', 'PESÉ_SORTIE', 'ANNULÉ'],
                'PESÉ_SORTIE': ['TERMINÉ', 'ANNULÉ']
            };

            // Vérifier si la transition est autorisée
            if (status && status !== ticket.status) {
                const allowedNext = ALLOWED_TRANSITIONS[ticket.status] || [];
                if (!allowedNext.includes(status)) {
                    return res.status(400).json({
                        error: `Transition de statut non autorisée: ${ticket.status} -> ${status}.`,
                        message: `Le camion doit d'abord passer par l'étape suivante obligatoire.`
                    });
                }
            }

            const updates = {};
            if (status) updates.status = status;
            if (notes) updates.notes = notes;
            if (loadedProducts) updates.loadedProducts = loadedProducts;
            if (zone || callZone) updates.zone = zone || callZone;
            if (priority) updates.priority = priority;

            // Logique spécifique selon le statut
            if (status === 'PESÉ_ENTRÉE') {
                updates.weightIn = weightIn;
                updates.weighedInAt = new Date();
            } else if (status === 'PESÉ_SORTIE') {
                updates.weightOut = weightOut;
                updates.weighedOutAt = new Date();
                if (ticket.weightIn) {
                    updates.netWeight = Math.abs(weightOut - ticket.weightIn);
                }
            } else if (status === 'TERMINÉ') {
                updates.completedAt = new Date();
            } else if (status === 'APPELÉ') {
                updates.calledAt = new Date();
                updates.calledById = req.user?.id;
            } else if (status === 'EN_CHARGEMENT') {
                updates.loadingStartedAt = new Date();
            } else if (status === 'CHARGEMENT_TERMINÉ') {
                updates.loadingFinishedAt = new Date();
            } else if (status === 'EN_ATTENTE' && ticket.status === 'CHARGEMENT_TERMINÉ') {
                // BOUCLE MULTI-CATEGORIES
                // Passage à la catégorie suivante
                const nextIndex = ticket.currentCategoryIndex + 1;

                // Verification simple pour éviter l'overflow (bien que le frontend doive gérer)
                if (ticket.categories && nextIndex < ticket.categories.length) {
                    updates.currentCategoryIndex = nextIndex;
                    // Reset timestamps for new cycle if needed? Or keep history?
                    // For now, fast loop. 
                    // Peut-être besoin de reset 'calledAt', 'loadingStartedAt' etc pour la nouvelle phase?
                    // Oui, sinon les KPIs sont faussés.
                    updates.calledAt = null;
                    updates.loadingStartedAt = null;
                    updates.loadingFinishedAt = null;
                    // On garde arrivedAt et weighedInAt car c'est global.
                } else {
                    return res.status(400).json({
                        error: 'Impossible de passer à la catégorie suivante.',
                        message: 'Toutes les catégories ont été traitées ou index invalide.'
                    });
                }
            }

            // Audit Log for Priority Change
            if (priority && priority !== ticket.priority) {
                const AuditLog = (await import('../models/AuditLog.js')).default;
                await AuditLog.create({
                    entityId: ticket.id,
                    entityType: 'TICKET',
                    action: 'UPDATE_PRIORITY',
                    userId: req.user?.id,
                    details: {
                        oldPriority: ticket.priority,
                        newPriority: priority,
                        reason: req.body.priorityReason || 'No reason provided'
                    },
                    ipAddress: req.ip
                });
            }

            await ticket.update(updates);

            // Notification temps réel du changement de statut
            const io = req.app.get('io');
            if (io) {
                io.emit('ticket-status-updated', {
                    id: ticket.id,
                    ticketNumber: ticket.ticketNumber,
                    licensePlate: ticket.licensePlate,
                    status: status || ticket.status, // Ensure status is present even if only priority changed
                    priority: updates.priority || ticket.priority, // NEW
                    zone: updates.zone || ticket.zone
                });
            }

            res.status(200).json({
                message: 'Statut du ticket mis à jour.',
                ticket
            });
        } catch (error) {
            logger.error('Erreur mise à jour ticket:', error);
            res.status(500).json({ error: 'Erreur lors de la mise à jour du ticket.' });
        }
    }

    /**
     * Récupérer les statistiques globales (Dashboard)
     */
    async getStats(req, res) {
        try {
            const stats = await Ticket.findAll({
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
                    [sequelize.fn('SUM', sequelize.col('net_weight')), 'totalWeight']
                ],
                raw: true
            });

            const countsByStatus = await Ticket.findAll({
                attributes: [
                    'status',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                group: ['status'],
                raw: true
            });

            // Calcul du temps d'attente moyen (en minutes)
            const ticketsWithTiming = await Ticket.findAll({
                where: {
                    calledAt: { [Op.ne]: null },
                    arrivedAt: { [Op.ne]: null }
                },
                attributes: ['arrivedAt', 'calledAt'],
                limit: 100,
                raw: true
            });

            let totalWait = 0;
            ticketsWithTiming.forEach(t => {
                totalWait += (new Date(t.calledAt) - new Date(t.arrivedAt)) / 60000;
            });
            const avgWaitTime = ticketsWithTiming.length > 0 ? Math.round(totalWait / ticketsWithTiming.length) : 0;

            res.status(200).json({
                total: parseInt(stats[0].total) || 0,
                totalWeight: parseFloat(stats[0].totalWeight) || 0,
                avgWaitTime,
                counts: countsByStatus.reduce((acc, curr) => {
                    acc[curr.status] = parseInt(curr.count);
                    return acc;
                }, {})
            });
        } catch (error) {
            logger.error('Erreur stats:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des statistiques.' });
        }
    }

    /**
     * Transfer ticket to a different category queue
     */
    async transferTicket(req, res) {
        try {
            const { newCategory } = req.body;
            const ticket = await Ticket.findByPk(req.params.id);

            if (!ticket) {
                return res.status(404).json({ error: 'Ticket non trouvé.' });
            }

            // Validate new category
            const validCategories = ['BATIMENT', 'INFRA', 'ELECT'];
            if (!validCategories.includes(newCategory)) {
                return res.status(400).json({ error: 'Catégorie invalide.' });
            }

            // Store old ticket number for logging
            const oldTicketNumber = ticket.ticketNumber;

            // Generate new ticket number based on new category
            const newTicketNumber = await Ticket.generateTicketNumber([newCategory]);

            // Update ticket with new category and ticket number
            ticket.ticketNumber = newTicketNumber;
            ticket.categories = [newCategory];
            ticket.currentCategoryIndex = 0;

            // Set status to EN_ATTENTE so it goes back to the queue
            ticket.status = 'EN_ATTENTE';

            // Reset timestamps - keep only arrivedAt and weighedInAt
            ticket.loadingStartedAt = null;
            ticket.loadingFinishedAt = null;
            ticket.weighedOutAt = null;
            ticket.calledAt = null;
            ticket.weightIn = null;
            ticket.weightOut = null;
            ticket.netWeight = null;
            ticket.zone = null;
            ticket.callZone = null;

            await ticket.save();

            // Emit socket event
            const io = req.app.get('io');
            if (io) {
                io.emit('ticket-transferred', {
                    id: ticket.id,
                    oldTicketNumber,
                    newTicketNumber,
                    licensePlate: ticket.licensePlate,
                    newCategory,
                    status: 'EN_ATTENTE'
                });
            }

            logger.info(`Ticket ${oldTicketNumber} transféré vers ${newCategory} avec nouveau numéro ${newTicketNumber}`);
            res.status(200).json({
                message: 'Ticket transféré avec succès',
                ticket,
                oldTicketNumber,
                newTicketNumber
            });
        } catch (error) {
            logger.error('Erreur transfert ticket:', error);
            res.status(500).json({ error: 'Erreur lors du transfert du ticket.' });
        }
    }

    /**
     * Public endpoint for exit validation from Entry guard page
     */
    async validateExit(req, res) {
        try {
            const ticket = await Ticket.findByPk(req.params.id);

            if (!ticket) {
                return res.status(404).json({ error: 'Ticket non trouvé.' });
            }

            // Only allow exit validation for trucks that have completed weighing
            if (ticket.status !== 'PESÉ_SORTIE') {
                return res.status(400).json({
                    error: 'Ce camion n\'a pas encore terminé la pesée de sortie.'
                });
            }

            // Update status to TERMINÉ
            ticket.status = 'TERMINÉ';
            ticket.exitedAt = new Date();
            await ticket.save();

            // Emit socket event
            const io = req.app.get('io');
            if (io) {
                io.emit('ticket-exited', {
                    id: ticket.id,
                    ticketNumber: ticket.ticketNumber,
                    licensePlate: ticket.licensePlate,
                    status: 'TERMINÉ'
                });
            }

            logger.info(`Sortie validée pour le ticket ${ticket.ticketNumber}`);
            res.status(200).json({ message: 'Sortie validée avec succès', ticket });
        } catch (error) {
            logger.error('Erreur validation sortie:', error);
            res.status(500).json({ error: 'Erreur lors de la validation de sortie.' });
        }
    }

    /**
     * Pesée entrée (Tare)
     */
    async weighIn(req, res) {
        try {
            const { weight } = req.body;
            const ticket = await Ticket.findByPk(req.params.id);

            if (!ticket) {
                return res.status(404).json({ error: 'Ticket non trouvé.' });
            }

            if (!weight || isNaN(weight)) {
                return res.status(400).json({ error: 'Poids invalide.' });
            }

            // Update ticket
            ticket.weightIn = parseFloat(weight);
            ticket.weighedInAt = new Date();
            ticket.status = 'PESÉ_ENTRÉE';

            // Manual weighing flag
            ticket.isManualWeightIn = true;

            await ticket.save();

            // Emit socket event
            const io = req.app.get('io');
            if (io) {
                io.emit('ticket-status-updated', {
                    id: ticket.id,
                    ticketNumber: ticket.ticketNumber,
                    licensePlate: ticket.licensePlate,
                    status: 'PESÉ_ENTRÉE',
                    weightIn: ticket.weightIn
                });
            }

            logger.info(`Pesée entrée pour ${ticket.ticketNumber}: ${ticket.weightIn}kg`);
            res.status(200).json({ message: 'Pesée entrée enregistrée', ticket });

        } catch (error) {
            logger.error('Erreur pesée entrée:', error);
            res.status(500).json({ error: 'Erreur lors de l\'enregistrement de la pesée.' });
        }
    }

    /**
     * Pesée sortie (Poids Total en Charge)
     */
    async weighOut(req, res) {
        try {
            const { weight } = req.body;
            const ticket = await Ticket.findByPk(req.params.id);

            if (!ticket) {
                return res.status(404).json({ error: 'Ticket non trouvé.' });
            }

            if (!weight || isNaN(weight)) {
                return res.status(400).json({ error: 'Poids invalide.' });
            }

            const weightOut = parseFloat(weight);

            // Validation simple
            if (ticket.weightIn && weightOut < ticket.weightIn) {
                return res.status(400).json({
                    error: 'Poids de sortie inférieur au poids d\'entrée (Tare).',
                    details: `Tare: ${ticket.weightIn}kg, Poids saisi: ${weightOut}kg`
                });
            }

            // Update ticket
            ticket.weightOut = weightOut;
            ticket.weighedOutAt = new Date();
            ticket.status = 'PESÉ_SORTIE';
            ticket.isManualWeightOut = true;

            // Calculate Net Weight
            if (ticket.weightIn) {
                ticket.netWeight = ticket.weightOut - ticket.weightIn;
            }

            await ticket.save();

            // Emit socket event
            const io = req.app.get('io');
            if (io) {
                io.emit('ticket-status-updated', {
                    id: ticket.id,
                    ticketNumber: ticket.ticketNumber,
                    licensePlate: ticket.licensePlate,
                    status: 'PESÉ_SORTIE',
                    weightOut: ticket.weightOut,
                    netWeight: ticket.netWeight
                });
            }

            logger.info(`Pesée sortie pour ${ticket.ticketNumber}: ${ticket.weightOut}kg (Net: ${ticket.netWeight}kg)`);
            res.status(200).json({ message: 'Pesée sortie enregistrée', ticket });

        } catch (error) {
            logger.error('Erreur pesée sortie:', error);
            res.status(500).json({ error: 'Erreur lors de l\'enregistrement de la pesée.' });
        }
    }

    /**
     * Valide une commande Sage X3
     */
    async validateOrder(req, res) {
        try {
            const { orderNumber } = req.params;
            const result = await sageService.validateOrder(orderNumber);
            res.json(result);
        } catch (error) {
            logger.error('Erreur validation commande:', error);
            res.status(500).json({ error: 'Erreur lors de la validation de la commande.' });
        }
    }
}

export default new TicketController();
