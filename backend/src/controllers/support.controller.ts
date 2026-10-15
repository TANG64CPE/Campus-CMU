import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const MESSAGE_LIMIT = 2000;
const MESSAGE_HISTORY_LIMIT = 100;

const parseMessage = (body: unknown): string | null => {
  const content = typeof body === 'object' && body !== null && 'content' in body
    ? body.content
    : undefined;
  if (typeof content !== 'string' || !content.trim() || content.trim().length > MESSAGE_LIMIT) return null;
  return content.trim();
};

export class SupportController {
  public static async getMyMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const conversation = await prisma.supportConversation.findUnique({
        where: { userId: req.user!.id },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: MESSAGE_HISTORY_LIMIT,
            include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
          },
        },
      });
      res.json({ success: true, messages: conversation?.messages.reverse() || [] });
    } catch (error: any) {
      console.error('[Get Support Messages Error]:', error);
      res.status(500).json({ success: false, message: 'ไม่สามารถโหลดข้อความถึง Admin ได้' });
    }
  }

  public static async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    const content = parseMessage(req.body);
    if (!content) {
      res.status(400).json({ success: false, message: `ข้อความต้องมี 1-${MESSAGE_LIMIT} ตัวอักษร` });
      return;
    }

    try {
      const message = await prisma.$transaction(async (tx) => {
        const conversation = await tx.supportConversation.upsert({
          where: { userId: req.user!.id },
          create: { userId: req.user!.id },
          update: {},
        });
        const createdMessage = await tx.supportMessage.create({
          data: { conversationId: conversation.id, senderId: req.user!.id, content },
          include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
        });
        await tx.supportConversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date(), isResolved: false },
        });
        return createdMessage;
      });
      res.status(201).json({ success: true, message });
    } catch (error: any) {
      console.error('[Send Support Message Error]:', error);
      res.status(500).json({ success: false, message: 'ไม่สามารถส่งข้อความถึง Admin ได้' });
    }
  }

  public static async getAdminConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const isResolved = req.query.resolved === 'true';
      const conversations = await prisma.supportConversation.findMany({
        where: { isResolved, messages: { some: {} } },
        orderBy: { updatedAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, studentId: true, avatarUrl: true, isBanned: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
          },
        },
      });
      res.json({
        success: true,
        conversations: conversations.map(({ messages, ...conversation }) => ({
          ...conversation,
          latestMessage: messages[0] || null,
        })),
      });
    } catch (error: any) {
      console.error('[Get Admin Support Conversations Error]:', error);
      res.status(500).json({ success: false, message: 'ไม่สามารถโหลดรายการติดต่อ Admin ได้' });
    }
  }

  public static async getAdminMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const conversation = await prisma.supportConversation.findUnique({
        where: { userId: req.params.userId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: MESSAGE_HISTORY_LIMIT,
            include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
          },
        },
      });
      if (!conversation) {
        res.status(404).json({ success: false, message: 'ไม่พบข้อความติดต่อ Admin' });
        return;
      }
      res.json({ success: true, messages: conversation.messages.reverse() });
    } catch (error: any) {
      console.error('[Get Admin Support Messages Error]:', error);
      res.status(500).json({ success: false, message: 'ไม่สามารถโหลดข้อความติดต่อ Admin ได้' });
    }
  }

  public static async sendAdminMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    const content = parseMessage(req.body);
    if (!content) {
      res.status(400).json({ success: false, message: `ข้อความต้องมี 1-${MESSAGE_LIMIT} ตัวอักษร` });
      return;
    }

    try {
      const conversation = await prisma.supportConversation.findUnique({
        where: { userId: req.params.userId },
        select: { id: true },
      });
      if (!conversation) {
        res.status(404).json({ success: false, message: 'ไม่พบข้อความติดต่อ Admin' });
        return;
      }
      const message = await prisma.$transaction(async (tx) => {
        const createdMessage = await tx.supportMessage.create({
          data: { conversationId: conversation.id, senderId: req.user!.id, content },
          include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
        });
        await tx.supportConversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        });
        return createdMessage;
      });
      res.status(201).json({ success: true, message });
    } catch (error: any) {
      console.error('[Send Admin Support Message Error]:', error);
      res.status(500).json({ success: false, message: 'ไม่สามารถส่งข้อความตอบกลับได้' });
    }
  }

  public static async setConversationResolved(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { isResolved } = req.body;
    if (typeof isResolved !== 'boolean') {
      res.status(400).json({ success: false, message: 'สถานะบทสนทนาไม่ถูกต้อง' });
      return;
    }

    try {
      const result = await prisma.supportConversation.updateMany({
        where: { userId: req.params.userId },
        data: { isResolved, updatedAt: new Date() },
      });
      if (result.count === 0) {
        res.status(404).json({ success: false, message: 'ไม่พบบทสนทนานี้' });
        return;
      }
      res.json({
        success: true,
        message: isResolved ? 'ทำเครื่องหมายว่าแก้ไขแล้ว' : 'เปิดบทสนทนาอีกครั้งแล้ว',
      });
    } catch (error: any) {
      console.error('[Update Admin Support Conversation Status Error]:', error);
      res.status(500).json({ success: false, message: 'ไม่สามารถอัปเดตสถานะบทสนทนาได้' });
    }
  }
}
