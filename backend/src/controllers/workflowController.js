import { Workflow, WorkflowStep, WorkflowTransition } from '../models/index.js';

// --- Workflow CRUD ---

export const getAllWorkflows = async (req, res) => {
    try {
        const workflows = await Workflow.findAll({
            include: [
                { model: WorkflowStep, as: 'steps' },
                { model: WorkflowTransition, as: 'transitions' }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(workflows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createWorkflow = async (req, res) => {
    try {
        const { name, description } = req.body;
        const workflow = await Workflow.create({ name, description });
        res.status(201).json(workflow);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const updateWorkflow = async (req, res) => {
    try {
        const { id } = req.params;
        const workflow = await Workflow.findByPk(id);
        if (!workflow) return res.status(404).json({ error: 'Flux introuvable' });

        await workflow.update(req.body);
        res.json(workflow);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteWorkflow = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Workflow.destroy({ where: { id } });
        if (!deleted) return res.status(404).json({ error: 'Flux introuvable' });
        res.json({ message: 'Flux supprimé' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Steps CRUD ---

export const addStep = async (req, res) => {
    try {
        const { workflowId } = req.params;
        const step = await WorkflowStep.create({ ...req.body, workflowId });
        res.status(201).json(step);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const updateStep = async (req, res) => {
    try {
        const { id } = req.params;
        const step = await WorkflowStep.findByPk(id);
        if (!step) return res.status(404).json({ error: 'Étape introuvable' });
        await step.update(req.body);
        res.json(step);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteStep = async (req, res) => {
    try {
        const { id } = req.params;
        await WorkflowStep.destroy({ where: { id } });
        res.json({ message: 'Étape supprimée' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Transitions CRUD ---

export const addTransition = async (req, res) => {
    try {
        const { workflowId } = req.params;
        const transition = await WorkflowTransition.create({ ...req.body, workflowId });
        res.status(201).json(transition);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteTransition = async (req, res) => {
    try {
        const { id } = req.params;
        await WorkflowTransition.destroy({ where: { id } });
        res.json({ message: 'Transition supprimée' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
