import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import fs from 'fs';
import path from 'path';

export class ProductController {
  /**
   * POST /api/products
   * Create a new product listing with uploaded image
   */
  public static async createProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { title, price, meetupLocation } = req.body;

      if (!title || !price || !meetupLocation) {
        // If an image was uploaded, remove it since validation failed
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        res.status(400).json({
          success: false,
          message: 'Title, price, and meetup location are required.',
        });
        return;
      }

      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        res.status(400).json({ success: false, message: 'Price must be a valid positive number.' });
        return;
      }

      // Store relative path for frontend access e.g., /uploads/filename.jpg
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

      const product = await prisma.product.create({
        data: {
          title: title.trim(),
          price: parsedPrice,
          meetupLocation: meetupLocation.trim(),
          imageUrl,
          sellerId: user.id,
          isAvailable: true,
        },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              studentId: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Product listed successfully.',
        product,
      });
    } catch (error: any) {
      console.error('[Create Product Error]:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/products
   * List products with search filter and availability filter
   */
  public static async getProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { search, available } = req.query;

      const whereClause: any = {};

      // Filter by availability: defaults to only available unless specified
      if (available === 'all') {
        // show all
      } else if (available === 'false') {
        whereClause.isAvailable = false;
      } else {
        whereClause.isAvailable = true;
      }

      // Search by title (case-insensitive)
      if (search && typeof search === 'string' && search.trim() !== '') {
        whereClause.title = {
          contains: search.trim(),
          mode: 'insensitive',
        };
      }

      const products = await prisma.product.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              studentId: true,
            },
          },
          reservations: {
            where: {
              status: 'PENDING',
            },
            select: {
              id: true,
              buyerId: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });

      res.json({
        success: true,
        count: products.length,
        products,
      });
    } catch (error: any) {
      console.error('[Get Products Error]:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/products/:id
   * Get single product details.
   * "Reserve & Reveal": Reveals seller contactInfo ONLY if the user is the seller
   * or the buyer who holds a PENDING or COMPLETED reservation!
   */
  public static async getProductById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.id;

      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              studentId: true,
              contactInfo: true,
            },
          },
          reservations: {
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
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!product) {
        res.status(404).json({ success: false, message: 'Product not found.' });
        return;
      }

      // Determine active reservation (if any)
      const activeReservation = product.reservations.find(
        (r) => r.status === 'PENDING'
      );

      // Check if current user is seller or the active buyer
      const isSeller = currentUserId && currentUserId === product.sellerId;
      const isReservedBuyer =
        currentUserId &&
        activeReservation &&
        activeReservation.buyerId === currentUserId;

      // Reveal contact info only if authorized
      const canViewSellerContact = isSeller || isReservedBuyer;

      const sanitizedSeller = {
        id: product.seller.id,
        name: product.seller.name,
        studentId: product.seller.studentId,
        contactInfo: canViewSellerContact ? product.seller.contactInfo : null,
      };

      res.json({
        success: true,
        product: {
          ...product,
          seller: sanitizedSeller,
          activeReservation: activeReservation || null,
          isUserSeller: isSeller,
          isUserBuyer: !!isReservedBuyer,
        },
      });
    } catch (error: any) {
      console.error('[Get Product By ID Error]:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * DELETE /api/products/:id
   * Delete product (only seller can delete)
   */
  public static async deleteProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user!;

      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) {
        res.status(404).json({ success: false, message: 'Product not found.' });
        return;
      }

      if (product.sellerId !== user.id) {
        res.status(403).json({ success: false, message: 'Only the seller can delete this product.' });
        return;
      }

      // Delete image file if exists
      if (product.imageUrl) {
        const filePath = path.resolve(__dirname, '../../', product.imageUrl.replace(/^\//, ''));
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch {
            // ignore unlink errors
          }
        }
      }

      await prisma.product.delete({ where: { id } });

      res.json({ success: true, message: 'Product deleted successfully.' });
    } catch (error: any) {
      console.error('[Delete Product Error]:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
