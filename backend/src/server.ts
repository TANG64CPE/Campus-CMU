import app from './app';
import { ENV } from './config/env';
import { CronService } from './services/cron.service';
import { prisma } from './lib/prisma';

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Connected to Database successfully.');

    // Backfill stock on listings created before quantity-based reservations.
    const legacyProducts = await prisma.product.findMany({
      where: { inventoryInitialized: false },
      select: {
        id: true,
        quantity: true,
        reservations: {
          where: { status: { in: ['PENDING', 'COMPLETED'] } },
          select: { id: true },
          take: 1,
        },
      },
    });
    for (const product of legacyProducts) {
      await prisma.product.updateMany({
        where: { id: product.id, inventoryInitialized: false },
        data: {
          quantity: product.reservations.length > 0 ? 0 : product.quantity,
          inventoryInitialized: true,
        },
      });
    }

    // Initialize 24-hour auto cancellation cron
    CronService.initCronJobs();

    const PORT = parseInt(ENV.PORT, 10) || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 CampusMart Server running on port ${PORT}`);
      console.log(`📡 CMU OAuth Redirect URI: ${ENV.CMU_OAUTH_REDIRECT_URI}`);
      console.log(`🧪 Mock Auth Enabled: ${ENV.ENABLE_MOCK_AUTH}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
