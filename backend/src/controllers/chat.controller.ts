import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const MESSAGE_LIMIT = 2000;
const MESSAGE_HISTORY_LIMIT = 100;

async function getAuthorizedReservation(reservationId: string, userId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { product: { select: { sellerId: true } } },
  });

  if (!reservation) return { reservation: null, forbidden: false };
  const isParticipant = reservation.buyerId === userId || reservation.product.sellerId === userId;
  return { reservation, forbidden: !isParticipant };
}

export class ChatController {
  public static async getMyThreads(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const reservations = await prisma.reservation.findMany({
        where: {
          status: 'PENDING',
          OR: [{ buyerId: userId }, { product: { sellerId: userId } }],
        },
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              seller: { select: { id: true, name: true } },
            },
          },
          buyer: { select: { id: true, name: true } },
          chatMessages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
          },
        },
      });

      const threads = reservations.map((reservation) => ({
        id: reservation.id,
        product: {
          id: reservation.product.id,
          title: reservation.product.title,
          imageUrl: reservation.product.imageUrl,
        },
        otherParticipant: reservation.buyerId === userId
          ? reservation.product.seller
          : reservation.buyer,
        latestMessage: reservation.chatMessages[0] || null,
      }));

      res.json({ success: true, threads });
    } catch (error: any) {
      console.error('[Get Chat Threads Error]:', error);
      res.status(500).json({ success: false, message: 'Unable to load chats.' });
    }
  }

  public static async getMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reservation, forbidden } = await getAuthorizedReservation(req.params.id, req.user!.id);
      if (!reservation) {
        res.status(404).json({ success: false, message: 'Reservation not found.' });
        return;
      }
      if (forbidden) {
        res.status(403).json({ success: false, message: 'Only the buyer and seller can access this chat.' });
        return;
      }
      if (reservation.status === 'CANCELLED') {
        res.status(403).json({ success: false, message: 'Chat is unavailable for a cancelled reservation.' });
        return;
      }

      const messages = await prisma.chatMessage.findMany({
        where: { reservationId: reservation.id },
        orderBy: { createdAt: 'desc' },
        take: MESSAGE_HISTORY_LIMIT,
        include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
      });

      res.json({ success: true, messages: messages.reverse() });
    } catch (error: any) {
      console.error('[Get Chat Messages Error]:', error);
      res.status(500).json({ success: false, message: 'Unable to load chat messages.' });
    }
  }

  public static async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reservation, forbidden } = await getAuthorizedReservation(req.params.id, req.user!.id);
      if (!reservation) {
        res.status(404).json({ success: false, message: 'Reservation not found.' });
        return;
      }
      if (forbidden) {
        res.status(403).json({ success: false, message: 'Only the buyer and seller can use this chat.' });
        return;
      }
      if (reservation.status !== 'PENDING') {
        res.status(403).json({ success: false, message: 'Chat is available while the reservation is pending.' });
        return;
      }

      const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
      if (!content) {
        res.status(400).json({ success: false, message: 'Message cannot be empty.' });
        return;
      }
      if (content.length > MESSAGE_LIMIT) {
        res.status(400).json({ success: false, message: `Message must be ${MESSAGE_LIMIT} characters or fewer.` });
        return;
      }

      const message = await prisma.chatMessage.create({
        data: { reservationId: reservation.id, senderId: req.user!.id, content },
        include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
      });
      res.status(201).json({ success: true, message });
    } catch (error: any) {
      console.error('[Send Chat Message Error]:', error);
      res.status(500).json({ success: false, message: 'Unable to send message.' });
    }
  }
}
