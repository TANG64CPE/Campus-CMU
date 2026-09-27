import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class UserController {
  /**
   * GET /api/users/profile
   * Return logged-in user profile with statistics
   */
  public static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;

      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          products: {
            orderBy: { createdAt: 'desc' },
          },
          reservations: {
            orderBy: { createdAt: 'desc' },
            include: {
              product: true,
            },
          },
        },
      });

      res.json({
        success: true,
        user: fullUser,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * PATCH /api/users/profile
   * Update student contact information (Line ID, Phone number, etc.)
   */
  public static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { contactInfo } = req.body;

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          contactInfo: contactInfo ? contactInfo.trim() : null,
        },
      });

      res.json({
        success: true,
        message: 'Contact info updated successfully.',
        user: updated,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/users/my-products
   * List products posted by the user
   */
  public static async getMyProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;

      const products = await prisma.product.findMany({
        where: { sellerId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          reservations: {
            where: { status: 'PENDING' },
            include: {
              buyer: {
                select: {
                  id: true,
                  name: true,
                  studentId: true,
                  contactInfo: true,
                },
              },
            },
          },
        },
      });

      res.json({
        success: true,
        products,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * PATCH /api/users/products/:id/toggle-status
   * Seller can toggle isAvailable
   */
  public static async toggleProductStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user!;

      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) {
        res.status(404).json({ success: false, message: 'Product not found.' });
        return;
      }

      if (product.sellerId !== user.id) {
        res.status(403).json({ success: false, message: 'Unauthorized.' });
        return;
      }

      const updated = await prisma.product.update({
        where: { id },
        data: { isAvailable: !product.isAvailable },
      });

      res.json({
        success: true,
        message: `Product is now ${updated.isAvailable ? 'available' : 'marked as reserved/unavailable'}.`,
        product: updated,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
