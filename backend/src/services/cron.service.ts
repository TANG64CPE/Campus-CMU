import cron from 'node-cron';
import { prisma } from '../lib/prisma';

export class CronService {
  /**
   * Scans for PENDING reservations older than 24 hours,
   * cancels them and restores Product.isAvailable = true
   */
  public static async cancelExpiredReservations(): Promise<number> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find all expired pending reservations
    const expiredReservations = await prisma.reservation.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lte: twentyFourHoursAgo,
        },
      },
      select: {
        id: true,
        productId: true,
        quantity: true,
      },
    });

    if (expiredReservations.length === 0) {
      return 0;
    }

    console.log(`[Cron] Found ${expiredReservations.length} expired reservations (>24h). Auto-cancelling...`);

    // Process cancellations in transactions
    for (const res of expiredReservations) {
      try {
        await prisma.$transaction(async (tx) => {
          const cancelled = await tx.reservation.updateMany({
            where: { id: res.id, status: 'PENDING' },
            data: { status: 'CANCELLED' },
          });
          if (cancelled.count !== 1) return;
          await tx.product.update({
            where: { id: res.productId },
            data: { quantity: { increment: res.quantity }, isAvailable: true },
          });
        });
        console.log(`[Cron] Auto-cancelled reservation ${res.id} and restored product ${res.productId}`);
      } catch (err) {
        console.error(`[Cron] Error auto-cancelling reservation ${res.id}:`, err);
      }
    }

    return expiredReservations.length;
  }

  /**
   * Initialize cron job to run every hour at minute 0
   */
  public static initCronJobs(): void {
    // Run at minute 0 of every hour
    cron.schedule('0 * * * *', async () => {
      console.log('[Cron] Running hourly check for 24h expired reservations...');
      await this.cancelExpiredReservations();
    });

    console.log('[Cron] Hourly reservation auto-cancel cron initialized.');
  }
}
