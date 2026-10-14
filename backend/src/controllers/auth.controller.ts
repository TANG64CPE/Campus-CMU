import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { prisma } from '../lib/prisma';
import { CmuOAuthService } from '../services/cmu-oauth.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { isProfileContactComplete } from '../utils/userValidation';
import { ADMIN_ROLES, ADMIN_ROLE_SLOTS, isAdminRole, isNumberedAdminRole } from '../utils/roles';

export class AuthController {
  private static async getAvailableAdminRole(preferredRole?: string, excludeUserId?: string): Promise<string | null> {
    const admins = await prisma.user.findMany({
      where: {
        role: { in: [...ADMIN_ROLES] },
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
      select: { role: true },
    });
    if (admins.length >= ADMIN_ROLE_SLOTS.length) return null;

    const usedSlots = new Set(admins.map((admin) => admin.role).filter(isNumberedAdminRole));
    if (isNumberedAdminRole(preferredRole) && !usedSlots.has(preferredRole)) return preferredRole;
    return ADMIN_ROLE_SLOTS.find((slot) => !usedSlots.has(slot)) || null;
  }

  /**
   * Helper to detect redirect URI dynamically based on request origin
   */
  private static getDynamicRedirectUri(req: Request): { redirectUri: string; frontendUrl: string } {
    const host = req.headers.host || '';
    const referer = (req.headers.referer as string) || '';

    if (host.includes('3000') || referer.includes('3000')) {
      return {
        redirectUri: 'http://localhost:3000/api/auth/callback',
        frontendUrl: 'http://localhost:3000',
      };
    }

    if (host.includes('8000') || referer.includes('8000')) {
      return {
        redirectUri: 'http://localhost:8000/api/auth/callback',
        frontendUrl: 'http://localhost:8000',
      };
    }

    // Default to port 5173 (standard Vite development port)
    return {
      redirectUri: ENV.CMU_OAUTH_REDIRECT_URI || 'http://localhost:5173/api/auth/callback',
      frontendUrl: ENV.FRONTEND_URL || 'http://localhost:5173',
    };
  }

  /**
   * GET /api/auth/cmu or GET /api/auth/login
   * Redirects user to CPE CMU OAuth authorization page
   */
  public static initiateCmuLogin(req: Request, res: Response): void {
    const { redirectUri } = AuthController.getDynamicRedirectUri(req);
    const authUrl = CmuOAuthService.getAuthorizationUrl(redirectUri);
    console.log(`[CPE OAuth] Redirecting to authorization URL: ${authUrl}`);
    res.redirect(authUrl);
  }

  /**
   * GET /api/auth/callback or GET /api/auth/cmu/callback
   * Handles callback from CPE OAuth, exchanges token, gets student profile, sets JWT cookie
   */
  public static async handleCmuCallback(req: Request, res: Response): Promise<void> {
    const code = req.query.code as string;
    const { redirectUri, frontendUrl } = AuthController.getDynamicRedirectUri(req);

    if (!code) {
      console.warn('[CPE OAuth Callback] Missing authorization code in query params');
      res.redirect(`${frontendUrl}/login?error=missing_code`);
      return;
    }

    try {
      console.log(`[CPE OAuth Callback] Received code: ${code.substring(0, 10)}...`);

      // 1. Exchange authorization code for token
      const { accessToken, idToken } = await CmuOAuthService.exchangeCodeForToken(code, redirectUri);

      // 2. Fetch user profile
      const profile = await CmuOAuthService.getStudentProfile(accessToken, idToken);
      console.log(`[CPE OAuth Callback] Authenticated user: ${profile.name} (${profile.email}, ID: ${profile.studentId})`);

      // 3. Upsert User in database safely
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: profile.email },
            { studentId: profile.studentId },
          ],
        },
      });

      const ADMIN_EMAILS = ['admin_cpe@cmu.ac.th', 'wichai.t@cmu.ac.th', 'supaporn.k@cmu.ac.th'];
      const adminEmailIndex = ADMIN_EMAILS.indexOf(profile.email.toLowerCase());
      const preferredAdminRole = adminEmailIndex >= 0
        ? ADMIN_ROLE_SLOTS[adminEmailIndex]
        : profile.studentId === 'ADMIN001' ? ADMIN_ROLE_SLOTS[0] : undefined;
      const isDefaultAdmin = preferredAdminRole !== undefined;

      if (user) {
        let role = user.role;
        if (isDefaultAdmin && (!isAdminRole(role) || role === 'ADMIN')) {
          role = await AuthController.getAvailableAdminRole(preferredAdminRole, user.id)
            || (role === 'ADMIN' ? 'STUDENT' : role);
        }
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: profile.name || user.name,
            email: profile.email || user.email,
            ...(role !== user.role ? { role } : {}),
          },
        });
      } else {
        const role = isDefaultAdmin
          ? await AuthController.getAvailableAdminRole(preferredAdminRole) || 'STUDENT'
          : 'STUDENT';
        user = await prisma.user.create({
          data: {
            studentId: profile.studentId,
            email: profile.email,
            name: profile.name,
            role,
          },
        });
      }

      if (user.isBanned) {
        console.warn(`[CPE OAuth Callback] User ${user.email} is banned`);
        res.redirect(`${frontendUrl}/login?error=account_banned`);
        return;
      }

      // 4. Generate JWT
      const token = jwt.sign(
        { id: user.id, studentId: user.studentId, email: user.email },
        ENV.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // 5. Set HTTP-Only Cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: false, // allow http in localhost
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      console.log(`[CPE OAuth Callback] Login successful! Redirecting to ${frontendUrl}/?login=success`);
      res.redirect(`${frontendUrl}/?login=success`);
    } catch (error: any) {
      console.error('[CPE OAuth Callback Error]:', error.response?.data || error.message);
      res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
  }

  /**
   * POST /api/auth/mock-login
   * Developer login for local testing
   */
  public static async mockLogin(req: Request, res: Response): Promise<void> {
    if (!ENV.ENABLE_MOCK_AUTH) {
      res.status(403).json({ success: false, message: 'Mock authentication is disabled in this environment.' });
      return;
    }

    const { studentId, name, email, contactInfo, role } = req.body;

    const targetStudentId = studentId || '650610001';
    const targetEmail = email || `student_${targetStudentId}@cmu.ac.th`;
    const targetName = name || `นักศึกษา มช. (${targetStudentId})`;
    const inferredRole = targetStudentId === 'ADMIN001' || targetEmail.toLowerCase().includes('admin') ? 'ADMIN' : undefined;
    const requestedRole = role === 'STUDENT' || isAdminRole(role) ? role : inferredRole;

    try {
      let user = await prisma.user.findFirst({
        where: {
          OR: [{ studentId: targetStudentId }, { email: targetEmail }],
        },
      });

      let assignedRole = requestedRole || user?.role || 'STUDENT';
      if (requestedRole && isAdminRole(requestedRole)) {
        if (user && isAdminRole(user.role)) {
          assignedRole = user.role;
        } else {
          const preferredRole = isNumberedAdminRole(requestedRole) ? requestedRole : undefined;
          const availableRole = await AuthController.getAvailableAdminRole(preferredRole, user?.id);
          if (!availableRole) {
            res.status(409).json({ success: false, message: 'กำหนดผู้ดูแลระบบได้สูงสุด 3 บัญชี' });
            return;
          }
          assignedRole = availableRole;
        }
      }

      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: targetName,
            email: targetEmail,
            ...(contactInfo ? { contactInfo } : {}),
            role: assignedRole,
          },
        });
      } else {
        user = await prisma.user.create({
          data: {
            studentId: targetStudentId,
            email: targetEmail,
            name: targetName,
            contactInfo: contactInfo || 'Line: @cmu_test | Tel: 081-234-5678',
            role: assignedRole,
          },
        });
      }

      if (user.isBanned) {
        res.status(403).json({ success: false, message: 'This mock student account is banned.' });
        return;
      }

      const token = jwt.sign(
        { id: user.id, studentId: user.studentId, email: user.email },
        ENV.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.json({
        success: true,
        message: 'Mock login successful',
        user: {
          ...user,
          hasCompletedContact: isProfileContactComplete(user),
        },
        token,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/auth/me
   */
  public static async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    res.json({
      success: true,
      user: {
        ...req.user,
        hasCompletedContact: isProfileContactComplete(req.user),
      },
    });
  }

  /**
   * POST /api/auth/logout
   */
  public static logout(_req: Request, res: Response): void {
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
    res.json({ success: true, message: 'Logged out successfully' });
  }
}
