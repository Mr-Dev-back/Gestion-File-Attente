
import Joi from 'joi';

const validRoles = ['ADMINISTRATOR', 'SUPERVISOR', 'MANAGER', 'AGENT_QUAI'];

export const createUserSchema = Joi.object({
    username: Joi.string().min(3).max(50).required().messages({
        'string.base': 'Le nom d\'utilisateur doit être une chaîne de caractères.',
        'string.empty': 'Le nom d\'utilisateur est obligatoire.',
        'string.min': 'Le nom d\'utilisateur doit contenir au moins 3 caractères.',
        'string.max': 'Le nom d\'utilisateur ne doit pas dépasser 50 caractères.',
        'any.required': 'Le nom d\'utilisateur est obligatoire.'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'L\'adresse email est invalide.',
        'any.required': 'L\'email est obligatoire.'
    }),
    password: Joi.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).required().messages({
        'string.min': 'Le mot de passe doit contenir au moins 8 caractères.',
        'string.pattern.base': 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&).',
        'any.required': 'Le mot de passe est obligatoire.'
    }),
    role: Joi.string().valid(...validRoles).required().messages({
        'any.only': `Le rôle doit être l'un des suivants: ${validRoles.join(', ')}`,
        'any.required': 'Le rôle est obligatoire.'
    }),
    siteId: Joi.string().uuid().allow(null, '').messages({
        'string.guid': 'L\'ID du site doit être un UUID valide.'
    })
});

export const updateUserSchema = Joi.object({
    username: Joi.string().min(3).max(50).messages({
        'string.min': 'Le nom d\'utilisateur doit contenir au moins 3 caractères.',
        'string.max': 'Le nom d\'utilisateur ne doit pas dépasser 50 caractères.'
    }),
    email: Joi.string().email().messages({
        'string.email': 'L\'adresse email est invalide.'
    }),
    password: Joi.string().min(6).messages({
        'string.min': 'Le mot de passe doit contenir au moins 6 caractères.'
    }),
    role: Joi.string().valid(...validRoles).messages({
        'any.only': `Le rôle doit être l'un des suivants: ${validRoles.join(', ')}`
    }),
    isActive: Joi.boolean().messages({
        'boolean.base': 'Le champ isActive doit être un booléen.'
    }),
    siteId: Joi.string().uuid().allow(null, '').messages({
        'string.guid': 'L\'ID du site doit être un UUID valide.'
    })
});
