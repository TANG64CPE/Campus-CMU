import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class ReservationController {
  /**
   * POST /api/reservations
   * Atomically reserves a product and reveals seller contact information
   */
  public static async createReservation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { productId } = req.body;

      if (!productId) {
        res.status(400).json({ success: false, message: 'Product ID is required.' });
        return;
      }

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { seller: true },
      });

      if (!product) {
        res.status(404).json({ success: false, message: 'Product not found.' });
        return;
      }

      // Seller cannot reserve their own product
      if (product.sellerId === user.id) {
        res.status(400).json({ success: false, message: 'You cannot reserve your own product.' });
        return;
      }

      if (!product.isAvailable) {
        res.status(400).json({
          success: false,
          message: 'Product has already been reserved or is no longer available.',
        });
        return;
      }

      // Check if user already has an active pending reservation for this product
      const existingPending = await prisma.reservation.findFirst({
        where: {
          productId,
          buyerId: user.id,
          status: 'PENDING',
        },
      });

      if (existingPending) {
        res.status(400).json({
          success: false,
          message: 'You already have an active reservation for this product.',
        });
        return;
      }

      // Atomic Prisma Transaction to prevent race conditions
      const result = await prisma.$transaction(async (tx) => {
        // Double-check availability inside transaction lock
        const freshProduct = await tx.product.findUnique({
          where: { id: productId },
        });

        if (!freshProduct || !freshProduct.isAvailable) {
          throw new Error('Product was just reserved by another student. Please refresh.');
        }

        // Mark product as not available
        await tx.product.update({
          where: { id: productId },
          data: { isAvailable: false },
        });

        // Create reservation record
        const newReservation = await tx.reservation.create({
          data: {
            productId,
            buyerId: user.id,
            status: 'PENDING',
          },
          include: {
            product: {
              include: {
                seller: {
                  select: {
                    id: true,
                    name: true,
                    studentId: true,
                    contactInfo: true,
                    email: true,
                  },
                },
              },
            },
          },
        });

        return newReservation;
      });

      // "Reserve & Reveal": Seller's contactInfo is revealed here
      res.status(201).json({
        success: true,
        message: 'Product reserved successfully! Seller contact details are now revealed.',
        reservation: result,
        sellerContact: {
          name: result.product.seller.name,
          studentId: result.product.seller.studentId,
          email: result.product.seller.email,
          contactInfo: result.product.seller.contactInfo || 'Not specified (contact via CMU email)',
          meetupLocation: result.product.meetupLocation,
        },
      });
    } catch (error: any) {
      console.error('[Create Reservation Error]:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/reservations/:id/cancel
   * Cancellation with 3-Hour rule for buyers:
   * Buyer can cancel if now - createdAt < 3 hours.
   * If >= 3 hours, buyer cannot cancel (must contact seller).
   * Seller can also cancel at any time.
   */
  public static async cancelReservation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user!;

      const reservation = await prisma.reservation.findUnique({
        where: { id },
        include: { product: true },
      });

      if (!reservation) {
        res.status(404).json({ success: false, message: 'Reservation not found.' });
        return;
      }

      if (reservation.status !== 'PENDING') {
        res.status(400).json({
          success: false,
          message: `Cannot cancel a reservation that is already ${reservation.status}.`,
        });
        return;
      }

      const isBuyer = reservation.buyerId === user.id;
      const isSeller = reservation.product.sellerId === user.id;

      if (!isBuyer && !isSeller) {
        res.status(403).json({
          success: false,
          message: 'You are not authorized to cancel this reservation.',
        });
        return;
      }

      // Check 3-Hour rule for buyer
      if (isBuyer) {
        const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
        const elapsedTime = Date.now() - new Date(reservation.createdAt).getTime();

        if (elapsedTime >= THREE_HOURS_MS) {
          res.status(400).json({
            success: false,
            message:
              'Cannot cancel reservation: The 3-hour cancellation window has passed. Please contact the seller directly.',
            canCancel: false,
          });
          return;
        }
      }

      // Transaction: Cancel reservation and restore product availability
      await prisma.$transaction([
        prisma.reservation.update({
          where: { id },
          data: { status: 'CANCELLED' },
        }),
        prisma.product.update({
          where: { id: reservation.productId },
          data: { isAvailable: true },
        }),
      ]);

      res.json({
        success: true,
        message: 'Reservation cancelled successfully. Product is now available again.',
      });
    } catch (error: any) {
      console.error('[Cancel Reservation Error]:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/reservations/:id/complete
   * Mark transaction completed (meetup & cash payment done)
   */
  public static async completeReservation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user!;

      const reservation = await prisma.reservation.findUnique({
        where: { id },
        include: { product: true },
      });

      if (!reservation) {
        res.status(404).json({ success: false, message: 'Reservation not found.' });
        return;
      }

      const isBuyer = reservation.buyerId === user.id;
      const isSeller = reservation.product.sellerId === user.id;

      if (!isBuyer && !isSeller) {
        res.status(403).json({ success: false, message: 'Unauthorized.' });
        return;
      }

      if (reservation.status !== 'PENDING') {
        res.status(400).json({ success: false, message: `Reservation is already ${reservation.status}.` });
        return;
      }

      await prisma.reservation.update({
        where: { id },
        data: { status: 'COMPLETED' },
      });

      res.json({
        success: true,
        message: 'Deal completed successfully! Thank you for trading on CampusMart.',
      });
    } catch (error: any) {
      console.error('[Complete Reservation Error]:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/reservations/:id/report-ghost
   * Anti-Ghosting: Seller reports buyer for not showing up at campus meetup.
   * Cancels reservation, restores product availability, and BANS the ghosting buyer!
   */
  public static async reportGhost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user!;

      const reservation = await prisma.reservation.findUnique({
        where: { id },
        include: {
          product: true,
          buyer: true,
        },
      });

      if (!reservation) {
        res.status(404).json({ success: false, message: 'Reservation not found.' });
        return;
      }

      // Only seller of the product can report ghosting
      if (reservation.product.sellerId !== user.id) {
        res.status(403).json({
          success: false,
          message: 'Only the seller can report a ghosting buyer.',
        });
        return;
      }

      if (reservation.status !== 'PENDING') {
        res.status(400).json({
          success: false,
          message: 'Only pending reservations can be reported for ghosting.',
        });
        return;
      }

      // Transaction: Cancel reservation, restore product, and ban buyer
      await prisma.$transaction([
        prisma.reservation.update({
          where: { id },
          data: { status: 'CANCELLED' },
        }),
        prisma.product.update({
          where: { id: reservation.productId },
          data: { isAvailable: true },
        }),
        prisma.user.update({
          where: { id: reservation.buyerId },
          data: { isBanned: true },
        }),
      ]);

      res.json({
        success: true,
        message: `Ghosting report confirmed. Buyer (${reservation.buyer.name}) has been banned from CampusMart and product is restored.`,
      });
    } catch (error: any) {
      console.error('[Report Ghost Error]:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/reservations/my
   * Get all reservations made by the authenticated user (Buyer view)
   */
  public static async getMyReservations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;

      const reservations = await prisma.reservation.findMany({
        where: { buyerId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            include: {
              seller: {
                select: {
                  id: true,
                  name: true,
                  studentId: true,
                  contactInfo: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      res.json({
        success: true,
        reservations,
      });
    } catch (error: any) {
      console.error('[Get My Reservations Error]:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/reservations/seller
   * Get all reservations on products posted by authenticated user (Seller view)
   */
  public static async getSellerReservations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;

      const reservations = await prisma.reservation.findMany({
        where: {
          product: {
            sellerId: user.id,
          },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          product: true,
          buyer: {
            select: {
              id: true,
              name: true,
              studentId: true,
              contactInfo: true,
              email: true,
              isBanned: true,
            },
          },
        },
      });

      res.json({
        success: true,
        reservations,
      });
    } catch (error: any) {
      console.error('[Get Seller Reservations Error]:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
