import express from 'express';
import {
    getAllQueues,
    createQueue,
    updateQueue,
    deleteQueue
} from '../controllers/queueController.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware.authenticate);

router.get('/', getAllQueues);
router.post('/', authMiddleware.authorize(['ADMINISTRATOR', 'MANAGER']), createQueue);
router.put('/:id', authMiddleware.authorize(['ADMINISTRATOR', 'MANAGER']), updateQueue);
router.delete('/:id', authMiddleware.authorize(['ADMINISTRATOR', 'MANAGER']), deleteQueue);

export default router;
