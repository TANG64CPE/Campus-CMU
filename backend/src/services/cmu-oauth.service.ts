import axios from 'axios';
import { ENV } from '../config/env';

export interface CmuBasicInfoResponse {
  cmuitaccount_name: string;
  cmuitaccount: string;
  student_id?: string;
  prename_TH?: string;
  firstname_TH?: string;
  lastname_TH?: string;
  prename_EN?: string;
  firstname_EN?: string;
  lastname_EN?: string;
  organization_name_TH?: string;
  organization_name_EN?: string;
  itaccounttype_id?: string;
  itaccounttype_TH?: string;
}

export class CmuOAuthService {
  private static AUTH_URL = 'https://oauth.cmu.ac.th/v1/Authorize.aspx';
  private static TOKEN_URL = 'https://oauth.cmu.ac.th/v1/GetToken.aspx';
  private static BASIC_INFO_URL = 'https://misapi.cmu.ac.th/cmuitaccount/v1/api/basic-info';

  /**
   * Generates authorization URL for CMU OAuth redirect
   */
  public static getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: ENV.CMU_OAUTH_CLIENT_ID,
      redirect_uri: ENV.CMU_OAUTH_REDIRECT_URI,
      scope: 'cmuitaccount.basicinfo',
    });
    return `${this.AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchanges authorization code for CMU access token
   */
  public static async exchangeCodeForToken(code: string): Promise<string> {
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('redirect_uri', ENV.CMU_OAUTH_REDIRECT_URI);
    params.append('client_id', ENV.CMU_OAUTH_CLIENT_ID);
    params.append('client_secret', ENV.CMU_OAUTH_CLIENT_SECRET);
    params.append('grant_type', 'authorization_code');

    const response = await axios.post<{ access_token: string }>(
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
      throw new Error('Failed to retrieve CMU access token');
    }

    return response.data.access_token;
  }

  /**
   * Fetches CMU student basic profile using access token
   */
  public static async getStudentProfile(accessToken: string): Promise<CmuBasicInfoResponse> {
    const response = await axios.get<CmuBasicInfoResponse>(this.BASIC_INFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: 10000,
    });

    return response.data;
  }
}
