import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { SupportController } from '../controllers/support.controller';
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
router.get('/support', SupportController.getAdminConversations);
router.get('/support/:userId/messages', SupportController.getAdminMessages);
router.post('/support/:userId/messages', SupportController.sendAdminMessage);
router.patch('/support/:userId/status', SupportController.setConversationResolved);

export default router;
