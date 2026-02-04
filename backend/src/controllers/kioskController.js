import { Kiosk, KioskActivity, Site, Queue } from '../models/index.js';
import AuthMiddleware from '../middlewares/auth.middleware.js';

export const getAllKiosks = async (req, res) => {
    try {
        const { siteId } = req.query;
        // Scope check
        if (!AuthMiddleware.checkScope(req.user, siteId, null)) {
            return res.status(403).json({ error: 'Accès refusé au périmètre demandé.' });
        }

        const where = {};
        if (siteId) where.siteId = siteId;

        const kiosks = await Kiosk.findAll({
            where,
            include: [
                { model: Site, as: 'site', attributes: ['name', 'id'] },
                { model: Queue, as: 'queue', attributes: ['name', 'id'] }
            ],
            order: [['name', 'ASC']]
        });
        res.json(kiosks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createKiosk = async (req, res) => {
    try {
        const { siteId } = req.body;
        // Scope check
        if (!AuthMiddleware.checkScope(req.user, siteId, null)) {
            return res.status(403).json({ error: 'Accès refusé au périmètre demandé.' });
        }

        const kiosk = await Kiosk.create(req.body);

        // Log activity
        await KioskActivity.create({
            kioskId: kiosk.id,
            event: 'CREATED',
            description: `Borne créée par ${req.user.username}`,
            severity: 'INFO'
        });

        res.status(201).json(kiosk);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateKiosk = async (req, res) => {
    try {
        const { id } = req.params;
        const kiosk = await Kiosk.findByPk(id);
        if (!kiosk) return res.status(404).json({ error: 'Borne non trouvée' });

        // Scope check
        if (!AuthMiddleware.checkScope(req.user, kiosk.siteId, null)) {
            return res.status(403).json({ error: 'Accès refusé.' });
        }

        const oldStatus = kiosk.status;
        await kiosk.update(req.body);

        // Log status change if happened
        if (req.body.status && req.body.status !== oldStatus) {
            await KioskActivity.create({
                kioskId: kiosk.id,
                event: 'STATUS_CHANGE',
                description: `Statut changé de ${oldStatus} à ${req.body.status} par ${req.user.username}`,
                severity: 'INFO'
            });

            // Emit socket event
            const io = req.app.get('io');
            io.emit('kiosk-update', { id: kiosk.id, status: kiosk.status });
        }

        res.json(kiosk);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteKiosk = async (req, res) => {
    try {
        const { id } = req.params;
        const kiosk = await Kiosk.findByPk(id);
        if (!kiosk) return res.status(404).json({ error: 'Borne non trouvée' });

        // Scope check
        if (!AuthMiddleware.checkScope(req.user, kiosk.siteId, null)) {
            return res.status(403).json({ error: 'Accès refusé.' });
        }

        await kiosk.destroy();
        res.json({ message: 'Borne supprimée' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getKioskHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const kiosk = await Kiosk.findByPk(id);
        if (!kiosk) return res.status(404).json({ error: 'Borne non trouvée' });

        // Scope check
        if (!AuthMiddleware.checkScope(req.user, kiosk.siteId, null)) {
            return res.status(403).json({ error: 'Accès refusé.' });
        }

        const history = await KioskActivity.findAll({
            where: { kioskId: id },
            order: [['createdAt', 'DESC']],
            limit: 50
        });

        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
