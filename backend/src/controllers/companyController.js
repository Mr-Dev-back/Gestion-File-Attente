import { Company, AuditLog } from '../models/index.js';
import logger from '../config/logger.js';
import authMiddleware from '../middlewares/auth.middleware.js';

class CompanyController {
    async getAll(req, res) {
        try {
            // RBAC Scope Check
            // Manager can only see their own company
            if (req.user.role === 'MANAGER' && !authMiddleware.checkScope(req.user, null, req.user.site?.companyId)) {
                // If manager tries to list companies, maybe only return their own?
                // For now, let's filter the query
                const where = {};
                if (req.user.role === 'MANAGER') {
                    where.id = req.user.site?.companyId;
                }
                const companies = await Company.findAll({ where, order: [['name', 'ASC']] });
                return res.json(companies);
            }

            // Supervisors/Agents shouldn't list companies usually, but if allowed, filter similarly
            // Admin sees all
            const companies = await Company.findAll({ order: [['name', 'ASC']] });
            res.json(companies);
        } catch (error) {
            logger.error('Erreur getAll Companies:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des sociétés.' });
        }
    }

    async create(req, res) {
        try {
            // Only Admin can create companies
            if (req.user.role !== 'ADMINISTRATOR') return res.status(403).json({ error: 'Accès interdit.' });

            const company = await Company.create(req.body);

            // Audit
            await AuditLog.create({
                userId: req.user.id,
                action: 'CREATE_COMPANY',
                entityId: company.id,
                entityType: 'COMPANY',
                details: { name: company.name, code: company.code }
            });

            res.status(201).json(company);
        } catch (error) {
            logger.error('Erreur create Company:', error);
            res.status(500).json({ error: 'Erreur lors de la création de la société.' });
        }
    }

    async update(req, res) {
        try {
            // Only Admin can update companies (usually) or Manager updates their own
            if (!authMiddleware.checkScope(req.user, null, req.params.id)) {
                return res.status(403).json({ error: 'Accès interdit.' });
            }

            const company = await Company.findByPk(req.params.id);
            if (!company) return res.status(404).json({ error: 'Société non trouvée.' });

            await company.update(req.body);

            // Audit
            await AuditLog.create({
                userId: req.user.id,
                action: 'UPDATE_COMPANY',
                entityId: company.id,
                entityType: 'COMPANY',
                details: req.body
            });

            res.json(company);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async delete(req, res) {
        try {
            if (req.user.role !== 'ADMINISTRATOR') return res.status(403).json({ error: 'Accès interdit.' });

            const company = await Company.findByPk(req.params.id);
            if (!company) return res.status(404).json({ error: 'Société non trouvée.' });

            await company.destroy();

            // Audit
            await AuditLog.create({
                userId: req.user.id,
                action: 'DELETE_COMPANY',
                entityId: req.params.id,
                entityType: 'COMPANY',
                details: { name: company.name }
            });

            res.json({ message: 'Société supprimée.' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

export default new CompanyController();
