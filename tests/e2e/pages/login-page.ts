import { Page } from '@playwright/test';
import { BasePage } from './base-page';

/**
 * 登录页面对象模型
 * 
 * 封装登录页面的元素和操作方法
 */
export class LoginPage extends BasePage {
  // 页面元素选择器
  private readonly emailInput = '[data-testid="email-input"]';
  private readonly passwordInput = '[data-testid="password-input"]';
  private readonly loginButton = '[data-testid="login-button"]';
  private readonly forgotPasswordLink = '[data-testid="forgot-password-link"]';
  private readonly registerLink = '[data-testid="register-link"]';
  private readonly rememberMeCheckbox = '[data-testid="remember-me-checkbox"]';
  
  // 第三方登录
  private readonly githubLoginButton = '[data-testid="github-login-button"]';
  private readonly googleLoginButton = '[data-testid="google-login-button"]';
  private readonly wechatLoginButton = '[data-testid="wechat-login-button"]';
  
  // 错误和成功消息
  private readonly loginError = '[data-testid="login-error"]';
  private readonly emailError = '[data-testid="email-error"]';
  private readonly passwordError = '[data-testid="password-error"]';
  
  // 页面标识元素
  private readonly loginForm = '[data-testid="login-form"]';
  private readonly pageTitle = 'h1';

  constructor(page: Page) {
    super(page);
  }

  /**
   * 获取登录页面URL
   */
  getUrl(): string {
    return '/login';
  }

  /**
   * 等待登录页面加载完成
   */
  async waitForPageLoad(): Promise<void> {
    await super.waitForPageLoad();
    await this.helpers.waitForVisible(this.loginForm);
  }

  /**
   * 检查页面是否为登录页面
   */
  async isLoginPage(): Promise<boolean> {
    return await this.isElementPresent(this.loginForm);
  }

  /**
   * 输入邮箱
   */
  async enterEmail(email: string): Promise<void> {
    await this.fillInput(this.emailInput, email);
  }

  /**
   * 输入密码
   */
  async enterPassword(password: string): Promise<void> {
    await this.fillInput(this.passwordInput, password);
  }

  /**
   * 点击登录按钮
   */
  async clickLoginButton(): Promise<void> {
    await this.clickWithRetry(this.loginButton);
  }

  /**
   * 执行登录操作
   */
  async login(email: string, password: string, rememberMe = false): Promise<void> {
    await this.enterEmail(email);
    await this.enterPassword(password);
    
    if (rememberMe) {
      await this.checkRememberMe();
    }
    
    await this.clickLoginButton();
  }

  /**
   * 快速登录（使用默认测试用户）
   */
  async quickLogin(): Promise<void> {
    const email = process.env.TEST_USER_EMAIL || 'test@phoenixcoder.com';
    const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
    await this.login(email, password);
  }

  /**
   * 管理员登录
   */
  async adminLogin(): Promise<void> {
    const email = process.env.TEST_ADMIN_EMAIL || 'admin@phoenixcoder.com';
    const password = process.env.TEST_ADMIN_PASSWORD || 'AdminPassword123!';
    await this.login(email, password);
  }

  /**
   * 勾选记住我
   */
  async checkRememberMe(): Promise<void> {
    await this.checkCheckbox(this.rememberMeCheckbox);
  }

  /**
   * 取消勾选记住我
   */
  async uncheckRememberMe(): Promise<void> {
    await this.uncheckCheckbox(this.rememberMeCheckbox);
  }

  /**
   * 点击忘记密码链接
   */
  async clickForgotPassword(): Promise<void> {
    await this.page.click(this.forgotPasswordLink);
  }

  /**
   * 点击注册链接
   */
  async clickRegisterLink(): Promise<void> {
    await this.page.click(this.registerLink);
  }

  /**
   * GitHub登录
   */
  async loginWithGitHub(): Promise<void> {
    await this.page.click(this.githubLoginButton);
    // 等待重定向到GitHub授权页面
    await this.page.waitForURL('**/github.com/**');
  }

  /**
   * Google登录
   */
  async loginWithGoogle(): Promise<void> {
    await this.page.click(this.googleLoginButton);
    // 等待重定向到Google授权页面
    await this.page.waitForURL('**/accounts.google.com/**');
  }

  /**
   * 微信登录
   */
  async loginWithWechat(): Promise<void> {
    await this.page.click(this.wechatLoginButton);
    // 等待微信登录二维码出现
    await this.helpers.waitForVisible('[data-testid="wechat-qr-code"]');
  }

  /**
   * 获取登录错误消息
   */
  async getLoginError(): Promise<string | null> {
    try {
      return await this.helpers.getText(this.loginError);
    } catch {
      return null;
    }
  }

  /**
   * 获取邮箱错误消息
   */
  async getEmailError(): Promise<string | null> {
    try {
      return await this.helpers.getText(this.emailError);
    } catch {
      return null;
    }
  }

  /**
   * 获取密码错误消息
   */
  async getPasswordError(): Promise<string | null> {
    try {
      return await this.helpers.getText(this.passwordError);
    } catch {
      return null;
    }
  }

  /**
   * 检查是否有登录错误
   */
  async hasLoginError(): Promise<boolean> {
    return await this.isElementVisible(this.loginError);
  }

  /**
   * 检查是否有邮箱错误
   */
  async hasEmailError(): Promise<boolean> {
    return await this.isElementVisible(this.emailError);
  }

  /**
   * 检查是否有密码错误
   */
  async hasPasswordError(): Promise<boolean> {
    return await this.isElementVisible(this.passwordError);
  }

  /**
   * 清空登录表单
   */
  async clearForm(): Promise<void> {
    await this.fillInput(this.emailInput, '');
    await this.fillInput(this.passwordInput, '');
    await this.uncheckRememberMe();
  }

  /**
   * 检查登录按钮是否可用
   */
  async isLoginButtonEnabled(): Promise<boolean> {
    return await this.isElementClickable(this.loginButton);
  }

  /**
   * 检查登录按钮是否显示加载状态
   */
  async isLoginButtonLoading(): Promise<boolean> {
    return await this.isElementPresent(`${this.loginButton} [data-testid="loading-spinner"]`);
  }

  /**
   * 等待登录成功并重定向
   */
  async waitForLoginSuccess(): Promise<void> {
    // 等待重定向到主页或仪表板
    await this.page.waitForURL(url => 
      url.pathname === '/' || 
      url.pathname === '/dashboard' || 
      url.pathname === '/tasks'
    );
  }

  /**
   * 等待登录失败
   */
  async waitForLoginFailure(): Promise<void> {
    await this.helpers.waitForVisible(this.loginError);
  }

  /**
   * 模拟键盘登录（回车键）
   */
  async loginWithEnter(email: string, password: string): Promise<void> {
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.helpers.pressKey('Enter');
  }

  /**
   * 测试表单验证
   */
  async testFormValidation(): Promise<{
    emailRequired: boolean;
    passwordRequired: boolean;
    invalidEmail: boolean;
  }> {
    // 测试必填字段验证
    await this.clearForm();
    await this.clickLoginButton();
    
    const emailRequired = await this.hasEmailError();
    const passwordRequired = await this.hasPasswordError();
    
    // 测试邮箱格式验证
    await this.enterEmail('invalid-email');
    await this.clickLoginButton();
    const invalidEmail = await this.hasEmailError();
    
    return {
      emailRequired,
      passwordRequired,
      invalidEmail
    };
  }

  /**
   * 检查页面可访问性
   */
  async checkAccessibility(): Promise<void> {
    // 检查表单标签
    await this.helpers.expectVisible('label[for="email"]');
    await this.helpers.expectVisible('label[for="password"]');
    
    // 检查ARIA属性
    const emailInput = this.page.locator(this.emailInput);
    const passwordInput = this.page.locator(this.passwordInput);
    
    await emailInput.getAttribute('aria-label');
    await passwordInput.getAttribute('aria-label');
  }

  /**
   * 模拟慢速网络登录
   */
  async loginWithSlowNetwork(email: string, password: string): Promise<void> {
    await this.helpers.simulateNetworkCondition('slow');
    await this.login(email, password);
    await this.helpers.simulateNetworkCondition('fast');
  }
}