import express from 'express';
import { getAllKiosks, createKiosk, updateKiosk, deleteKiosk, getKioskHistory } from '../controllers/kioskController.js';
import AuthMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(AuthMiddleware.authenticate.bind(AuthMiddleware));

// Read
router.get('/', AuthMiddleware.authorize(['ADMINISTRATOR', 'MANAGER', 'SUPERVISOR']), getAllKiosks);
router.get('/:id/history', AuthMiddleware.authorize(['ADMINISTRATOR', 'MANAGER', 'SUPERVISOR']), getKioskHistory);

// Write
router.post('/', AuthMiddleware.authorize(['ADMINISTRATOR', 'MANAGER']), createKiosk);
router.put('/:id', AuthMiddleware.authorize(['ADMINISTRATOR', 'MANAGER']), updateKiosk); // Change status or config
router.delete('/:id', AuthMiddleware.authorize(['ADMINISTRATOR', 'MANAGER']), deleteKiosk);

export default router;
