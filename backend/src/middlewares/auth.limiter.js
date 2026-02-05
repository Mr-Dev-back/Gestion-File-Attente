import rateLimit from 'express-rate-limit';

/**
 * Limiteur spécifique pour les routes d'authentification (Login, Forgot Password)
 * Empêche les attaques par force brute.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limite chaque IP à 10 tentatives de connexion par fenêtre
    message: {
        error: 'Trop de tentatives de connexion à partir de cette adresse IP. Veuillez réessayer après 15 minutes.'
    },
    standardHeaders: true, // Retourne les headers `RateLimit-*`
    legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
});

/**
 * Limiteur spécifique pour la création de compte (si activé un jour)
 */
export const registrationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 5, // Limite à 5 créations de compte par heure par IP
    message: {
        error: 'Nombre maximum de comptes créés atteint. Veuillez réessayer plus tard.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
