import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { prisma } from '../lib/prisma';
import { CmuOAuthService } from '../services/cmu-oauth.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class AuthController {
  /**
   * GET /api/auth/cmu
   * Redirects user to CMU OAuth 2.0 authorization page
   */
  public static initiateCmuLogin(_req: Request, res: Response): void {
    const authUrl = CmuOAuthService.getAuthorizationUrl();
    res.redirect(authUrl);
  }

  /**
   * GET /api/auth/cmu/callback
   * Handles callback from CMU OAuth, exchanges token, gets profile, sets JWT cookie
   */
  public static async handleCmuCallback(req: Request, res: Response): Promise<void> {
    const code = req.query.code as string;

    if (!code) {
      res.redirect(`${ENV.FRONTEND_URL}/login?error=missing_code`);
      return;
    }

    try {
      // 1. Exchange code for CMU access token
      const accessToken = await CmuOAuthService.exchangeCodeForToken(code);

      // 2. Fetch student profile
      const profile = await CmuOAuthService.getStudentProfile(accessToken);

      const studentId = profile.student_id || profile.cmuitaccount;
      const email = profile.cmuitaccount_name || `${profile.cmuitaccount}@cmu.ac.th`;
      const name =
        profile.firstname_TH && profile.lastname_TH
          ? `${profile.firstname_TH} ${profile.lastname_TH}`
          : profile.firstname_EN && profile.lastname_EN
          ? `${profile.firstname_EN} ${profile.lastname_EN}`
          : profile.cmuitaccount;

      // 3. Upsert User in database
      const user = await prisma.user.upsert({
        where: { studentId },
        update: {
          name,
          email,
        },
        create: {
          studentId,
          email,
          name,
        },
      });

      if (user.isBanned) {
        res.redirect(`${ENV.FRONTEND_URL}/login?error=account_banned`);
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
        secure: ENV.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.redirect(`${ENV.FRONTEND_URL}/?login=success`);
    } catch (error: any) {
      console.error('[CMU OAuth Callback Error]:', error.message);
      res.redirect(`${ENV.FRONTEND_URL}/login?error=auth_failed`);
    }
  }

  /**
   * POST /api/auth/mock-login
   * Developer login for seamless local testing without CMU Intranet API credentials
   */
  public static async mockLogin(req: Request, res: Response): Promise<void> {
    if (!ENV.ENABLE_MOCK_AUTH) {
      res.status(403).json({ success: false, message: 'Mock authentication is disabled in this environment.' });
      return;
    }

    const { studentId, name, email, contactInfo } = req.body;

    // Default mock identity if none provided
    const targetStudentId = studentId || '650610001';
    const targetEmail = email || `student_${targetStudentId}@cmu.ac.th`;
    const targetName = name || `นักศึกษา มช. (${targetStudentId})`;

    try {
      const user = await prisma.user.upsert({
        where: { studentId: targetStudentId },
        update: {
          name: targetName,
          email: targetEmail,
          ...(contactInfo ? { contactInfo } : {}),
        },
        create: {
          studentId: targetStudentId,
          email: targetEmail,
          name: targetName,
          contactInfo: contactInfo || 'Line: @cmu_test | Tel: 081-234-5678',
        },
      });

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
        secure: ENV.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.json({
        success: true,
        message: 'Mock login successful',
        user,
        token, // provided for programmatic / testing access as well
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/auth/me
   * Return currently logged in user info
   */
  public static async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    res.json({
      success: true,
      user: req.user,
    });
  }

  /**
   * POST /api/auth/logout
   * Clears HTTP-only session cookie
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
