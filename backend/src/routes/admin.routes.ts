import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication and admin privileges
router.use(authenticateToken);
router.use(requireAdmin);

// Admin dashboard & stats
router.get('/stats', AdminController.getStats);

// User management endpoints
router.get('/users', AdminController.getUsers);
router.get('/users/:id', AdminController.getUserDetail);
router.patch('/users/:id/ban', AdminController.toggleBanUser);
router.patch('/users/:id/role', AdminController.updateUserRole);

export default router;
