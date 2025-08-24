import { BaseService } from '../base/BaseService';
import { IService } from '../interfaces/IService';
import { ServiceError, ValidationError, ServiceErrorType } from '../types/ServiceError';
import { SecurityConfig } from '../types/ServiceConfig';
import { SERVICE_EVENTS } from '../types/ServiceConstants';
import { EventEmitter } from 'eventemitter3';
import { createHash, createHmac, randomBytes, createCipheriv, createDecipheriv, pbkdf2Sync } from 'crypto';

/**
 * 用户信息接口
 */
export interface UserInfo {
  id: string;
  username: string;
  email?: string;
  roles: string[];
  permissions: string[];
  metadata?: Record<string, unknown>;
  lastLogin?: Date;
  loginCount?: number;
  isActive?: boolean;
  isVerified?: boolean;
}

/**
 * 认证令牌接口
 */
export interface AuthToken {
  token: string;
  type: 'bearer' | 'jwt' | 'api_key' | 'session';
  expiresAt?: Date;
  issuedAt: Date;
  userId: string;
  scopes?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * 登录凭据接口
 */
export interface LoginCredentials {
  username?: string;
  email?: string;
  password: string;
  rememberMe?: boolean;
  captcha?: string;
  twoFactorCode?: string;
}

/**
 * 注册数据接口
 */
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  captcha?: string;
  agreeToTerms: boolean;
}

/**
 * 权限检查结果
 */
export interface PermissionResult {
  granted: boolean;
  reason?: string;
  requiredPermissions?: string[];
  userPermissions?: string[];
  context?: Record<string, unknown>;
}

/**
 * 安全审计日志
 */
export interface SecurityAuditLog {
  id: string;
  timestamp: Date;
  userId?: string;
  action: string;
  resource?: string;
  result: 'success' | 'failure' | 'warning';
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * 加密选项
 */
export interface EncryptionOptions {
  algorithm?: string;
  key?: string;
  iv?: Buffer;
  encoding?: 'hex' | 'base64';
}

/**
 * 哈希选项
 */
export interface HashOptions {
  algorithm?: string;
  salt?: string;
  iterations?: number;
  keyLength?: number;
  encoding?: 'hex' | 'base64';
}

/**
 * 密码策略
 */
export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  forbiddenPasswords: string[];
  maxAge?: number; // 密码最大有效期（天）
  historyCount?: number; // 不能重复使用的历史密码数量
}



/**
 * 安全统计信息
 */
export interface SecurityStats {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  totalLogins: number;
  failedLogins: number;
  securityIncidents: number;
  auditLogs: number;
  lastSecurityScan?: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * 安全事件接口
 */
export interface SecurityEvents {
  'auth:login': (user: UserInfo, token: AuthToken) => void;
  'auth:logout': (userId: string, reason?: string) => void;
  'auth:register': (user: UserInfo) => void;
  'auth:failed': (credentials: Partial<LoginCredentials>, reason: string) => void;
  'auth:locked': (userId: string, reason: string) => void;
  'auth:unlocked': (userId: string) => void;
  'permission:granted': (userId: string, permission: string, resource?: string) => void;
  'permission:denied': (userId: string, permission: string, resource?: string) => void;
  'security:incident': (incident: SecurityAuditLog) => void;
  'security:scan': (results: Record<string, unknown>) => void;
  'token:created': (token: AuthToken) => void;
  'token:expired': (tokenId: string) => void;
  'token:revoked': (tokenId: string, reason?: string) => void;
  'password:changed': (userId: string) => void;
  'password:reset': (userId: string) => void;
  'security:error': (error: ServiceError) => void;
}

/**
 * 安全服务类
 */
export class SecurityService extends BaseService implements IService {
  private eventEmitter: EventEmitter<SecurityEvents>;
  private users: Map<string, UserInfo>;
  private tokens: Map<string, AuthToken>;
  private auditLogs: SecurityAuditLog[];
  private loginAttempts: Map<string, { count: number; lastAttempt: Date; lockedUntil?: Date }>;
  private securityConfig: SecurityConfig;
  private stats: SecurityStats;

  constructor(config: SecurityConfig) {
    super(config, 'SecurityService', '1.0.0');
    
    this.eventEmitter = new EventEmitter();
    this.users = new Map();
    this.tokens = new Map();
    this.auditLogs = [];
    this.loginAttempts = new Map();
    
    // 默认安全配置
    this.securityConfig = {
      passwordPolicy: {
        minLength: config.passwordPolicy?.minLength || 8,
        maxLength: config.passwordPolicy?.maxLength || 128,
        requireUppercase: config.passwordPolicy?.requireUppercase ?? true,
        requireLowercase: config.passwordPolicy?.requireLowercase ?? true,
        requireNumbers: config.passwordPolicy?.requireNumbers ?? true,
        requireSpecialChars: config.passwordPolicy?.requireSpecialChars ?? true,
        forbiddenPasswords: config.passwordPolicy?.forbiddenPasswords || ['password', '123456', 'admin'],
        maxAge: 90,
        historyCount: config.passwordPolicy?.historyCount || 5
      },
      // sessionTimeout: config.session?.timeout || 30, // 移除不存在的属性
      maxLoginAttempts: config.maxLoginAttempts || 5,
      lockoutDuration: config.lockoutDuration || 15,
      tokenExpiration: config.tokenExpiration || 24,
      enableTwoFactor: config.enableTwoFactor || false,
      // enableCaptcha: true, // 移除不存在的属性
      auditLogRetention: config.auditLogRetention || 90,
      encryptionKey: config.encryptionKey || this.generateKey(),
      jwtSecret: config.jwtSecret || this.generateKey()
    };
    
    // 初始化统计信息
    this.stats = {
      totalUsers: 0,
      activeUsers: 0,
      lockedUsers: 0,
      totalLogins: 0,
      failedLogins: 0,
      securityIncidents: 0,
      auditLogs: 0,
      riskLevel: 'low'
    };
  }

  /**
   * 初始化服务
   */
  protected override async onInitialize(): Promise<void> {
    // 启动定期清理任务
    this.startCleanupTasks();
    
    // 加载用户数据（如果有持久化存储）
    await this.loadUserData();
    
    // 更新统计信息
    this.updateStats();
  }

  /**
   * 销毁服务
   */
  protected override async onDestroy(): Promise<void> {
    this.eventEmitter.removeAllListeners();
    this.users.clear();
    this.tokens.clear();
    this.auditLogs = [];
    this.loginAttempts.clear();
  }

  /**
   * 健康检查
   */
  protected override async onHealthCheck(): Promise<Record<string, unknown>> {
    try {
      // 检查关键配置
      if (!this.securityConfig.encryptionKey || !this.securityConfig.jwtSecret) {
        return { success: false, status: 'unhealthy', error: 'Missing encryption key or JWT secret' };
      }
      
      // 检查服务状态
      const isHealthy = this.stats.riskLevel !== 'critical';
      return { success: isHealthy, status: isHealthy ? 'healthy' : 'unhealthy', riskLevel: this.stats.riskLevel };
    } catch (error) {
      return { success: false, status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 用户注册
   */
  async register(data: RegisterData): Promise<UserInfo> {
    try {
      // 验证注册数据
      this.validateRegisterData(data);
      
      // 检查用户是否已存在
      if (this.findUserByUsername(data.username) || this.findUserByEmail(data.email)) {
        throw new ValidationError('用户名或邮箱已存在', [{ field: 'username', message: '用户名或邮箱已存在', code: 'DUPLICATE_VALUE' }]);
      }
      
      // 验证密码策略
      this.validatePassword(data.password);
      
      // 创建用户
      const userId = this.generateId();
      const hashedPassword = await this.hashPassword(data.password);
      
      const user: UserInfo = {
        id: userId,
        username: data.username,
        email: data.email,
        roles: ['user'], // 默认角色
        permissions: ['read'], // 默认权限
        metadata: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          hashedPassword,
          createdAt: new Date(),
          emailVerified: false
        },
        isActive: true,
        isVerified: false,
        loginCount: 0
      };
      
      this.users.set(userId, user);
      
      // 记录审计日志
      await this.logSecurityEvent({
        action: 'user_register',
        userId,
        result: 'success',
        details: { username: data.username, email: data.email },
        riskLevel: 'low'
      });
      
      // 发射事件
      this.eventEmitter.emit('auth:register', user);
      this.emit(SERVICE_EVENTS.USER_REGISTERED, user);
      
      // 更新统计
      this.updateStats();
      
      return user;
    } catch (error) {
      const serviceError = new ServiceError({ message: '用户注册失败', code: 'REGISTER_ERROR', type: ServiceErrorType.BUSINESS_LOGIC, serviceName: 'SecurityService', operation: 'register', innerError: error instanceof Error ? error : undefined });
      this.eventEmitter.emit('security:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 用户登录
   */
  async login(credentials: LoginCredentials): Promise<{ user: UserInfo; token: AuthToken }> {
    try {
      const identifier = credentials.username || credentials.email;
      if (!identifier) {
        throw new ValidationError('用户名或邮箱不能为空', [{ field: 'credentials', message: '用户名或邮箱不能为空', code: 'REQUIRED_FIELD' }]);
      }
      
      // 检查登录尝试次数
      const attemptKey = identifier.toLowerCase();
      const attempts = this.loginAttempts.get(attemptKey);
      
      if (attempts?.lockedUntil && attempts.lockedUntil > new Date()) {
        const lockTimeLeft = Math.ceil((attempts.lockedUntil.getTime() - Date.now()) / 60000);
        throw new ValidationError(`账户已锁定，请 ${lockTimeLeft} 分钟后重试`, [{ field: 'account', message: `账户已锁定，请 ${lockTimeLeft} 分钟后重试`, code: 'ACCOUNT_LOCKED' }]);
      }
      
      // 查找用户
      const user = credentials.username 
        ? this.findUserByUsername(credentials.username)
        : this.findUserByEmail(credentials.email!);
      
      if (!user) {
        await this.recordFailedLogin(attemptKey, '用户不存在');
        throw new ValidationError('用户名或密码错误', [{ field: 'credentials', message: '用户名或密码错误', code: 'INVALID_CREDENTIALS' }]);
      }
      
      // 检查用户状态
      if (!user.isActive) {
        throw new ValidationError('账户已被禁用', [{ field: 'account', message: '账户已被禁用', code: 'ACCOUNT_DISABLED' }]);
      }
      
      // 验证密码
      const hashedPassword = user.metadata?.hashedPassword as string;
      if (!hashedPassword || !await this.verifyPassword(credentials.password, hashedPassword)) {
        await this.recordFailedLogin(attemptKey, '密码错误');
        throw new ValidationError('用户名或密码错误', [{ field: 'credentials', message: '用户名或密码错误', code: 'INVALID_CREDENTIALS' }]);
      }
      
      // 双因素认证检查
      if (this.securityConfig.enableTwoFactor && credentials.twoFactorCode) {
        if (!this.verifyTwoFactorCode(user.id, credentials.twoFactorCode)) {
          await this.recordFailedLogin(attemptKey, '双因素认证失败');
          throw new ValidationError('双因素认证码错误', [{ field: 'twoFactorCode', message: '双因素认证码错误', code: 'INVALID_2FA_CODE' }]);
        }
      }
      
      // 清除失败登录记录
      this.loginAttempts.delete(attemptKey);
      
      // 创建令牌
      const token = await this.createToken(user.id, ['read', 'write']);
      
      // 更新用户登录信息
      user.lastLogin = new Date();
      user.loginCount = (user.loginCount || 0) + 1;
      
      // 记录审计日志
      await this.logSecurityEvent({
        action: 'user_login',
        userId: user.id,
        result: 'success',
        details: { username: user.username },
        riskLevel: 'low'
      });
      
      // 发射事件
      this.eventEmitter.emit('auth:login', user, token);
      this.emit(SERVICE_EVENTS.USER_LOGIN, { user, token });
      
      // 更新统计
      this.updateStats();
      
      return { user, token };
    } catch (error) {
      const serviceError = error instanceof ServiceError ? error : 
        new ServiceError({ message: '用户登录失败', code: 'LOGIN_ERROR', type: ServiceErrorType.BUSINESS_LOGIC, serviceName: 'SecurityService', operation: 'login', innerError: error instanceof Error ? error : undefined });
      this.eventEmitter.emit('security:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 用户登出
   */
  async logout(tokenOrUserId: string, reason?: string): Promise<void> {
    try {
      let userId: string;
      
      // 判断是令牌还是用户ID
      const token = this.tokens.get(tokenOrUserId);
      if (token) {
        userId = token.userId;
        this.tokens.delete(tokenOrUserId);
        this.eventEmitter.emit('token:revoked', tokenOrUserId, reason);
      } else {
        userId = tokenOrUserId;
        // 撤销用户的所有令牌
        for (const [tokenId, token] of this.tokens.entries()) {
          if (token.userId === userId) {
            this.tokens.delete(tokenId);
            this.eventEmitter.emit('token:revoked', tokenId, reason);
          }
        }
      }
      
      // 记录审计日志
      await this.logSecurityEvent({
        action: 'user_logout',
        userId,
        result: 'success',
        details: { reason },
        riskLevel: 'low'
      });
      
      // 发射事件
      this.eventEmitter.emit('auth:logout', userId, reason);
      this.emit(SERVICE_EVENTS.USER_LOGOUT, { userId, reason });
    } catch (error) {
      const serviceError = new ServiceError({ message: '用户登出失败', code: 'LOGOUT_ERROR', type: ServiceErrorType.BUSINESS_LOGIC, serviceName: 'SecurityService', operation: 'logout', innerError: error instanceof Error ? error : undefined });
      this.eventEmitter.emit('security:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 验证令牌
   */
  async verifyToken(tokenString: string): Promise<{ valid: boolean; user?: UserInfo; token?: AuthToken }> {
    try {
      const token = this.tokens.get(tokenString);
      
      if (!token) {
        return { valid: false };
      }
      
      // 检查令牌是否过期
      if (token.expiresAt && token.expiresAt < new Date()) {
        this.tokens.delete(tokenString);
        this.eventEmitter.emit('token:expired', tokenString);
        return { valid: false };
      }
      
      // 获取用户信息
      const user = this.users.get(token.userId);
      if (!user || !user.isActive) {
        this.tokens.delete(tokenString);
        return { valid: false };
      }
      
      return { valid: true, user, token };
    } catch (error) {
      const serviceError = new ServiceError({ message: '令牌验证失败', code: 'TOKEN_VERIFY_ERROR', type: ServiceErrorType.BUSINESS_LOGIC, serviceName: 'SecurityService', operation: 'verifyToken', innerError: error instanceof Error ? error : undefined });
      this.eventEmitter.emit('security:error', serviceError);
      return { valid: false };
    }
  }

  /**
   * 检查权限
   */
  async checkPermission(
    userId: string, 
    permission: string, 
    resource?: string
  ): Promise<PermissionResult> {
    try {
      const user = this.users.get(userId);
      
      if (!user || !user.isActive) {
        return {
          granted: false,
          reason: '用户不存在或已禁用',
          requiredPermissions: [permission]
        };
      }
      
      // 检查用户权限
      const hasPermission = user.permissions.includes(permission) || 
                           user.permissions.includes('*') ||
                           this.checkRolePermissions(user.roles, permission);
      
      const result: PermissionResult = {
        granted: hasPermission,
        requiredPermissions: [permission],
        userPermissions: user.permissions,
        context: { resource, userId }
      };
      
      if (!hasPermission) {
        result.reason = '权限不足';
        
        // 记录权限拒绝事件
        await this.logSecurityEvent({
          action: 'permission_denied',
          userId,
          result: 'warning',
          details: { permission, resource },
          riskLevel: 'medium'
        });
        
        this.eventEmitter.emit('permission:denied', userId, permission, resource);
      } else {
        this.eventEmitter.emit('permission:granted', userId, permission, resource);
      }
      
      return result;
    } catch (error) {
      const serviceError = new ServiceError({ message: '权限检查失败', code: 'PERMISSION_CHECK_ERROR', type: ServiceErrorType.BUSINESS_LOGIC, serviceName: 'SecurityService', operation: 'checkPermission', innerError: error instanceof Error ? error : undefined });
      this.eventEmitter.emit('security:error', serviceError);
      return {
        granted: false,
        reason: '权限检查失败',
        requiredPermissions: [permission]
      };
    }
  }

  /**
   * 修改密码
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    try {
      const user = this.users.get(userId);
      if (!user) {
        throw new ValidationError('用户不存在', [{ field: 'userId', message: '用户不存在', code: 'USER_NOT_FOUND' }]);
      }
      
      // 验证旧密码
      const hashedPassword = user.metadata?.hashedPassword;
      if (!hashedPassword || !await this.verifyPassword(oldPassword, hashedPassword as string)) {
        throw new ValidationError('原密码错误', [{ field: 'currentPassword', message: '原密码错误', code: 'INVALID_PASSWORD' }]);
      }
      
      // 验证新密码策略
      this.validatePassword(newPassword);
      
      // 检查密码历史（如果启用）
      if (this.securityConfig.passwordPolicy?.historyCount) {
        const passwordHistory = user.metadata?.passwordHistory || [];
        for (const historicalPassword of passwordHistory as string[]) {
          if (await this.verifyPassword(newPassword, historicalPassword)) {
            throw new ValidationError('不能使用最近使用过的密码', [{ field: 'newPassword', message: '不能使用最近使用过的密码', code: 'PASSWORD_REUSED' }]);
          }
        }
      }
      
      // 更新密码
      const newHashedPassword = await this.hashPassword(newPassword);
      
      // 更新密码历史
      if (this.securityConfig.passwordPolicy?.historyCount) {
        const passwordHistory = (user.metadata?.passwordHistory as string[]) || [];
        passwordHistory.unshift(hashedPassword as string);
        if (passwordHistory.length > this.securityConfig.passwordPolicy.historyCount) {
          passwordHistory.pop();
        }
        if (!user.metadata) user.metadata = {};
        user.metadata.passwordHistory = passwordHistory;
      }
      
      if (!user.metadata) user.metadata = {};
      user.metadata.hashedPassword = newHashedPassword;
      user.metadata.passwordChangedAt = new Date();
      
      // 撤销所有现有令牌
      for (const [tokenId, token] of this.tokens.entries()) {
        if (token.userId === userId) {
          this.tokens.delete(tokenId);
          this.eventEmitter.emit('token:revoked', tokenId, '密码已更改');
        }
      }
      
      // 记录审计日志
      await this.logSecurityEvent({
        action: 'password_change',
        userId,
        result: 'success',
        riskLevel: 'low'
      });
      
      // 发射事件
      this.eventEmitter.emit('password:changed', userId);
      this.emit(SERVICE_EVENTS.PASSWORD_CHANGED, { userId });
    } catch (error) {
      const serviceError = error instanceof ServiceError ? error :
        new ServiceError({ message: '密码修改失败', code: 'PASSWORD_CHANGE_ERROR', type: ServiceErrorType.BUSINESS_LOGIC, serviceName: 'SecurityService', operation: 'changePassword', innerError: error instanceof Error ? error : undefined });
      this.eventEmitter.emit('security:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 重置密码
   */
  async resetPassword(email: string): Promise<string> {
    try {
      const user = this.findUserByEmail(email);
      if (!user) {
        // 为了安全，不透露用户是否存在
        return 'reset_token_sent';
      }
      
      // 生成重置令牌
      const resetToken = this.generateResetToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1小时后过期
      
      // 存储重置令牌
      user.metadata!.resetToken = resetToken;
      user.metadata!.resetTokenExpiresAt = expiresAt;
      
      // 记录审计日志
      await this.logSecurityEvent({
        action: 'password_reset_request',
        userId: user.id,
        result: 'success',
        details: { email },
        riskLevel: 'medium'
      });
      
      // 发射事件
      this.eventEmitter.emit('password:reset', user.id);
      this.emit(SERVICE_EVENTS.PASSWORD_RESET, { userId: user.id, email });
      
      return resetToken;
    } catch (error) {
      const serviceError = new ServiceError({ message: '密码重置失败', code: 'PASSWORD_RESET_ERROR', type: ServiceErrorType.BUSINESS_LOGIC, serviceName: 'SecurityService', operation: 'resetPassword', innerError: error instanceof Error ? error : undefined });
      this.eventEmitter.emit('security:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 确认密码重置
   */
  async confirmPasswordReset(resetToken: string, newPassword: string): Promise<void> {
    try {
      // 查找重置令牌
      const user = Array.from(this.users.values()).find(
        u => u.metadata?.resetToken === resetToken
      );
      
      if (!user) {
        throw new ValidationError('重置令牌无效', [{ field: 'token', message: '重置令牌无效', code: 'INVALID_TOKEN' }]);
      }
      
      // 检查令牌是否过期
      const expiresAt = user.metadata?.resetTokenExpiresAt;
      if (!expiresAt || expiresAt < new Date()) {
        throw new ValidationError('重置令牌已过期', [{ field: 'token', message: '重置令牌已过期', code: 'TOKEN_EXPIRED' }]);
      }
      
      // 验证新密码策略
      this.validatePassword(newPassword);
      
      // 更新密码
      const newHashedPassword = await this.hashPassword(newPassword);
      user.metadata!.hashedPassword = newHashedPassword;
      user.metadata!.passwordChangedAt = new Date();
      
      // 清除重置令牌
      delete user.metadata!.resetToken;
      delete user.metadata!.resetTokenExpiresAt;
      
      // 撤销所有现有令牌
      for (const [tokenId, token] of this.tokens.entries()) {
        if (token.userId === user.id) {
          this.tokens.delete(tokenId);
          this.eventEmitter.emit('token:revoked', tokenId, '密码已重置');
        }
      }
      
      // 记录审计日志
      await this.logSecurityEvent({
        action: 'password_reset_confirm',
        userId: user.id,
        result: 'success',
        riskLevel: 'medium'
      });
    } catch (error) {
      const serviceError = error instanceof ServiceError ? error :
        new ServiceError({ message: '密码重置确认失败', code: 'PASSWORD_RESET_CONFIRM_ERROR', type: ServiceErrorType.BUSINESS_LOGIC, serviceName: 'SecurityService', operation: 'confirmPasswordReset', innerError: error instanceof Error ? error : undefined });
      this.eventEmitter.emit('security:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 加密数据
   */
  encrypt(data: string, options: EncryptionOptions = {}): string {
    try {
      const algorithm = options.algorithm || 'aes-256-cbc';
      const key = options.key || this.securityConfig.encryptionKey || this.generateRandomString(32);
      const iv = options.iv || randomBytes(16);
      const encoding = options.encoding || 'hex';
      
      const cipher = createCipheriv(algorithm, key, iv);
      let encrypted = cipher.update(data, 'utf8', encoding);
      encrypted += cipher.final(encoding);
      
      // 将IV和加密数据组合
      return iv.toString(encoding) + ':' + encrypted;
    } catch (error) {
      throw new ServiceError({ message: '数据加密失败', code: 'ENCRYPTION_ERROR', type: ServiceErrorType.INTERNAL_SERVICE, serviceName: 'SecurityService', operation: 'encrypt', innerError: error instanceof Error ? error : new Error(String(error)) });
    }
  }

  /**
   * 解密数据
   */
  decrypt(encryptedData: string, options: EncryptionOptions = {}): string {
    try {
      const algorithm = options.algorithm || 'aes-256-cbc';
      const key = options.key || this.securityConfig.encryptionKey || this.generateRandomString(32);
      const encoding = options.encoding || 'hex';
      
      // 分离IV和加密数据
      const parts = encryptedData.split(':');
      if (parts.length !== 2) {
        throw new Error('无效的加密数据格式');
      }
      
      const iv = Buffer.from(parts[0], encoding);
      const encrypted = parts[1];
      
      const decipher = createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encrypted, encoding, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new ServiceError({ message: '数据解密失败', code: 'DECRYPTION_ERROR', type: ServiceErrorType.INTERNAL_SERVICE, serviceName: 'SecurityService', operation: 'decrypt', innerError: error instanceof Error ? error : new Error(String(error)) });
    }
  }

  /**
   * 计算哈希
   */
  hash(data: string, options: HashOptions = {}): string {
    try {
      const algorithm = options.algorithm || 'sha256';
      const salt = options.salt || '';
      const encoding = options.encoding || 'hex';
      
      if (options.iterations && options.keyLength) {
        // 使用PBKDF2
        return pbkdf2Sync(data, salt, options.iterations, options.keyLength, algorithm).toString(encoding);
      } else {
        // 使用简单哈希
        return createHash(algorithm).update(data + salt).digest(encoding);
      }
    } catch (error) {
      throw new ServiceError({ message: '数据哈希失败', code: 'HASH_ERROR', type: ServiceErrorType.INTERNAL_SERVICE, serviceName: 'SecurityService', operation: 'hash', innerError: error instanceof Error ? error : new Error(String(error)) });
    }
  }

  /**
   * 计算HMAC
   */
  hmac(data: string, secret?: string, algorithm: string = 'sha256'): string {
    try {
      const key = secret || this.securityConfig.encryptionKey || this.generateRandomString(32);
      return createHmac(algorithm, key).update(data).digest('hex');
    } catch (error) {
      throw new ServiceError({ message: 'HMAC计算失败', code: 'HMAC_ERROR', type: ServiceErrorType.INTERNAL_SERVICE, serviceName: 'SecurityService', operation: 'hmac', innerError: error instanceof Error ? error : new Error(String(error)) });
    }
  }

  /**
   * 生成随机字符串
   */
  generateRandomString(length: number = 32, charset?: string): string {
    const defaultCharset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const chars = charset || defaultCharset;
    const bytes = randomBytes(length);
    
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length];
    }
    
    return result;
  }

  /**
   * 获取安全统计信息
   */
  async getStats(): Promise<SecurityStats> {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * 获取审计日志
   */
  async getAuditLogs(limit: number = 100, offset: number = 0): Promise<SecurityAuditLog[]> {
    return this.auditLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);
  }

  /**
   * 清理过期数据
   */
  async cleanup(): Promise<void> {
    const now = new Date();
    
    // 清理过期令牌
    for (const [tokenId, token] of this.tokens.entries()) {
      if (token.expiresAt && token.expiresAt < now) {
        this.tokens.delete(tokenId);
        this.eventEmitter.emit('token:expired', tokenId);
      }
    }
    
    // 清理过期的登录锁定
    for (const [key, attempts] of this.loginAttempts.entries()) {
      if (attempts.lockedUntil && attempts.lockedUntil < now) {
        this.loginAttempts.delete(key);
      }
    }
    
    // 清理过期的审计日志
    const auditLogRetention = this.securityConfig.auditLogRetention || 30; // 默认30天
    const retentionDate = new Date(now.getTime() - auditLogRetention * 24 * 60 * 60 * 1000);
    this.auditLogs = this.auditLogs.filter(log => log.timestamp > retentionDate);
    
    this.updateStats();
  }

  /**
   * 监听安全事件
   */
  override on<T extends string | symbol>(event: T, fn: (...args: unknown[]) => void, context?: unknown): this {
    return super.on(event, fn, context);
  }

  /**
   * 监听安全事件（类型安全版本）
   */
  onSecurityEvent<K extends keyof SecurityEvents>(event: K, listener: SecurityEvents[K]): void {
    this.eventEmitter.on(event, listener as (...args: unknown[]) => void);
  }

  /**
   * 移除安全事件监听
   */
  override off<T extends string | symbol>(event: T, fn?: ((...args: unknown[]) => void) | undefined, context?: unknown, once?: boolean | undefined): this {
    return super.off(event, fn, context, once);
  }

  /**
   * 移除安全事件监听（类型安全版本）
   */
  offSecurityEvent<K extends keyof SecurityEvents>(event: K, listener: SecurityEvents[K]): void {
    super.off(event as string, listener as (...args: unknown[]) => void);
  }

  /**
   * 验证注册数据
   */
  private validateRegisterData(data: RegisterData): void {
    if (!data.username || data.username.length < 3) {
      throw new ValidationError('用户名至少需要3个字符', [{ field: 'username', message: '用户名至少需要3个字符', code: 'MIN_LENGTH' }], 'SecurityService');
    }
    
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new ValidationError('邮箱格式无效', [{ field: 'email', message: '邮箱格式无效', code: 'INVALID_FORMAT' }], 'SecurityService');
    }
    
    if (data.password !== data.confirmPassword) {
      throw new ValidationError('密码确认不匹配', [{ field: 'confirmPassword', message: '密码确认不匹配', code: 'PASSWORD_MISMATCH' }], 'SecurityService');
    }
    
    if (!data.agreeToTerms) {
      throw new ValidationError('必须同意服务条款', [{ field: 'agreeToTerms', message: '必须同意服务条款', code: 'REQUIRED_FIELD' }], 'SecurityService');
    }
  }

  /**
   * 验证密码策略
   */
  private validatePassword(password: string): void {
    const policy = this.securityConfig.passwordPolicy;
    
    if (!policy) {
      return; // 如果没有密码策略配置，跳过验证
    }
    
    if (policy.minLength && password.length < policy.minLength) {
      throw new ValidationError(`密码长度至少需要 ${policy.minLength} 个字符`, [{ field: 'password', message: `密码长度至少需要 ${policy.minLength} 个字符`, code: 'MIN_LENGTH' }], 'SecurityService');
    }
    
    if (policy.maxLength && password.length > policy.maxLength) {
      throw new ValidationError(`密码长度不能超过 ${policy.maxLength} 个字符`, [{ field: 'password', message: `密码长度不能超过 ${policy.maxLength} 个字符`, code: 'MAX_LENGTH' }], 'SecurityService');
    }
    
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      throw new ValidationError('密码必须包含大写字母', [{ field: 'password', message: '密码必须包含大写字母', code: 'REQUIRE_UPPERCASE' }], 'SecurityService');
    }
    
    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      throw new ValidationError('密码必须包含小写字母', [{ field: 'password', message: '密码必须包含小写字母', code: 'REQUIRE_LOWERCASE' }], 'SecurityService');
    }
    
    if (policy.requireNumbers && !/\d/.test(password)) {
      throw new ValidationError('密码必须包含数字', [{ field: 'password', message: '密码必须包含数字', code: 'REQUIRE_NUMBERS' }], 'SecurityService');
    }
    
    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new ValidationError('密码必须包含特殊字符', [{ field: 'password', message: '密码必须包含特殊字符', code: 'REQUIRE_SPECIAL_CHARS' }], 'SecurityService');
    }
    
    if (policy.forbiddenPasswords && policy.forbiddenPasswords.includes(password.toLowerCase())) {
      throw new ValidationError('密码过于简单，请选择更安全的密码', [{ field: 'password', message: '密码过于简单，请选择更安全的密码', code: 'WEAK_PASSWORD' }], 'SecurityService');
    }
  }

  /**
   * 哈希密码
   */
  private async hashPassword(password: string): Promise<string> {
    const salt = this.generateRandomString(16);
    const hash = pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * 验证密码
   */
  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const [salt, hash] = hashedPassword.split(':');
      const computedHash = pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
      return hash === computedHash;
    } catch (error) {
      return false;
    }
  }

  /**
   * 创建令牌
   */
  private async createToken(userId: string, scopes: string[] = []): Promise<AuthToken> {
    const tokenId = this.generateId();
    const tokenExpiration = this.securityConfig.tokenExpiration || 24; // 默认24小时
    const expiresAt = new Date(Date.now() + tokenExpiration * 60 * 60 * 1000);
    
    const token: AuthToken = {
      token: tokenId,
      type: 'bearer',
      expiresAt,
      issuedAt: new Date(),
      userId,
      scopes
    };
    
    this.tokens.set(tokenId, token);
    this.eventEmitter.emit('token:created', token);
    
    return token;
  }

  /**
   * 记录失败登录
   */
  private async recordFailedLogin(identifier: string, reason: string): Promise<void> {
    const attempts = this.loginAttempts.get(identifier) || { count: 0, lastAttempt: new Date() };
    attempts.count++;
    attempts.lastAttempt = new Date();
    
    const maxLoginAttempts = this.securityConfig.maxLoginAttempts || 5; // 默认5次
    const lockoutDuration = this.securityConfig.lockoutDuration || 30; // 默认30分钟
    
    if (attempts.count >= maxLoginAttempts) {
      attempts.lockedUntil = new Date(Date.now() + lockoutDuration * 60 * 1000);
      
      // 记录账户锁定事件
      await this.logSecurityEvent({
        action: 'account_locked',
        result: 'warning',
        details: { identifier, reason, attempts: attempts.count },
        riskLevel: 'high'
      });
      
      this.eventEmitter.emit('auth:locked', identifier, reason);
    }
    
    this.loginAttempts.set(identifier, attempts);
    
    // 记录失败登录事件
    await this.logSecurityEvent({
      action: 'login_failed',
      result: 'failure',
      details: { identifier, reason, attempts: attempts.count },
      riskLevel: attempts.count >= maxLoginAttempts ? 'high' : 'medium'
    });
    
    this.eventEmitter.emit('auth:failed', { username: identifier }, reason);
  }

  /**
   * 检查角色权限
   */
  private checkRolePermissions(roles: string[], _permission: string): boolean {
    // 这里应该实现角色权限映射逻辑
    // 简化实现：admin角色拥有所有权限
    return roles.includes('admin');
  }

  /**
   * 验证双因素认证码
   */
  private verifyTwoFactorCode(_userId: string, _code: string): boolean {
    // 这里应该实现TOTP验证逻辑
    // 简化实现：总是返回true
    return true;
  }

  /**
   * 记录安全事件
   */
  private async logSecurityEvent(event: Partial<SecurityAuditLog>): Promise<void> {
    const log: SecurityAuditLog = {
      id: this.generateId(),
      timestamp: new Date(),
      action: event.action || 'unknown',
      result: event.result || 'success',
      riskLevel: event.riskLevel || 'low',
      ...event
    };
    
    this.auditLogs.push(log);
    
    // 如果是安全事件，发射事件
    if (log.riskLevel === 'high' || log.riskLevel === 'critical') {
      this.eventEmitter.emit('security:incident', log);
    }
  }

  /**
   * 查找用户（按用户名）
   */
  private findUserByUsername(username: string): UserInfo | undefined {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  /**
   * 查找用户（按邮箱）
   */
  private findUserByEmail(email: string): UserInfo | undefined {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  /**
   * 生成ID
   */
  private generateId(): string {
    return this.generateRandomString(32);
  }

  /**
   * 生成密钥
   */
  private generateKey(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * 生成重置令牌
   */
  private generateResetToken(): string {
    return this.generateRandomString(64);
  }

  /**
   * 加载用户数据
   */
  private async loadUserData(): Promise<void> {
    // 这里应该从持久化存储加载用户数据
    // 简化实现：创建一个默认管理员用户
    const adminUser: UserInfo = {
      id: 'admin',
      username: 'admin',
      email: 'admin@example.com',
      roles: ['admin'],
      permissions: ['*'],
      metadata: {
        hashedPassword: await this.hashPassword('admin123'),
        createdAt: new Date()
      },
      isActive: true,
      isVerified: true,
      loginCount: 0
    };
    
    this.users.set(adminUser.id, adminUser);
  }

  /**
   * 启动清理任务
   */
  private startCleanupTasks(): void {
    // 每小时清理一次过期数据
    setInterval(() => {
      this.cleanup().catch(error => {
        const serviceError = new ServiceError({ message: '清理任务失败', code: 'CLEANUP_ERROR', type: ServiceErrorType.INTERNAL_SERVICE, serviceName: 'SecurityService', operation: 'cleanup', innerError: error as Error });
        this.eventEmitter.emit('security:error', serviceError);
      });
    }, 60 * 60 * 1000);
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    this.stats.totalUsers = this.users.size;
    this.stats.activeUsers = Array.from(this.users.values()).filter(u => u.isActive).length;
    this.stats.lockedUsers = Array.from(this.loginAttempts.values()).filter(a => a.lockedUntil && a.lockedUntil > new Date()).length;
    this.stats.totalLogins = Array.from(this.users.values()).reduce((sum, u) => sum + (u.loginCount || 0), 0);
    this.stats.failedLogins = Array.from(this.loginAttempts.values()).reduce((sum, a) => sum + a.count, 0);
    this.stats.securityIncidents = this.auditLogs.filter(log => log.riskLevel === 'high' || log.riskLevel === 'critical').length;
    this.stats.auditLogs = this.auditLogs.length;
    
    // 计算风险级别
    if (this.stats.securityIncidents > 10 || this.stats.lockedUsers > this.stats.totalUsers * 0.1) {
      this.stats.riskLevel = 'critical';
    } else if (this.stats.securityIncidents > 5 || this.stats.failedLogins > this.stats.totalLogins * 0.1) {
      this.stats.riskLevel = 'high';
    } else if (this.stats.securityIncidents > 0 || this.stats.failedLogins > 0) {
      this.stats.riskLevel = 'medium';
    } else {
      this.stats.riskLevel = 'low';
    }
  }
}

// 全局安全服务实例
let securityServiceInstance: SecurityService | null = null;

/**
 * 创建安全服务实例
 */
export function createSecurityService(config: SecurityConfig): SecurityService {
  return new SecurityService(config);
}

/**
 * 获取安全服务实例
 */
export function getSecurityService(): SecurityService | null {
  return securityServiceInstance;
}

/**
 * 初始化安全服务
 */
export async function initSecurityService(config: SecurityConfig): Promise<SecurityService> {
  if (securityServiceInstance) {
    await securityServiceInstance.destroy();
  }
  
  securityServiceInstance = new SecurityService(config);
  await securityServiceInstance.initialize();
  
  return securityServiceInstance;
}

/**
 * 销毁安全服务
 */
export async function destroySecurityService(): Promise<void> {
  if (securityServiceInstance) {
    await securityServiceInstance.destroy();
    securityServiceInstance = null;
  }
}



// 导出默认实例
export default SecurityService;