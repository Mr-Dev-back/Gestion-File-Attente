import { Ticket, User, Site, Company, Category, AuditLog, Queue } from '../models/index.js';
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
                salesPerson,
                orderNumber,
                categories, // Array of category IDs or objects
                priority,
                priorityReason,
                notes
            } = req.body;

            // 1. Récupérer l'agent et son site
            let agent = null;
            let site = null;

            if (req.user?.id) {
                agent = await User.findByPk(req.user.id, {
                    include: [{ model: Site, as: 'site' }]
                });
                if (agent && agent.site) {
                    site = agent.site;
                } else {
                    return res.status(403).json({ error: 'Agent non associé à un site valide.' });
                }
            } else {
                // Anonymous mode (Public Kiosk)
                // Default to the first active site or a specific one if configured
                site = await Site.findOne({ where: { isActive: true } });
                logger.info('Ticket creation: Anonymous mode (Kiosk)');
            }

            if (!site) {
                return res.status(500).json({ error: 'Aucun site actif trouvé pour le mode public.' });
            }

            // 2. Intégration Sage X3 (Refined)
            let finalClientName = companyName;
            let finalSalesPerson = salesPerson;
            let finalCategoryIds = categories ? categories.map(c => typeof c === 'string' ? c : c.id) : [];

            if (orderNumber) {
                const sageData = await sageService.validateOrder(orderNumber);
                if (sageData.exists) {
                    finalClientName = sageData.customerName || finalClientName;
                    finalSalesPerson = sageData.commercialName || finalSalesPerson;

                    // Si aucune catégorie n'est fournie, on utilise celles de Sage
                    if (finalCategoryIds.length === 0 && sageData.suggestedCategories?.length > 0) {
                        const suggestedCategories = await Category.findAll({
                            where: { prefix: { [Op.in]: sageData.suggestedCategories } }
                        });
                        if (suggestedCategories.length > 0) {
                            finalCategoryIds = suggestedCategories.map(c => c.id);
                        }
                    }

                    if (sageData.paymentStatus === 'UNPAID') {
                        logger.warn(`Ticket créé pour commande non payée : ${orderNumber}`);
                    }
                }
            }

            // 3. Validation finale des données
            if (!licensePlate || !driverName || finalCategoryIds.length === 0) {
                return res.status(400).json({
                    error: 'Données manquantes',
                    message: 'L\'immatriculation, le chauffeur et au moins une catégorie sont requis.'
                });
            }

            // 4. Charger et valider les catégories
            const fullCategories = await Category.findAll({
                where: { id: { [Op.in]: finalCategoryIds } }
            });

            if (fullCategories.length !== finalCategoryIds.length) {
                return res.status(400).json({ error: 'Une ou plusieurs catégories sont invalides.' });
            }

            const inactiveCat = fullCategories.find(c => !c.isActive);
            if (inactiveCat) {
                return res.status(400).json({ error: `La catégorie ${inactiveCat.name} est actuellement inactive.` });
            }

            // 5. Génération du numéro de ticket structuré
            const siteCode = site.code || 'GFA';
            const catPrefix = fullCategories[0]?.prefix || 'TP';
            const ticketPrefix = `TK${siteCode}${catPrefix}`;

            const ticketNumber = await Ticket.generateTicketNumber([{ code: ticketPrefix }]);
            const qrCodeData = await QRCode.toDataURL(ticketNumber);

            // 6. Créer le ticket
            const ticket = await Ticket.create({
                ticketNumber,
                qrCode: qrCodeData,
                licensePlate: licensePlate.toUpperCase(),
                driverName,
                driverPhone,
                companyName: finalClientName,
                salesPerson: finalSalesPerson,
                orderNumber,
                categories: fullCategories.map(c => c.prefix),
                priority: priority || 'NORMAL',
                priorityReason,
                notes,
                createdById: req.user?.id,
                siteId: site.id,
                companyId: site.companyId,
                status: 'EN_ATTENTE',
                arrivedAt: new Date()
            });

            // 7. Audit & Socket
            await AuditLog.create({
                userId: req.user?.id,
                action: 'TICKET_CREATED',
                entityId: ticket.id,
                entityType: 'TICKET',
                details: { ticketNumber: ticket.ticketNumber, licensePlate: ticket.licensePlate, orderNumber: ticket.orderNumber },
                ipAddress: req.ip
            });

            const io = req.app.get('io');
            if (io) {
                io.emit('new-ticket', {
                    id: ticket.id,
                    ticketNumber: ticket.ticketNumber,
                    licensePlate: ticket.licensePlate,
                    status: ticket.status,
                    siteId: ticket.siteId
                });
                io.emit('queue-updated', { siteId: ticket.siteId });
            }

            res.status(201).json({ message: 'Ticket créé avec succès.', ticket });

        } catch (error) {
            logger.error('Erreur lors de la création du ticket:', error);
            res.status(500).json({ error: 'Erreur interne lors de la création du ticket.' });
        }
    }  /**
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
     * Récupérer un ticket par son numéro (pour scan QR)
     */
    async getTicketByNumber(req, res) {
        try {
            const ticket = await Ticket.findOne({
                where: { ticketNumber: req.params.ticketNumber },
                include: [
                    { model: Site, as: 'site' },
                    { model: Company, as: 'company' }
                ]
            });

            if (!ticket) {
                return res.status(404).json({ error: 'Ticket non trouvé.' });
            }

            res.status(200).json(ticket);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Journaliser une impression / réimpression de ticket
     */
    async logPrint(req, res) {
        try {
            const ticket = await Ticket.findByPk(req.params.id);
            if (!ticket) return res.status(404).json({ error: 'Ticket non trouvé' });

            await ticket.increment('printedCount');
            await ticket.reload();

            await AuditLog.create({
                userId: req.user?.id,
                action: ticket.printedCount > 1 ? 'TICKET_REPRINTED' : 'TICKET_PRINTED',
                entityId: ticket.id,
                entityType: 'TICKET',
                details: {
                    ticketNumber: ticket.ticketNumber,
                    printCount: ticket.printedCount
                },
                ipAddress: req.ip
            });

            res.status(200).json({ message: 'Impression journalisée', printedCount: ticket.printedCount });
        } catch (error) {
            logger.error('Erreur journalisation impression:', error);
            res.status(500).json({ error: 'Erreur interne' });
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

            // US-015: Justification obligatoire pour la priorité CRITIQUE
            if (priority === 'CRITIQUE' && !req.body.priorityReason) {
                return res.status(400).json({
                    error: 'Justification requise',
                    message: 'Une justification est obligatoire pour passer un ticket en priorité CRITIQUE.'
                });
            }

            const updates = {};
            if (status) updates.status = status;
            if (notes) updates.notes = notes;
            if (loadedProducts) updates.loadedProducts = loadedProducts;
            if (zone || callZone) updates.zone = zone || callZone;
            if (priority) {
                updates.priority = priority;
                updates.priorityReason = req.body.priorityReason;
            }

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
                const payload = {
                    id: ticket.id,
                    ticketNumber: ticket.ticketNumber,
                    licensePlate: ticket.licensePlate,
                    status: status || ticket.status,
                    priority: updates.priority || ticket.priority,
                    zone: updates.zone || ticket.zone
                };
                io.emit('ticket-status-updated', payload);

                // Si le statut ou la priorité change, on notifie une mise à jour de file
                if (status || priority) {
                    io.emit('queue-updated', { siteId: ticket.siteId });
                    if (ticket.siteId) {
                        io.to(`site_${ticket.siteId}`).emit('queue-updated', { siteId: ticket.siteId });
                    }
                }
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
     * US-014: Récupérer l'état des files d'attente agrégé par catégorie
     */
    async getQueueStatus(req, res) {
        try {
            const { siteId } = req.query;
            const where = {
                status: { [Op.in]: ['EN_ATTENTE', 'APPELÉ', 'EN_COURS'] }
            };
            if (siteId) where.siteId = siteId;

            const tickets = await Ticket.findAll({
                where,
                order: [
                    [sequelize.literal("CASE WHEN priority = 'CRITIQUE' THEN 1 WHEN priority = 'URGENT' THEN 2 ELSE 3 END"), 'ASC'],
                    ['arrivedAt', 'ASC']
                ]
            });

            const categories = await Category.findAll();
            const catMap = categories.reduce((acc, cat) => {
                acc[cat.prefix] = cat;
                return acc;
            }, {});

            const queueData = {};

            tickets.forEach(ticket => {
                const currentCatPrefix = ticket.categories[ticket.currentCategoryIndex] || (ticket.categories.length > 0 ? ticket.categories[0] : 'BAT');

                if (!queueData[currentCatPrefix]) {
                    queueData[currentCatPrefix] = {
                        category: catMap[currentCatPrefix] || { name: currentCatPrefix, prefix: currentCatPrefix },
                        tickets: [],
                        count: 0
                    };
                }

                const catTickets = queueData[currentCatPrefix].tickets;
                const position = catTickets.length + 1;
                const estimatedWait = (position - 1) * (catMap[currentCatPrefix]?.estimatedDuration || 30);

                catTickets.push({
                    id: ticket.id,
                    ticketNumber: ticket.ticketNumber,
                    licensePlate: ticket.licensePlate,
                    driverName: ticket.driverName,
                    status: ticket.status,
                    priority: ticket.priority,
                    arrivedAt: ticket.arrivedAt,
                    position,
                    estimatedWait
                });
                queueData[currentCatPrefix].count++;
            });

            res.status(200).json(queueData);
        } catch (error) {
            logger.error('Erreur getQueueStatus:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des files.' });
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
