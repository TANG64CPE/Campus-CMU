import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { prisma } from '../lib/prisma';
import { User } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface JwtPayload {
  id: string;
  studentId: string;
  email: string;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Read token from HTTP-only cookie or Bearer Authorization header
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (!token) {
      res.status(401).json({ success: false, message: 'Authentication required. Please log in with CMU Account.' });
      return;
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'User not found in system.' });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({
        success: false,
        message: 'Account banned due to ghosting or policy violations.',
        isBanned: true,
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }
};

/**
 * Optional auth: populates req.user if token is present, does not fail if not
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (token) {
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (user && !user.isBanned) {
        req.user = user;
      }
    }
    next();
  } catch {
    next();
  }
};

/**
 * Require admin role
 */
export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    return;
  }

  const isAdmin =
    req.user.role === 'ADMIN' ||
    req.user.studentId === 'ADMIN001' ||
    req.user.email === 'admin_cpe@cmu.ac.th' ||
    req.user.email === 'wichai.t@cmu.ac.th' ||
    req.user.email === 'supaporn.k@cmu.ac.th';

  if (!isAdmin) {
    res.status(403).json({
      success: false,
      message: 'Access denied: Admin privileges required.',
    });
    return;
  }

  next();
};
