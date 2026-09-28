import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class AdminController {
  /**
   * GET /api/admin/stats
   * Overview statistics for the Admin dashboard
   */
  public static async getStats(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const [totalUsers, totalBanned, totalProducts, totalReservations, completedDeals] =
        await Promise.all([
          prisma.user.count(),
          prisma.user.count({ where: { isBanned: true } }),
          prisma.product.count(),
          prisma.reservation.count(),
          prisma.reservation.count({ where: { status: 'COMPLETED' } }),
        ]);

      // Calculate distinct sellers and buyers
      const [sellersCount, buyersCount] = await Promise.all([
        prisma.user.count({
          where: {
            products: {
              some: {},
            },
          },
        }),
        prisma.user.count({
          where: {
            reservations: {
              some: {},
            },
          },
        }),
      ]);

      res.json({
        success: true,
        stats: {
          totalUsers,
          totalSellers: sellersCount,
          totalBuyers: buyersCount,
          totalBanned,
          totalProducts,
          totalReservations,
          completedDeals,
        },
      });
    } catch (error: any) {
      console.error('[Admin getStats Error]:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve admin stats', error: error.message });
    }
  }

  /**
   * GET /api/admin/users
   * List all user accounts with seller and buyer summary metrics
   */
  public static async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { search, role, status, side } = req.query;

      const whereClause: any = {};

      if (search && typeof search === 'string') {
        const q = search.trim();
        whereClause.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { studentId: { contains: q, mode: 'insensitive' } },
        ];
      }

      if (role && (role === 'STUDENT' || role === 'ADMIN')) {
        whereClause.role = role;
      }

      if (status === 'banned') {
        whereClause.isBanned = true;
      } else if (status === 'active') {
        whereClause.isBanned = false;
      }

      if (side === 'sellers') {
        whereClause.products = { some: {} };
      } else if (side === 'buyers') {
        whereClause.reservations = { some: {} };
      }

      const users = await prisma.user.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              products: true,
              reservations: true,
            },
          },
          products: {
            select: {
              id: true,
              isAvailable: true,
              price: true,
            },
          },
          reservations: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Enhance users with clean calculated metrics
      const formattedUsers = users.map((u) => {
        const availableProducts = u.products.filter((p) => p.isAvailable).length;
        const pendingReservations = u.reservations.filter((r) => r.status === 'PENDING').length;
        const completedReservations = u.reservations.filter((r) => r.status === 'COMPLETED').length;

        return {
          id: u.id,
          studentId: u.studentId,
          name: u.name,
          email: u.email,
          contactInfo: u.contactInfo,
          role: u.role,
          isBanned: u.isBanned,
          createdAt: u.createdAt,
          sellerStats: {
            totalProducts: u._count.products,
            availableProducts,
            reservedOrSoldProducts: u._count.products - availableProducts,
          },
          buyerStats: {
            totalReservations: u._count.reservations,
            pendingReservations,
            completedReservations,
          },
        };
      });

      res.json({
        success: true,
        count: formattedUsers.length,
        users: formattedUsers,
      });
    } catch (error: any) {
      console.error('[Admin getUsers Error]:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve users', error: error.message });
    }
  }

  /**
   * GET /api/admin/users/:id
   * Detailed breakdown for a single user:
   * - Full Seller Side: all listed products with current availability & reservation history
   * - Full Buyer Side: all reservations made with product info and seller contacts
   */
  public static async getUserDetail(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          // Seller side: items listed by this user
          products: {
            orderBy: { createdAt: 'desc' },
            include: {
              reservations: {
                orderBy: { createdAt: 'desc' },
                include: {
                  buyer: {
                    select: {
                      id: true,
                      studentId: true,
                      name: true,
                      email: true,
                      contactInfo: true,
                    },
                  },
                },
              },
            },
          },
          // Buyer side: items reserved by this user
          reservations: {
            orderBy: { createdAt: 'desc' },
            include: {
              product: {
                include: {
                  seller: {
                    select: {
                      id: true,
                      studentId: true,
                      name: true,
                      email: true,
                      contactInfo: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      // Calculate Seller Side details
      const totalListed = user.products.length;
      const activeListed = user.products.filter((p) => p.isAvailable).length;
      const reservedOrCompleted = totalListed - activeListed;
      const totalEstimatedSalesValue = user.products.reduce((acc, p) => acc + p.price, 0);

      // Calculate Buyer Side details
      const totalReserved = user.reservations.length;
      const pendingReservations = user.reservations.filter((r) => r.status === 'PENDING').length;
      const completedReservations = user.reservations.filter((r) => r.status === 'COMPLETED').length;
      const cancelledReservations = user.reservations.filter((r) => r.status === 'CANCELLED').length;
      const totalSpent = user.reservations
        .filter((r) => r.status === 'COMPLETED')
        .reduce((acc, r) => acc + (r.product?.price || 0), 0);

      res.json({
        success: true,
        user: {
          id: user.id,
          studentId: user.studentId,
          name: user.name,
          email: user.email,
          contactInfo: user.contactInfo,
          role: user.role,
          isBanned: user.isBanned,
          createdAt: user.createdAt,
        },
        sellerSide: {
          stats: {
            totalListed,
            activeListed,
            reservedOrCompleted,
            totalEstimatedSalesValue,
          },
          products: user.products,
        },
        buyerSide: {
          stats: {
            totalReserved,
            pendingReservations,
            completedReservations,
            cancelledReservations,
            totalSpent,
          },
          reservations: user.reservations,
        },
      });
    } catch (error: any) {
      console.error('[Admin getUserDetail Error]:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve user details', error: error.message });
    }
  }

  /**
   * PATCH /api/admin/users/:id/ban
   * Toggle or set user ban status
   */
  public static async toggleBanUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { isBanned } = req.body;

    try {
      const targetUser = await prisma.user.findUnique({ where: { id } });

      if (!targetUser) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      // Do not allow banning self
      if (req.user && req.user.id === id) {
        res.status(400).json({ success: false, message: 'Cannot ban your own admin account.' });
        return;
      }

      const nextBannedState = typeof isBanned === 'boolean' ? isBanned : !targetUser.isBanned;

      const updated = await prisma.user.update({
        where: { id },
        data: { isBanned: nextBannedState },
      });

      // If banned, automatically cancel any pending reservations made by this buyer to release products
      if (nextBannedState) {
        const pendingReservations = await prisma.reservation.findMany({
          where: { buyerId: id, status: 'PENDING' },
        });

        for (const resv of pendingReservations) {
          await prisma.reservation.update({
            where: { id: resv.id },
            data: { status: 'CANCELLED' },
          });
          await prisma.product.update({
            where: { id: resv.productId },
            data: { isAvailable: true },
          });
        }
      }

      res.json({
        success: true,
        message: nextBannedState ? 'User has been banned successfully.' : 'User has been unbanned.',
        user: updated,
      });
    } catch (error: any) {
      console.error('[Admin toggleBanUser Error]:', error);
      res.status(500).json({ success: false, message: 'Failed to update ban status', error: error.message });
    }
  }

  /**
   * PATCH /api/admin/users/:id/role
   * Update user role (e.g. STUDENT <-> ADMIN)
   */
  public static async updateUserRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || (role !== 'STUDENT' && role !== 'ADMIN')) {
      res.status(400).json({ success: false, message: 'Role must be STUDENT or ADMIN.' });
      return;
    }

    try {
      const targetUser = await prisma.user.findUnique({ where: { id } });

      if (!targetUser) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { role },
      });

      res.json({
        success: true,
        message: `User role updated to ${role}.`,
        user: updated,
      });
    } catch (error: any) {
      console.error('[Admin updateUserRole Error]:', error);
      res.status(500).json({ success: false, message: 'Failed to update user role', error: error.message });
    }
  }
}
