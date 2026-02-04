import express from 'express';
import {
    getAllWorkflows,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    addStep,
    updateStep,
    deleteStep,
    addTransition,
    deleteTransition
} from '../controllers/workflowController.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware.authenticate);

// Workflows
router.get('/', getAllWorkflows);
router.post('/', authMiddleware.authorize(['ADMINISTRATOR']), createWorkflow);
router.put('/:id', authMiddleware.authorize(['ADMINISTRATOR']), updateWorkflow);
router.delete('/:id', authMiddleware.authorize(['ADMINISTRATOR']), deleteWorkflow);

// Steps
router.post('/:workflowId/steps', authMiddleware.authorize(['ADMINISTRATOR']), addStep);
router.put('/steps/:id', authMiddleware.authorize(['ADMINISTRATOR']), updateStep); // ID is Step ID
router.delete('/steps/:id', authMiddleware.authorize(['ADMINISTRATOR']), deleteStep);

// Transitions
router.post('/:workflowId/transitions', authMiddleware.authorize(['ADMINISTRATOR']), addTransition);
router.delete('/transitions/:id', authMiddleware.authorize(['ADMINISTRATOR']), deleteTransition);

export default router;
