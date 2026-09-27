import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/cmu', AuthController.initiateCmuLogin);
router.get('/cmu/callback', AuthController.handleCmuCallback);
router.post('/mock-login', AuthController.mockLogin);
router.get('/me', authenticateToken, AuthController.getMe);
router.post('/logout', AuthController.logout);

export default router;
