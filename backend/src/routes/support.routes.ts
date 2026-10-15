import { Router } from 'express';
import { SupportController } from '../controllers/support.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.get('/messages', SupportController.getMyMessages);
router.post('/messages', SupportController.sendMessage);

export default router;
