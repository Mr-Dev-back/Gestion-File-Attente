import logger from '../config/logger.js';

class EmailService {
    /**
     * Send a password reset email
     * @param {string} to - Recipient email
     * @param {string} token - Reset token
     */
    async sendPasswordResetEmail(to, token) {
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

        // In production, use nodemailer or SendGrid here
        // For now, log the link
        logger.info(`[EMAIL MOCK] To: ${to}`);
        logger.info(`[EMAIL MOCK] Subject: Réinitialisation de mot de passe`);
        logger.info(`[EMAIL MOCK] Link: ${resetLink}`);

        console.log('---------------------------------------------------');
        console.log(`POUR RÉINITIALISER LE MOT DE PASSE DE ${to}:`);
        console.log(resetLink);
        console.log('---------------------------------------------------');
    }
}

export default new EmailService();
