import express from 'express';
import dashboardController from '../controllers/dashboardController.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// All dashboard routes require authentication
router.use(authMiddleware.authenticate);

/**
 * Admin Dashboard Routes
 */
router.get('/admin/stats',
    authMiddleware.authorize('ADMINISTRATOR'),
    dashboardController.getAdminStats
);

router.get('/admin/recent-activity',
    authMiddleware.authorize('ADMINISTRATOR'),
    dashboardController.getAdminRecentActivity
);

/**
 * Supervisor Dashboard Routes
 */
router.get('/supervisor/stats',
    authMiddleware.authorize('SUPERVISOR', 'ADMINISTRATOR'),
    dashboardController.getSupervisorStats
);

router.get('/supervisor/departments',
    authMiddleware.authorize('SUPERVISOR', 'ADMINISTRATOR'),
    dashboardController.getSupervisorDepartments
);

/**
 * Manager Dashboard Routes
 */
router.get('/manager/stats',
    authMiddleware.authorize('MANAGER', 'SUPERVISOR', 'ADMINISTRATOR'),
    dashboardController.getManagerStats
);

router.get('/manager/performance',
    authMiddleware.authorize('MANAGER', 'SUPERVISOR', 'ADMINISTRATOR'),
    dashboardController.getManagerPerformance
);

/**
 * Sales Dashboard Routes
 */
router.get('/sales/stats',
    authMiddleware.authorize('AGENT_QUAI', 'SUPERVISOR', 'ADMINISTRATOR'),
    dashboardController.getSalesStats
);

router.get('/sales/summary',
    authMiddleware.authorize('AGENT_QUAI', 'SUPERVISOR', 'ADMINISTRATOR'),
    dashboardController.getSalesSummary
);

/**
 * Control Dashboard Routes
 */
router.get('/control/stats',
    authMiddleware.authorize('AGENT_QUAI', 'SUPERVISOR', 'ADMINISTRATOR'),
    dashboardController.getControlStats
);

router.get('/control/pending',
    authMiddleware.authorize('AGENT_QUAI', 'SUPERVISOR', 'ADMINISTRATOR'),
    dashboardController.getControlPending
);

export default router;
