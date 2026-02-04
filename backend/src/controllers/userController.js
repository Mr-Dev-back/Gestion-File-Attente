import { User, Site, Company, LoginHistory } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';

class UserController {
    /**
     * Créer un nouvel utilisateur
     */
    async createUser(req, res) {
        try {
            const { username, email, password, role } = req.body;

            // 1. Check for existing email OR username
            const existingUser = await User.findOne({
                where: {
                    [Op.or]: [{ email }, { username }]
                }
            });

            if (existingUser) {
                const conflict = existingUser.email === email ? 'Cet email' : 'Ce nom d\'utilisateur';
                return res.status(400).json({ error: `${conflict} est déjà utilisé.` });
            }

            const user = await User.create({
                username,
                email,
                password,
                role,
                siteId: req.body.siteId || null
            });

            res.status(201).json({
                message: 'Utilisateur créé avec succès.',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            logger.error('Erreur creation utilisateur:', error);
            res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur.' });
        }
    }

    /**
     * Récupérer tous les utilisateurs
     */
    async getAllUsers(req, res) {
        try {
            const users = await User.findAll({
                attributes: { exclude: ['password'] },
                include: [{
                    model: Site,
                    as: 'site',
                    attributes: ['id', 'name'],
                    include: [{
                        model: Company,
                        as: 'company',
                        attributes: ['id', 'name']
                    }]
                }],
                order: [['createdAt', 'DESC']]
            });
            res.status(200).json(users);
        } catch (error) {
            logger.error('Erreur récupération utilisateurs:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs.' });
        }
    }

    /**
     * Récupérer un utilisateur par ID
     */
    async getUserById(req, res) {
        try {
            const user = await User.findByPk(req.params.id, {
                attributes: { exclude: ['password'] }
            });
            if (!user) {
                return res.status(404).json({ error: 'Utilisateur non trouvé.' });
            }
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Mettre à jour un utilisateur
     */
    async updateUser(req, res) {
        try {
            const { username, email, role, isActive, password, siteId } = req.body;
            const user = await User.findByPk(req.params.id);

            if (!user) {
                return res.status(404).json({ error: 'Utilisateur non trouvé.' });
            }

            // check for conflicts if email or username changed
            if ((email && email !== user.email) || (username && username !== user.username)) {
                const conflictWhere = [];
                if (email && email !== user.email) conflictWhere.push({ email });
                if (username && username !== user.username) conflictWhere.push({ username });

                const existingUser = await User.findOne({
                    where: {
                        [Op.or]: conflictWhere,
                        id: { [Op.ne]: user.id }
                    }
                });

                if (existingUser) {
                    const conflict = existingUser.email === email ? 'Cet email' : 'Ce nom d\'utilisateur';
                    return res.status(400).json({ error: `${conflict} est déjà utilisé.` });
                }
            }

            const updates = {};
            if (username) updates.username = username;
            if (email) updates.email = email;
            if (role) updates.role = role;
            if (isActive !== undefined) updates.isActive = isActive;
            if (role) updates.role = role;
            if (isActive !== undefined) updates.isActive = isActive;
            if (password) updates.password = password; // Le hook beforeUpdate gérera le hashage
            if (siteId !== undefined) updates.siteId = siteId || null;

            await user.update(updates);

            res.status(200).json({
                message: 'Utilisateur mis à jour avec succès.',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive
                }
            });
        } catch (error) {
            logger.error('Erreur mise à jour utilisateur:', error);
            res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'utilisateur.' });
        }
    }

    /**
     * Supprimer un utilisateur (Désactivation logique ou suppression réelle)
     */
    async deleteUser(req, res) {
        try {
            const user = await User.findByPk(req.params.id);
            if (!user) {
                return res.status(404).json({ error: 'Utilisateur non trouvé.' });
            }

            // Pour la traçabilité, on peut préférer désactiver
            // Mais ici on fait une suppression réelle si demandé
            await user.destroy();
            res.status(200).json({ message: 'Utilisateur supprimé avec succès.' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Récupérer l'historique de connexion d'un utilisateur
     */
    async getLoginHistory(req, res) {
        try {
            const { id } = req.params;
            const history = await LoginHistory.findAll({
                where: { userId: id },
                order: [['createdAt', 'DESC']],
                limit: 20
            });
            res.status(200).json(history);
        } catch (error) {
            logger.error('Erreur récupération historique:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique.' });
        }
    }

    /**
     * Débloquer un utilisateur
     */
    async unlockUser(req, res) {
        try {
            const { id } = req.params;
            const user = await User.findByPk(id);

            if (!user) {
                return res.status(404).json({ error: 'Utilisateur non trouvé.' });
            }

            await user.update({
                failedLoginAttempts: 0,
                lockUntil: null
            });

            res.status(200).json({ message: 'Utilisateur débloqué avec succès.' });
        } catch (error) {
            logger.error('Erreur déblocage utilisateur:', error);
            res.status(500).json({ error: 'Erreur lors du déblocage de l\'utilisateur.' });
        }
    }

    /**
     * Récupérer les sessions actives (Refresh Tokens) d'un utilisateur
     */
    async getUserSessions(req, res) {
        try {
            const { id } = req.params;
            const sessions = await RefreshToken.findAll({
                where: {
                    userId: id,
                    revoked: false,
                    expiresAt: { [Op.gt]: new Date() }
                },
                order: [['createdAt', 'DESC']]
            });
            res.status(200).json(sessions);
        } catch (error) {
            logger.error('Erreur récupération sessions:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des sessions actives.' });
        }
    }

    /**
     * Révoquer une session spécifique
     */
    async revokeSession(req, res) {
        try {
            const { sessionId } = req.params;
            const session = await RefreshToken.findByPk(sessionId);

            if (!session) {
                return res.status(404).json({ error: 'Session non trouvée.' });
            }

            await session.update({ revoked: true });
            res.status(200).json({ message: 'Session révoquée avec succès.' });
        } catch (error) {
            logger.error('Erreur révocation session:', error);
            res.status(500).json({ error: 'Erreur lors de la révocation de la session.' });
        }
    }
}

export default new UserController();
