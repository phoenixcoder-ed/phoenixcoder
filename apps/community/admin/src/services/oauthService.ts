/**
 * OAuth 服务
 * 处理第三方登录认证
 */

import { OAUTH_ENDPOINTS, AVATAR_SERVICES } from '@/config/oauth';
import { apiClient } from '@/services/api';
import { logger } from '@/shared/utils/logger';

// OAuth 提供商类型
export type OAuthProvider = 'github' | 'wechat' | 'google';

// OAuth 配置接口
interface OAuthConfig {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scope?: string;
}

// OAuth 用户信息接口
export interface OAuthUserInfo {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: OAuthProvider;
  raw?: unknown; // 原始用户数据
}

// OAuth 认证响应接口
export interface OAuthAuthResponse {
  access_token: string;
  token_type: string;
  scope?: string;
  expires_in?: number;
  refresh_token?: string;
}

/**
 * OAuth 服务类
 */
class OAuthService {
  private configs: Record<OAuthProvider, OAuthConfig>;

  constructor() {
    this.configs = {
      github: {
        clientId: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
        clientSecret: import.meta.env.VITE_GITHUB_CLIENT_SECRET || '',
        redirectUri: import.meta.env.VITE_GITHUB_REDIRECT_URI || '',
        scope: 'user:email',
      },
      wechat: {
        clientId: import.meta.env.VITE_WECHAT_APP_ID || '',
        clientSecret: import.meta.env.VITE_WECHAT_APP_SECRET || '',
        redirectUri: import.meta.env.VITE_WECHAT_REDIRECT_URI || '',
        scope: 'snsapi_login',
      },
      google: {
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
        clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
        redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI || '',
        scope: 'openid email profile',
      },
    };
  }

  /**
   * 获取OAuth授权URL
   */
  getAuthUrl(provider: OAuthProvider, state?: string): string {
    const config = this.configs[provider];

    if (!config.clientId) {
      throw new Error(`${provider} OAuth 配置不完整`);
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      state: state || this.generateState(),
    });

    if (config.scope) {
      params.append('scope', config.scope);
    }

    switch (provider) {
      case 'github':
        return `${OAUTH_ENDPOINTS.github.authorize}?${params.toString()}`;

      case 'wechat':
        // 微信扫码登录
        params.set('appid', config.clientId);
        params.delete('client_id');
        return `${OAUTH_ENDPOINTS.wechat.authorize}?${params.toString()}#wechat_redirect`;

      case 'google':
        return `${OAUTH_ENDPOINTS.google.authorize}?${params.toString()}`;

      default:
        throw new Error(`不支持的OAuth提供商: ${provider}`);
    }
  }

  /**
   * 处理OAuth回调
   */
  async handleCallback(
    provider: OAuthProvider,
    code: string
  ): Promise<OAuthUserInfo> {
    try {
      // 1. 交换访问令牌
      const tokenResponse = await this.exchangeCodeForToken(provider, code);

      // 2. 获取用户信息
      const userInfo = await this.getUserInfo(
        provider,
        tokenResponse.access_token
      );

      // 3. 调用后端API进行OAuth登录
      await apiClient.post('/auth/oauth/login', {
        provider,
        user_info: userInfo,
        access_token: tokenResponse.access_token,
      });

      return {
        ...userInfo,
        provider,
      };
    } catch (error) {
      logger.error(`${provider} OAuth 回调处理失败:`, error);
      throw error;
    }
  }

  /**
   * 交换授权码为访问令牌
   */
  private async exchangeCodeForToken(
    provider: OAuthProvider,
    code: string
  ): Promise<OAuthAuthResponse> {
    const config = this.configs[provider];

    switch (provider) {
      case 'github':
        return this.exchangeGitHubToken(code, config);

      case 'wechat':
        return this.exchangeWeChatToken(code, config);

      case 'google':
        return this.exchangeGoogleToken(code, config);

      default:
        throw new Error(`不支持的OAuth提供商: ${provider}`);
    }
  }

  /**
   * GitHub 令牌交换
   */
  private async exchangeGitHubToken(
    code: string,
    config: OAuthConfig
  ): Promise<OAuthAuthResponse> {
    const response = await fetch(OAUTH_ENDPOINTS.github.token, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error('GitHub 令牌交换失败');
    }

    return response.json();
  }

  /**
   * 微信令牌交换
   */
  private async exchangeWeChatToken(
    code: string,
    config: OAuthConfig
  ): Promise<OAuthAuthResponse> {
    const params = new URLSearchParams({
      appid: config.clientId,
      secret: config.clientSecret!,
      code,
      grant_type: 'authorization_code',
    });

    const response = await fetch(
      `${OAUTH_ENDPOINTS.wechat.token}?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error('微信令牌交换失败');
    }

    const data = await response.json();

    if (data.errcode) {
      throw new Error(`微信API错误: ${data.errmsg}`);
    }

    return data;
  }

  /**
   * Google 令牌交换
   */
  private async exchangeGoogleToken(
    code: string,
    config: OAuthConfig
  ): Promise<OAuthAuthResponse> {
    const response = await fetch(OAUTH_ENDPOINTS.google.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error('Google 令牌交换失败');
    }

    return response.json();
  }

  /**
   * 获取用户信息
   */
  private async getUserInfo(
    provider: OAuthProvider,
    accessToken: string
  ): Promise<Omit<OAuthUserInfo, 'provider'>> {
    switch (provider) {
      case 'github':
        return this.getGitHubUserInfo(accessToken);

      case 'wechat':
        return this.getWeChatUserInfo(accessToken);

      case 'google':
        return this.getGoogleUserInfo(accessToken);

      default:
        throw new Error(`不支持的OAuth提供商: ${provider}`);
    }
  }

  /**
   * 获取GitHub用户信息
   */
  private async getGitHubUserInfo(
    accessToken: string
  ): Promise<Omit<OAuthUserInfo, 'provider'>> {
    const response = await fetch(OAUTH_ENDPOINTS.github.userInfo, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error('获取GitHub用户信息失败');
    }

    const userData = await response.json();

    // 获取用户邮箱（如果公开）
    let email = userData.email;
    if (!email) {
      const emailResponse = await fetch(OAUTH_ENDPOINTS.github.userEmails, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (emailResponse.ok) {
        const emails = await emailResponse.json();
        const primaryEmail = emails.find(
          (e: { primary: boolean }) => e.primary
        );
        email = primaryEmail?.email || emails[0]?.email;
      }
    }

    return {
      id: userData.id.toString(),
      name: userData.name || userData.login,
      email: email || `${userData.login}@github.local`,
      avatar: userData.avatar_url,
      raw: userData,
    };
  }

  /**
   * 获取微信用户信息
   */
  private async getWeChatUserInfo(
    accessToken: string
  ): Promise<Omit<OAuthUserInfo, 'provider'>> {
    // 注意：这里需要openid，通常在令牌交换时一起返回
    // 为了简化，这里使用模拟数据
    // 实际项目中需要从令牌交换响应中获取openid
    const openid = 'mock_openid'; // 实际应该从令牌交换响应中获取

    const params = new URLSearchParams({
      access_token: accessToken,
      openid,
      lang: 'zh_CN',
    });

    const response = await fetch(
      `${OAUTH_ENDPOINTS.wechat.userInfo}?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error('获取微信用户信息失败');
    }

    const userData = await response.json();

    if (userData.errcode) {
      throw new Error(`微信API错误: ${userData.errmsg}`);
    }

    return {
      id: userData.openid,
      name: userData.nickname,
      email: `${userData.openid}@wechat.local`, // 微信不提供邮箱
      avatar: userData.headimgurl,
      raw: userData,
    };
  }

  /**
   * 获取Google用户信息
   */
  private async getGoogleUserInfo(
    accessToken: string
  ): Promise<Omit<OAuthUserInfo, 'provider'>> {
    const response = await fetch(OAUTH_ENDPOINTS.google.userInfo, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('获取Google用户信息失败');
    }

    const userData = await response.json();

    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      avatar: userData.picture,
      raw: userData,
    };
  }

  /**
   * 生成随机状态字符串
   */
  private generateState(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * 验证状态字符串
   */
  validateState(state: string, expectedState: string): boolean {
    return state === expectedState;
  }

  /**
   * 生成微信二维码登录URL
   */
  generateWeChatQRUrl(): string {
    const state = this.generateState();

    // 保存state到sessionStorage用于验证
    sessionStorage.setItem('wechat_oauth_state', state);

    return this.getAuthUrl('wechat', state);
  }

  /**
   * 检查OAuth配置是否完整
   */
  isConfigured(provider: OAuthProvider): boolean {
    const config = this.configs[provider];
    return !!(config.clientId && config.redirectUri);
  }

  /**
   * 微信特定方法
   */
  getWeChatQRUrl(): string {
    if (!this.isConfigured('wechat'))
      throw new Error('WeChat OAuth not configured');

    // 生成微信二维码登录URL
    const params = new URLSearchParams({
      appid: this.configs.wechat.clientId,
      redirect_uri: this.configs.wechat.redirectUri,
      response_type: 'code',
      scope: 'snsapi_login',
      state: this.generateState(),
    });

    return `${OAUTH_ENDPOINTS.wechat.authorize}?${params.toString()}#wechat_redirect`;
  }

  async checkWeChatQRStatus(): Promise<'waiting' | 'scanned' | 'confirmed'> {
    // 在实际项目中，这里应该调用微信API检查二维码状态
    // 目前返回模拟状态
    const random = Math.random();
    if (random < 0.3) return 'waiting';
    if (random < 0.7) return 'scanned';
    return 'confirmed';
  }

  async handleWeChatCallback(): Promise<{
    id: string;
    name: string;
    email: string;
    username: string;
    avatar: string;
    provider: string;
    token: string;
  }> {
    // 在实际项目中，这里应该处理微信回调并获取用户信息
    // 目前返回模拟用户数据
    return {
      id: 'wechat_123456',
      name: '微信用户',
      email: 'wechat.user@example.com',
      username: 'wechat_user',
      avatar: `${AVATAR_SERVICES.dicebear}?seed=WeChat`,
      provider: 'wechat',
      token: 'wechat-jwt-token-' + Date.now(),
    };
  }
}

// 导出单例实例
export const oauthService = new OAuthService();
