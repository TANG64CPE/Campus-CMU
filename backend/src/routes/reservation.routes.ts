import { Router } from 'express';
import { ReservationController } from '../controllers/reservation.controller';
import { ChatController } from '../controllers/chat.controller';
import { authenticateToken, requireActiveAccount } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken, requireActiveAccount);

router.post('/', ReservationController.createReservation);
router.post('/:id/cancel', ReservationController.cancelReservation);
router.post('/:id/complete', ReservationController.completeReservation);
router.post('/:id/report-ghost', ReservationController.reportGhost);
router.get('/my', ReservationController.getMyReservations);
router.get('/seller', ReservationController.getSellerReservations);
router.get('/chats', ChatController.getMyThreads);
router.get('/:id/messages', ChatController.getMessages);
router.post('/:id/messages', ChatController.sendMessage);

export default router;
