import { Queue, Site, Workflow } from '../models/index.js';

export const getAllQueues = async (req, res) => {
    try {
        const { siteId } = req.query;
        const whereClause = siteId ? { siteId } : {};

        const queues = await Queue.findAll({
            where: whereClause,
            include: [
                { model: Site, as: 'site', attributes: ['name', 'id'] },
                { model: Workflow, as: 'workflow', attributes: ['name', 'id'] }
            ],
            order: [['priority', 'DESC']]
        });
        res.json(queues);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createQueue = async (req, res) => {
    try {
        const queue = await Queue.create(req.body);
        res.status(201).json(queue);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const updateQueue = async (req, res) => {
    try {
        const { id } = req.params;
        const queue = await Queue.findByPk(id);
        if (!queue) return res.status(404).json({ error: 'File introuvable' });

        await queue.update(req.body);
        res.json(queue);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteQueue = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Queue.destroy({ where: { id } });
        if (!deleted) return res.status(404).json({ error: 'File introuvable' });
        res.json({ message: 'File supprimée' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
