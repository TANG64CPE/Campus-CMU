import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// CPE OAuth initiation endpoints
router.get('/cmu', AuthController.initiateCmuLogin);
router.get('/login', AuthController.initiateCmuLogin);

// OAuth callback endpoints (matching Aj Nirand's callback list)
router.get('/callback', AuthController.handleCmuCallback);
router.get('/cmu/callback', AuthController.handleCmuCallback);

// Mock login for offline local testing
router.post('/mock-login', AuthController.mockLogin);

// User session
router.get('/me', authenticateToken, AuthController.getMe);
router.post('/logout', AuthController.logout);

export default router;
