import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { isProfileContactComplete, formatContactSummary, isValidThaiMobileNumber } from '../utils/userValidation';

export class UserController {
  /**
   * PATCH /api/users/profile/avatar
   * Upload and persist the authenticated user's profile image.
   */
  public static async uploadAvatar(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'กรุณาเลือกรูปโปรไฟล์ก่อนอัปโหลด' });
      return;
    }

    try {
      const user = req.user!;
      const avatarUrl = `/uploads/${req.file.filename}`;
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl },
      });

      if (user.avatarUrl?.startsWith('/uploads/avatar-')) {
        const oldAvatarPath = path.resolve(__dirname, '../../', user.avatarUrl.replace(/^\//, ''));
        const uploadDirectory = path.resolve(__dirname, '../../uploads');
        if (oldAvatarPath.startsWith(`${uploadDirectory}${path.sep}`)) {
          void fs.promises.unlink(oldAvatarPath).catch(() => undefined);
        }
      }

      res.json({ success: true, user: updatedUser });
    } catch (error: any) {
      await fs.promises.unlink(req.file.path).catch(() => undefined);
      res.status(500).json({ success: false, message: error.message || 'ไม่สามารถบันทึกรูปโปรไฟล์ได้' });
    }
  }

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

      if (!fullUser) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const hasCompletedContact = isProfileContactComplete(fullUser);

      res.json({
        success: true,
        user: {
          ...fullUser,
          hasCompletedContact,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * PATCH /api/users/profile
   * Update student contact information (Phone, Line ID, Facebook, Instagram, Meetup Note)
   */
  public static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { studentId, phone, lineId, facebook, instagram, meetingNote } = req.body;

      const trimmedStudentId = studentId ? String(studentId).trim() : '';
      if (!trimmedStudentId) {
        res.status(400).json({
          success: false,
          message: 'กรุณากรอกรหัสนักศึกษา (*จำเป็นต้องมี)',
        });
        return;
      }
      if (trimmedStudentId.length > 32) {
        res.status(400).json({ success: false, message: 'รหัสนักศึกษาต้องมีความยาวไม่เกิน 32 ตัวอักษร' });
        return;
      }

      const existingStudentId = await prisma.user.findFirst({
        where: { studentId: trimmedStudentId, id: { not: user.id } },
        select: { id: true },
      });
      if (existingStudentId) {
        res.status(409).json({ success: false, message: 'รหัสนักศึกษานี้ถูกใช้งานแล้ว' });
        return;
      }

      // 1. Validate Phone (Mandatory)
      const trimmedPhone = phone ? String(phone).trim() : '';
      if (!trimmedPhone) {
        res.status(400).json({
          success: false,
          message: 'กรุณากรอกเบอร์โทรติดต่อ (*จำเป็นต้องมี)',
        });
        return;
      }

      if (!isValidThaiMobileNumber(trimmedPhone)) {
        res.status(400).json({
          success: false,
          message: 'กรุณากรอกเบอร์มือถือไทย 10 หลัก โดยขึ้นต้นด้วย 06, 08 หรือ 09',
        });
        return;
      }

      // 2. Validate Social Media (At least 1 required: Line, Facebook, or Instagram)
      const trimmedLine = lineId ? String(lineId).trim() : '';
      const trimmedFb = facebook ? String(facebook).trim() : '';
      const trimmedIg = instagram ? String(instagram).trim() : '';

      if (!trimmedLine && !trimmedFb && !trimmedIg) {
        res.status(400).json({
          success: false,
          message: 'กรุณากรอกช่องทางโซเชียลมีเดียอย่างน้อย 1 ช่อง (Line, Facebook หรือ Instagram)',
        });
        return;
      }

      const trimmedMeetingNote = meetingNote ? String(meetingNote).trim() : '';

      // 3. Format single-line contactInfo for compatibility
      const contactSummary = formatContactSummary({
        phone: trimmedPhone,
        lineId: trimmedLine || null,
        facebook: trimmedFb || null,
        instagram: trimmedIg || null,
        meetingNote: trimmedMeetingNote || null,
      });

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          studentId: trimmedStudentId,
          phone: trimmedPhone,
          lineId: trimmedLine || null,
          facebook: trimmedFb || null,
          instagram: trimmedIg || null,
          meetingNote: trimmedMeetingNote || null,
          contactInfo: contactSummary,
        },
      });

      res.json({
        success: true,
        message: 'บันทึกข้อมูลติดต่อเรียบร้อยแล้ว',
        user: {
          ...updated,
          hasCompletedContact: true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        res.status(409).json({ success: false, message: 'รหัสนักศึกษานี้ถูกใช้งานแล้ว' });
        return;
      }
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
