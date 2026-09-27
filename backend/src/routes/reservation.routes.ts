import { Router } from 'express';
import { ReservationController } from '../controllers/reservation.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticateToken, ReservationController.createReservation);
router.post('/:id/cancel', authenticateToken, ReservationController.cancelReservation);
router.post('/:id/complete', authenticateToken, ReservationController.completeReservation);
router.post('/:id/report-ghost', authenticateToken, ReservationController.reportGhost);
router.get('/my', authenticateToken, ReservationController.getMyReservations);
router.get('/seller', authenticateToken, ReservationController.getSellerReservations);

export default router;
