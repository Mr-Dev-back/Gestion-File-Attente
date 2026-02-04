import jwt from 'jsonwebtoken';
import { User, Site } from '../models/index.js';

class AuthMiddleware {
    // Middleware d'authentification (Vérification JWT)
    async authenticate(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            let token = null;

            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            } else if (req.cookies && req.cookies.accessToken) {
                token = req.cookies.accessToken;
            }

            if (!token) {
                return res.status(401).json({ error: 'Accès non autorisé. Token manquant.' });
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_jwt_tres_long_et_aleatoire_12345');

            const user = await User.findByPk(decoded.id, {
                include: [{
                    model: Site, // We need to import Site
                    as: 'site',
                    include: ['company'] // We need deep include for Company check
                }]
            });
            if (!user) {
                return res.status(401).json({ error: 'Utilisateur non trouvé.' });
            }

            if (!user.isActive) {
                return res.status(403).json({ error: 'Compte désactivé.' });
            }

            req.user = user;
            next();
        } catch (error) {
            console.error('AUTHENTICATION ERROR:', error);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Session expirée. Veuillez vous reconnecter.' });
            }
            return res.status(401).json({ error: 'Token invalide.' });
        }
    }

    // Middleware d'autorisation (RBAC)
    // Middleware d'autorisation (RBAC)
    authorize(allowedRoles) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ error: 'Utilisateur non authentifié.' });
            }

            const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

            // Hierarchical Logic: Admin and Supervisor usually have access to everything below them
            // But strict RBAC requested: "Admin doesn't do business actions"

            // Check if user's role is strictly in the allowed list
            if (!roles.includes(req.user.role)) {
                // Exceptional Hierarchical Overrides
                // Example: Supervisor can do what Manager does (Override logic)
                if (allowedRoles.includes('MANAGER') && req.user.role === 'SUPERVISOR') {
                    // Pass through for Supervisor overriding Manager actions if verified elsewhere
                    return next();
                }

                return res.status(403).json({
                    error: 'Accès refusé. Privilèges insuffisants.',
                    required: roles,
                    current: req.user.role
                });
            }

            next();
        };
    }
    /**
     * @returns { boolean }
     */
    checkScope(user, targetSiteId = null, targetCompanyId = null) {
        // 1. ADMINISTRATOR has global access
        if (user.role === 'ADMINISTRATOR') return true;

        // 2. MANAGER: Restricted to their Company (and all sites within)
        if (user.role === 'MANAGER') {
            // If target is a Company
            if (targetCompanyId) {
                return user.site?.companyId === targetCompanyId;
            }

            // If target is a Site
            if (targetSiteId) {
                // Assuming Manager is bound to a single Site for now, or check company match if Site model loaded
                return user.siteId === targetSiteId;
            }
        }

        // 3. SUPERVISOR / AGENT: Strictly their Site
        if (['SUPERVISOR', 'AGENT_QUAI'].includes(user.role)) {
            if (targetSiteId) {
                return user.siteId === targetSiteId;
            }
            // They shouldn't be accessing Company endpoints directly usually
            if (targetCompanyId) return false;
        }

        return false;
    }
}

export default new AuthMiddleware();
