// 认证相关类型
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  roles: UserRole[];
  permissions: Permission[];
  isActive: boolean;
  lastLoginAt?: Date;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  twoFactorCode?: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  inviteCode?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface TwoFactorSetupResponse {
  qrCode: string;
  secret: string;
  backupCodes: string[];
}

export interface TwoFactorVerifyRequest {
  code: string;
}

// OAuth 相关类型
export interface OAuthProvider {
  name: string;
  clientId: string;
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
}

export interface OAuthCallback {
  code: string;
  state: string;
  provider: string;
}

export interface OAuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: string;
}

// JWT 相关类型
export interface JWTPayload {
  sub: string; // user id
  email: string;
  username: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// 会话相关类型
export interface Session {
  id: string;
  userId: string;
  deviceInfo: DeviceInfo;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  createdAt: Date;
  lastAccessAt: Date;
  expiresAt: Date;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  version: string;
}

// 权限检查相关
export interface PermissionCheck {
  resource: string;
  action: string;
  context?: Record<string, unknown>;
}

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
}

// 企业版特有的认证类型
export interface EnterpriseAuthConfig {
  ssoEnabled: boolean;
  samlConfig?: SAMLConfig;
  ldapConfig?: LDAPConfig;
  oidcConfig?: OIDCConfig;
}

export interface SAMLConfig {
  entityId: string;
  ssoUrl: string;
  certificate: string;
  attributeMapping: Record<string, string>;
}

export interface LDAPConfig {
  host: string;
  port: number;
  baseDN: string;
  bindDN: string;
  bindPassword: string;
  userSearchFilter: string;
  attributeMapping: Record<string, string>;
}

export interface OIDCConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}