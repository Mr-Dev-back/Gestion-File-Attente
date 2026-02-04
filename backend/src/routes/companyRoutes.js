import express from 'express';
import companyController from '../controllers/companyController.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware.authenticate);

router.get('/', companyController.getAll);
router.post('/', authMiddleware.authorize('ADMINISTRATOR'), companyController.create);
router.put('/:id', authMiddleware.authorize('ADMINISTRATOR'), companyController.update);
router.delete('/:id', authMiddleware.authorize('ADMINISTRATOR'), companyController.delete);

export default router;
