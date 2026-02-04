import express from 'express';
import AuthMiddleware from '../middlewares/auth.middleware.js';
import * as categoryController from '../controllers/categoryController.js';

const router = express.Router();

// Routes publiques (pour l'instant, peut être restreint si besoin)
router.get('/', categoryController.getAllCategories);

// Routes protégées (Admin seulement)
router.post('/',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('ADMINISTRATOR'),
    categoryController.createCategory
);

router.put('/:id',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('ADMINISTRATOR'),
    categoryController.updateCategory
);

router.delete('/:id',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('ADMINISTRATOR'),
    categoryController.deleteCategory
);

export default router;
