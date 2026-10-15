import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import fs from 'fs';
import path from 'path';
import { isProfileContactComplete } from '../utils/userValidation';
import { isAdminRole } from '../utils/roles';
import { MAX_PRODUCT_IMAGES, resolveProductImageUrls } from '../utils/productImages';

export class ProductController {
  private static getUploadedImages(req: AuthenticatedRequest): Express.Multer.File[] {
    return Array.isArray(req.files) ? req.files : [];
  }

  private static removeUploadedImages(files: Express.Multer.File[]): void {
    files.forEach((file) => {
      try {
        fs.unlinkSync(file.path);
      } catch {
        // Ignore cleanup errors; the request is already failing.
      }
    });
  }

  /**
   * POST /api/products
   * Create a new product listing with uploaded image
   */
  public static async createProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    const files = ProductController.getUploadedImages(req);
    try {
      const user = req.user!;

      if (isAdminRole(user.role)) {
        ProductController.removeUploadedImages(files);
        res.status(403).json({
          success: false,
          message: 'บัญชีผู้ดูแลระบบไม่สามารถลงขายสินค้าได้',
        });
        return;
      }

      // Enforce mandatory profile contact info before listing products
      if (!isProfileContactComplete(user)) {
        ProductController.removeUploadedImages(files);
        res.status(403).json({
          success: false,
          message: 'กรุณากรอกข้อมูลติดต่อในหน้าโปรไฟล์ให้ครบถ้วนก่อนลงขายสินค้า (จำเป็นต้องมีเบอร์โทร และ Line/Facebook/Instagram อย่างน้อย 1 ช่อง)',
          requiresContactInfo: true,
        });
        return;
      }

      const { title, price, meetupLocation } = req.body;

      if (!title || !price || !meetupLocation) {
        // If an image was uploaded, remove it since validation failed
        ProductController.removeUploadedImages(files);
        res.status(400).json({
          success: false,
          message: 'Title, price, and meetup location are required.',
        });
        return;
      }

      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        ProductController.removeUploadedImages(files);
        res.status(400).json({ success: false, message: 'Price must be a valid positive number.' });
        return;
      }

      if (files.length > MAX_PRODUCT_IMAGES) {
        ProductController.removeUploadedImages(files);
        res.status(400).json({
          success: false,
          message: `อัปโหลดรูปสินค้าได้สูงสุด ${MAX_PRODUCT_IMAGES} รูป`,
        });
        return;
      }

      // Store relative path for frontend access e.g., /uploads/filename.jpg
      const imageUrls = files.map((file) => `/uploads/${file.filename}`);
      const imageUrl = imageUrls[0] || null;

      const product = await prisma.product.create({
        data: {
          title: title.trim(),
          price: parsedPrice,
          meetupLocation: meetupLocation.trim(),
          imageUrl,
          imageUrls,
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
      ProductController.removeUploadedImages(files);
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
        products: products.map((product) => ProductController.withResolvedImages(product)),
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
              email: true,
              phone: true,
              lineId: true,
              facebook: true,
              instagram: true,
              meetingNote: true,
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
                  email: true,
                  phone: true,
                  lineId: true,
                  facebook: true,
                  instagram: true,
                  meetingNote: true,
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
      const canViewSellerContact = !isAdminRole(req.user?.role) && (isSeller || isReservedBuyer);

      const sanitizedSeller = {
        id: product.seller.id,
        name: product.seller.name,
        studentId: product.seller.studentId,
        email: canViewSellerContact ? product.seller.email : undefined,
        contactInfo: canViewSellerContact ? product.seller.contactInfo : null,
        phone: canViewSellerContact ? product.seller.phone : null,
        lineId: canViewSellerContact ? product.seller.lineId : null,
        facebook: canViewSellerContact ? product.seller.facebook : null,
        instagram: canViewSellerContact ? product.seller.instagram : null,
        meetingNote: canViewSellerContact ? product.seller.meetingNote : null,
      };

      const resolvedProduct = ProductController.withResolvedImages(product);

      res.json({
        success: true,
        product: {
          ...resolvedProduct,
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

      const imageUrls = new Set(resolveProductImageUrls(product.imageUrl, product.imageUrls));
      for (const imageUrl of imageUrls) {
        const filePath = path.resolve(__dirname, '../../', imageUrl!.replace(/^\//, ''));
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

  private static withResolvedImages<T extends { imageUrl: string | null; imageUrls: string[] }>(
    product: T
  ): T {
    const imageUrls = resolveProductImageUrls(product.imageUrl, product.imageUrls);
    return {
      ...product,
      imageUrls,
      imageUrl: imageUrls[0] || product.imageUrl,
    };
  }
}
