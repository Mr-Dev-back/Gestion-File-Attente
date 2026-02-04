import express from 'express';
import { getEffectiveSettings, updateSetting, deleteSettingOverride } from '../controllers/systemSettingController.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public read allow? Or only authenticated? Let's say all users need settings
router.get('/', authMiddleware.authenticate, getEffectiveSettings);

// Write restricted to Managers/Admins (Middleware logic can be refined inside controller or specific per endpoint)
// For now, allow auth users to call it but verify roles
router.post('/', authMiddleware.authenticate, authMiddleware.authorize(['ADMINISTRATOR', 'MANAGER']), updateSetting);

router.delete('/:id', authMiddleware.authenticate, authMiddleware.authorize(['ADMINISTRATOR', 'MANAGER']), deleteSettingOverride);

export default router;
