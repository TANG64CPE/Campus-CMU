import { Router } from 'express';
import { ReservationController } from '../controllers/reservation.controller';
import { ChatController } from '../controllers/chat.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticateToken, ReservationController.createReservation);
router.post('/:id/cancel', authenticateToken, ReservationController.cancelReservation);
router.post('/:id/complete', authenticateToken, ReservationController.completeReservation);
router.post('/:id/report-ghost', authenticateToken, ReservationController.reportGhost);
router.get('/my', authenticateToken, ReservationController.getMyReservations);
router.get('/seller', authenticateToken, ReservationController.getSellerReservations);
router.get('/:id/messages', authenticateToken, ChatController.getMessages);
router.post('/:id/messages', authenticateToken, ChatController.sendMessage);

export default router;
