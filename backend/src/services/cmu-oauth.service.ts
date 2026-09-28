import axios from 'axios';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

export interface CmuProfileResponse {
  email: string;
  name: string;
  studentId: string;
  raw?: any;
}

export class CmuOAuthService {
  private static AUTH_URL = 'https://oauth497.cpecmu.com/application/o/authorize/';
  private static TOKEN_URL = 'https://oauth497.cpecmu.com/application/o/token/';
  private static USERINFO_URL = 'https://oauth497.cpecmu.com/application/o/userinfo/';

  /**
   * Generates authorization URL for CPE OAuth redirect
   */
  public static getAuthorizationUrl(redirectUri?: string): string {
    const targetRedirectUri = redirectUri || ENV.CMU_OAUTH_REDIRECT_URI || 'http://localhost:5173/api/auth/callback';
    const params = new URLSearchParams({
      client_id: ENV.CMU_OAUTH_CLIENT_ID,
      redirect_uri: targetRedirectUri,
      response_type: 'code',
      scope: 'openid profile email basic_info',
    });
    return `${this.AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchanges authorization code for CPE access token & id_token
   */
  public static async exchangeCodeForToken(
    code: string,
    redirectUri?: string
  ): Promise<{ accessToken: string; idToken?: string }> {
    const targetRedirectUri = redirectUri || ENV.CMU_OAUTH_REDIRECT_URI || 'http://localhost:5173/api/auth/callback';
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', ENV.CMU_OAUTH_CLIENT_ID);
    params.append('client_secret', ENV.CMU_OAUTH_CLIENT_SECRET);
    params.append('code', code);
    params.append('redirect_uri', targetRedirectUri);

    console.log(`[CPE OAuth] Exchanging code with token URL: ${this.TOKEN_URL}, redirect_uri: ${targetRedirectUri}`);

    const response = await axios.post<{ access_token: string; id_token?: string }>(
      this.TOKEN_URL,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000,
      }
    );

    if (!response.data.access_token) {
      throw new Error('Failed to retrieve CPE OAuth access token');
    }

    return {
      accessToken: response.data.access_token,
      idToken: response.data.id_token,
    };
  }

  /**
   * Fetches user profile from userinfo endpoint or decodes id_token
   */
  public static async getStudentProfile(
    accessToken: string,
    idToken?: string
  ): Promise<CmuProfileResponse> {
    let data: any = {};

    try {
      const response = await axios.get(this.USERINFO_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 10000,
      });
      data = response.data;
      console.log('[CPE OAuth] Fetched userinfo data successfully:', JSON.stringify(data));
    } catch (err: any) {
      console.warn('[CPE OAuth] Userinfo endpoint call failed, falling back to id_token:', err.message);
      if (idToken) {
        data = jwt.decode(idToken) || {};
        console.log('[CPE OAuth] Decoded id_token payload:', JSON.stringify(data));
      }
    }

    // Extract email
    const email =
      data.email ||
      (data.preferred_username && data.preferred_username.includes('@') ? data.preferred_username : '');

    // Extract studentId: check student_id field, preferred_username, or from email if student
    let studentId = data.student_id || data.studentId || '';
    if (!studentId && data.preferred_username && /^\d+$/.test(data.preferred_username)) {
      studentId = data.preferred_username;
    }
    if (!studentId && email) {
      const prefix = email.split('@')[0];
      if (/^\d+$/.test(prefix)) {
        studentId = prefix;
      } else {
        studentId = prefix; // e.g. wichai.t or supaporn.k
      }
    }
    if (!studentId) {
      studentId = data.sub || `cmu_${Date.now()}`;
    }

    // Extract name
    const name = data.name || data.given_name || data.preferred_username || email || 'CMU Student';

    return {
      email,
      name,
      studentId,
      raw: data,
    };
  }
}
