
import Joi from 'joi';

export const registerSchema = Joi.object({
    name: Joi.string().min(3).max(50).required().messages({
        'string.base': 'Le nom doit être une chaîne de caractères.',
        'string.empty': 'Le nom est obligatoire.',
        'string.min': 'Le nom doit contenir au moins 3 caractères.',
        'string.max': 'Le nom ne doit pas dépasser 50 caractères.',
        'any.required': 'Le nom est obligatoire.'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'L\'adresse email est invalide.',
        'any.required': 'L\'email est obligatoire.'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Le mot de passe doit contenir au moins 6 caractères.',
        'any.required': 'Le mot de passe est obligatoire.'
    })
});

export const loginSchema = Joi.object({
    email: Joi.string().required().messages({
        'any.required': 'L\'identifiant est obligatoire.'
    }),
    password: Joi.string().required().messages({
        'any.required': 'Le mot de passe est obligatoire.'
    })
});
