import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import { User, LoginHistory, RefreshToken, Role, Permission } from '../models/index.js';
import emailService from '../services/emailService.js';

class AuthController {

    async register(req, res) {
        // ... (unchanged)
        try {
            const { username, email, password, role } = req.body;
            // ... (keep original logic)
            // Vérifier si l'utilisateur existe déjà
            const existingUser = await User.findOne({
                where: { email }
            });

            if (existingUser) {
                return res.status(400).json({ error: 'Cet email est déjà utilisé.' });
            }

            const user = await User.create({
                username,
                email,
                password,
                role: role || 'AGENT_QUAI'
            });

            const userWithoutPassword = user.toJSON();
            delete userWithoutPassword.password;

            res.status(201).json({
                message: 'Utilisateur créé avec succès.',
                user: userWithoutPassword
            });

        } catch (error) {
            console.error('Erreur inscription:', error);
            res.status(500).json({ error: 'Erreur lors de la création du compte.' });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.headers['user-agent'] || 'Unknown';

            // Chercher l'utilisateur
            const user = await User.findOne({
                where: {
                    [Op.or]: [
                        sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), email?.toLowerCase() || ''),
                        sequelize.where(sequelize.fn('LOWER', sequelize.col('username')), email?.toLowerCase() || '')
                    ]
                },
                include: [{
                    model: Role,
                    as: 'assignedRole',
                    include: [{ model: Permission, as: 'permissions' }]
                }]
            });

            if (!user) {
                return res.status(404).json({ error: 'Utilisateur inexistant', field: 'email' });
            }

            if (user.lockUntil && user.lockUntil > new Date()) {
                const waitTime = Math.ceil((user.lockUntil - new Date()) / 60000);
                await LoginHistory.create({ userId: user.id, ipAddress, userAgent, status: 'FAILED' });
                return res.status(403).json({
                    error: `Compte temporairement bloqué. Réessayez dans ${waitTime} minutes.`,
                    code: 'ACCOUNT_LOCKED',
                    lockUntil: user.lockUntil
                });
            }

            const isValid = await user.validatePassword(password);
            if (!isValid) {
                const attempts = (user.failedLoginAttempts || 0) + 1;
                let lockUntil = null;
                if (attempts >= 5) lockUntil = new Date(Date.now() + 15 * 60 * 1000);

                await user.update({ failedLoginAttempts: attempts, lockUntil });
                await LoginHistory.create({ userId: user.id, ipAddress, userAgent, status: 'FAILED' });

                if (attempts >= 5) return res.status(403).json({
                    error: 'Compte bloqué suite à trop de tentatives. Réessayez dans 15min.',
                    code: 'ACCOUNT_LOCKED',
                    lockUntil
                });
                return res.status(401).json({
                    error: `Mot de passe incorrect. (${attempts}/5)`,
                    field: 'password',
                    attemptsRemaining: 5 - attempts
                });
            }

            if (!user.isActive) return res.status(403).json({
                error: 'Votre compte est suspendu ou désactivé.',
                code: 'ACCOUNT_DISABLED'
            });

            // Reset failures
            await user.update({ failedLoginAttempts: 0, lockUntil: null, lastLoginAt: new Date() });
            await LoginHistory.create({ userId: user.id, ipAddress, userAgent, status: 'SUCCESS' });

            // --- JWT GENERATION ---
            const accessToken = jwt.sign(
                { id: user.id, role: user.role },
                process.env.JWT_SECRET || 'votre_secret_jwt_tres_long_et_aleatoire_12345',
                { expiresIn: '15m' } // Short lived
            );

            // Create Refresh Token
            const refreshToken = crypto.randomBytes(40).toString('hex');
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

            await RefreshToken.create({
                token: refreshToken,
                userId: user.id,
                expiresAt,
                ipAddress // Optional tracking
            });

            // Set Cookies
            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 15 * 60 * 1000 // 15 mins
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            const permissionCodes = user.assignedRole?.permissions?.map(p => p.code) || [];

            res.status(200).json({
                message: 'Connexion réussie.',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    permissions: permissionCodes
                }
            });

        } catch (error) {
            console.error('Erreur login:', error);
            res.status(500).json({ error: 'Erreur serveur lors de la connexion.' });
        }
    }

    // ... (refreshToken, logout unchanged)
    async refreshToken(req, res) {
        // ... (keep original logic)
        try {
            const token = req.cookies.refreshToken;
            if (!token) return res.status(401).json({ error: 'Token manquant' });

            const rToken = await RefreshToken.findOne({ where: { token } });

            if (!rToken || new Date() > rToken.expiresAt) {
                return res.status(403).json({ error: 'Refresh token invalide ou expiré' });
            }

            if (rToken.revoked) {
                await RefreshToken.update({ revoked: true }, { where: { userId: rToken.userId } });
                res.clearCookie('accessToken');
                res.clearCookie('refreshToken');
                return res.status(403).json({ error: 'Alerte de sécurité : Session compromise. Veuillez vous reconnecter.' });
            }

            const user = await User.findByPk(rToken.userId);
            if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

            const newRefreshToken = crypto.randomBytes(40).toString('hex');
            const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            rToken.revoked = true;
            rToken.replacedByToken = newRefreshToken;
            await rToken.save();

            await RefreshToken.create({
                token: newRefreshToken,
                userId: user.id,
                expiresAt: newExpiresAt
            });

            const newAccessToken = jwt.sign(
                { id: user.id, role: user.role },
                process.env.JWT_SECRET || 'votre_secret_jwt_tres_long_et_aleatoire_12345',
                { expiresIn: '15m' }
            );

            res.cookie('accessToken', newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 15 * 60 * 1000
            });

            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.json({ message: 'Token rafraîchi' }); // Usually client refreshes page/state to get new user info or just updates token
        } catch (error) {
            console.error('RefreshToken Error:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async logout(req, res) {
        try {
            const token = req.cookies.refreshToken;
            if (token) {
                await RefreshToken.update({ revoked: true }, { where: { token } });
            }
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            res.json({ message: 'Déconnexion réussie' });
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la déconnexion' });
        }
    }

    async getMe(req, res) {
        try {
            // req.user est peuplé par le middleware, mais on recharge pour être sûr d'avoir les dernières infos
            const user = await User.findByPk(req.user.id, {
                attributes: { exclude: ['password'] },
                include: [{
                    model: Role,
                    as: 'assignedRole',
                    include: [{ model: Permission, as: 'permissions' }]
                }]
            });

            if (!user) {
                return res.status(404).json({ error: 'Utilisateur non trouvé.' });
            }

            const permissionCodes = user.assignedRole?.permissions?.map(p => p.code) || [];

            const userResponse = user.toJSON();
            userResponse.permissions = permissionCodes;

            res.status(200).json(userResponse);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            const user = await User.findOne({ where: { email } });

            if (!user) {
                // Return success even if user not found to prevent enumeration
                return res.status(200).json({ message: 'Si un compte existe à cette adresse, un email a été envoyé.' });
            }

            // Generate token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const tokenExpiry = Date.now() + 3600000; // 1 hour

            await user.update({
                resetPasswordToken: resetToken,
                resetPasswordExpires: tokenExpiry
            });

            await emailService.sendPasswordResetEmail(user.email, resetToken);

            res.status(200).json({ message: 'Si un compte existe à cette adresse, un email a été envoyé.' });
        } catch (error) {
            console.error('Erreur forgotPassword:', error);
            res.status(500).json({ error: 'Erreur lors de la demande de réinitialisation.' });
        }
    }

    async resetPassword(req, res) {
        try {
            const { token, password } = req.body;

            const user = await User.findOne({
                where: {
                    resetPasswordToken: token,
                    resetPasswordExpires: { [Op.gt]: new Date() }
                }
            });

            if (!user) {
                return res.status(400).json({ error: 'Le lien de réinitialisation est invalide ou a expiré.' });
            }

            // Update user (password hashing is handled by User model hook)
            await user.update({
                password: password,
                resetPasswordToken: null,
                resetPasswordExpires: null,
                failedLoginAttempts: 0,
                lockUntil: null
            });

            res.status(200).json({ message: 'Mot de passe réinitialisé avec succès.' });
        } catch (error) {
            console.error('Erreur resetPassword:', error);
            res.status(500).json({ error: 'Erreur lors de la réinitialisation du mot de passe.' });
        }
    }
}

export default new AuthController();
