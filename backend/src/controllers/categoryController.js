import { Category } from '../models/index.js';
import logger from '../config/logger.js';

export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            order: [['name', 'ASC']],
            include: [{ association: 'queues', attributes: ['id', 'name'] }]
        });
        res.json(categories);
    } catch (error) {
        logger.error('Erreur récupération catégories:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des catégories' });
    }
};

export const createCategory = async (req, res) => {
    try {
        const { name, prefix, estimatedDuration, description, color, queueIds } = req.body;

        // Validation basique
        if (!name || !prefix) {
            return res.status(400).json({ error: 'Nom et préfixe requis' });
        }

        const category = await Category.create({
            name,
            prefix,
            estimatedDuration,
            description,
            color
        });

        // Association with queues
        if (queueIds && Array.isArray(queueIds)) {
            await category.setQueues(queueIds);
        }

        const result = await Category.findByPk(category.id, { include: 'queues' });
        res.status(201).json(result);
    } catch (error) {
        logger.error('Erreur création catégorie:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'Cette catégorie existe déjà' });
        }
        res.status(500).json({ error: 'Erreur lors de la création de la catégorie' });
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, prefix, estimatedDuration, isActive, description, color, queueIds } = req.body;

        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({ error: 'Catégorie non trouvée' });
        }

        await category.update({
            name,
            prefix,
            estimatedDuration,
            isActive,
            description,
            color
        });

        // Association with queues
        if (queueIds && Array.isArray(queueIds)) {
            await category.setQueues(queueIds);
        }

        const result = await Category.findByPk(category.id, { include: 'queues' });
        res.json(result);
    } catch (error) {
        logger.error('Erreur mise à jour catégorie:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de la catégorie' });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findByPk(id);

        if (!category) {
            return res.status(404).json({ error: 'Catégorie non trouvée' });
        }

        // Soft delete en désactivant
        await category.update({ isActive: false });

        res.json({ message: 'Catégorie désactivée avec succès' });
    } catch (error) {
        logger.error('Erreur suppression catégorie:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression de la catégorie' });
    }
};
