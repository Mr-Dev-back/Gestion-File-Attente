import express from 'express';
import ticketController from '../controllers/ticketController.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Gestion des tickets de file d'attente
 */

// Don't protect validate-order if it needs to be public for kiosks (optional)
// But createTicket AND queue-status definitely need it.

/**
 * @swagger
 * /api/tickets:
 *   post:
 *     summary: Créer un nouveau ticket (Enregistrement chauffeur)
 *     tags: [Tickets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               licensePlate:
 *                 type: string
 *               driverName:
 *                 type: string
 *               driverPhone:
 *                 type: string
 *               orderNumber:
 *                 type: string
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *               priority:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ticket créé
 *   get:
 *     summary: Récupérer tous les tickets
 *     tags: [Tickets]
 *     responses:
 *       200:
 *         description: Liste des tickets
 */

/**
 * @swagger
 * /api/tickets/validate-order/{orderNumber}:
 *   get:
 *     summary: Valider une commande Sage X3
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Résultat de la validation
 */
router.get('/validate-order/:orderNumber', ticketController.validateOrder);

router.post('/', ticketController.createTicket);
router.get('/', ticketController.getAllTickets);

// All other routes require authentication
router.use(authMiddleware.authenticate);

/**
 * @swagger
 * /api/tickets/queue-status:
 *   get:
 *     summary: Récupérer l'état des files d'attente par catégorie
 *     tags: [Tickets]
 *     parameters:
 *       - in: query
 *         name: siteId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: État des files d'attente
 */
router.get('/queue-status', ticketController.getQueueStatus);

/**
 * @swagger
 * /api/tickets/stats:
 *   get:
 *     summary: Récupérer les statistiques des tickets
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques
 */
router.get('/stats', ticketController.getStats);

/**
 * @swagger
 * /api/tickets/{id}:
 *   get:
 *     summary: Récupérer un ticket par son ID
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Détails du ticket
 */
router.get('/:id', ticketController.getTicketById);

// Impression & Scan (Accessibles par la guérite sans session complète si nécessaire,
// ou protégés par le fait qu'ils nécessitent un ID/numéro valide connu de l'agent)
router.get('/scan/:ticketNumber', ticketController.getTicketByNumber);

// Operations with specific authorization
/**
 * @swagger
 * /api/tickets/{id}/status:
 *   put:
 *     summary: Mettre à jour le statut d'un ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Statut mis à jour
 */
router.put('/:id/status', authMiddleware.hasPermission('ticket:status'), ticketController.updateTicketStatus);

/**
 * @swagger
 * /api/tickets/{id}/transfer:
 *   put:
 *     summary: Transférer un ticket vers une autre catégorie
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newCategory:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ticket transféré
 */
// Transfert
router.put('/:id/transfer', authMiddleware.hasPermission('queue:manage'), ticketController.transferTicket);

// Pesée
router.post('/:id/weigh-in', authMiddleware.hasPermission('ticket:status'), ticketController.weighIn);
router.post('/:id/weigh-out', authMiddleware.hasPermission('ticket:status'), ticketController.weighOut);

/**
 * @swagger
 * /api/tickets/{id}/validate-exit:
 *   put:
 *     summary: Valider la sortie d'un camion
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sortie validée
 */
router.put('/:id/validate-exit', ticketController.validateExit);
router.post('/:id/log-print', ticketController.logPrint);


export default router;
