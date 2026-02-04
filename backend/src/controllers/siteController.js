import { Site, Company, AuditLog } from '../models/index.js';
import logger from '../config/logger.js';
import authMiddleware from '../middlewares/auth.middleware.js';

class SiteController {
    async getAll(req, res) {
        try {
            const where = {};
            // Scope check: If managed, only return allowed sites
            if (req.user.role === 'MANAGER') {
                // Return all sites of the manager's company
                if (req.user.site?.companyId) { // Ensure user.site is loaded
                    // Need to find sites where companyId = user's companyId
                    where.companyId = req.user.site.companyId;
                } else if (req.user.siteId) {
                    // Fallback if no company link, restrict to own site
                    where.id = req.user.siteId;
                }
            } else if (['SUPERVISOR', 'AGENT_QUAI'].includes(req.user.role)) {
                where.id = req.user.siteId;
            }

            const sites = await Site.findAll({
                where,
                include: [{ model: Company, as: 'company', attributes: ['name'] }],
                order: [['name', 'ASC']]
            });
            res.json(sites);
        } catch (error) {
            logger.error('Erreur getAll Sites:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des sites.' });
        }
    }

    async create(req, res) {
        try {
            // Only Admin can create sites
            if (req.user.role !== 'ADMINISTRATOR') return res.status(403).json({ error: 'Accès interdit.' });

            const site = await Site.create(req.body);

            // Audit
            await AuditLog.create({
                userId: req.user.id,
                action: 'CREATE_SITE',
                entityId: site.id,
                entityType: 'SITE',
                details: { name: site.name, code: site.code }
            });

            res.status(201).json(site);
        } catch (error) {
            logger.error('Erreur create Site:', error);
            res.status(500).json({ error: 'Erreur lors de la création du site.' });
        }
    }

    async update(req, res) {
        try {
            // Admin or Manager of that site/company
            if (!authMiddleware.checkScope(req.user, req.params.id)) {
                // If checking by Site ID fails, check if Manager owns the Company of this Site?
                // checkScope logic for Manager (targetSiteId) returns user.siteId === targetSiteId
                // BUT Manager should manage ALL sites of their company ideally.
                // For now, let's rely on checkScope which enforces: Manager -> Own Site.
                // If we want Manager -> Any Site of Company, we need to fetch Site first to get its companyId.
                const targetSite = await Site.findByPk(req.params.id);
                if (targetSite && req.user.role === 'MANAGER' && req.user.site?.companyId === targetSite.companyId) {
                    // Allowed
                } else if (!authMiddleware.checkScope(req.user, req.params.id)) {
                    return res.status(403).json({ error: 'Accès interdit.' });
                }
            }

            const site = await Site.findByPk(req.params.id);
            if (!site) return res.status(404).json({ error: 'Site non trouvé.' });

            await site.update(req.body);

            // Audit
            await AuditLog.create({
                userId: req.user.id,
                action: 'UPDATE_SITE',
                entityId: site.id,
                entityType: 'SITE',
                details: req.body
            });

            res.json(site);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async delete(req, res) {
        try {
            if (req.user.role !== 'ADMINISTRATOR') return res.status(403).json({ error: 'Accès interdit.' });

            const site = await Site.findByPk(req.params.id);
            if (!site) return res.status(404).json({ error: 'Site non trouvé.' });

            await site.destroy();

            // Audit
            await AuditLog.create({
                userId: req.user.id,
                action: 'DELETE_SITE',
                entityId: req.params.id,
                entityType: 'SITE',
                details: { name: site.name }
            });

            res.json({ message: 'Site supprimé.' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

export default new SiteController();
