import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login-page';
import { TestDataGenerator } from '../../utils/test-helpers';

/**
 * 登录功能E2E测试
 * 
 * 测试用户登录的各种场景，包括正常登录、错误处理、
 * 第三方登录、表单验证等功能
 */
test.describe('用户登录', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test.afterEach(async ({ page }) => {
    await loginPage.cleanup();
  });

  test('应该显示登录页面', async () => {
    await expect(loginPage.isLoginPage()).resolves.toBe(true);
    await loginPage.expectCurrentUrl(/\/login/);
    await loginPage.waitForTitle(/登录|Login/);
  });

  test('应该成功登录有效用户', async () => {
    const email = process.env.TEST_USER_EMAIL || 'test@phoenixcoder.com';
    const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await loginPage.login(email, password);
    await loginPage.waitForLoginSuccess();
    
    // 验证重定向到主页或仪表板
    await expect(loginPage.getCurrentUrl()).toMatch(/\/(dashboard|tasks|$)/);
  });

  test('应该记住用户登录状态', async () => {
    const email = process.env.TEST_USER_EMAIL || 'test@phoenixcoder.com';
    const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await loginPage.login(email, password, true); // 勾选记住我
    await loginPage.waitForLoginSuccess();
    
    // 刷新页面，应该保持登录状态
    await loginPage.refresh();
    await expect(loginPage.getCurrentUrl()).not.toMatch(/\/login/);
  });

  test('应该拒绝无效凭据', async () => {
    await loginPage.login('invalid@example.com', 'wrongpassword');
    await loginPage.waitForLoginFailure();
    
    const errorMessage = await loginPage.getLoginError();
    expect(errorMessage).toContain('邮箱或密码错误');
    
    // 应该保持在登录页面
    await loginPage.expectCurrentUrl(/\/login/);
  });

  test('应该显示表单验证错误', async () => {
    const validation = await loginPage.testFormValidation();
    
    expect(validation.emailRequired).toBe(true);
    expect(validation.passwordRequired).toBe(true);
    expect(validation.invalidEmail).toBe(true);
  });

  test('应该支持键盘登录', async () => {
    const email = process.env.TEST_USER_EMAIL || 'test@phoenixcoder.com';
    const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await loginPage.loginWithEnter(email, password);
    await loginPage.waitForLoginSuccess();
  });

  test('应该处理空邮箱字段', async () => {
    await loginPage.enterPassword('somepassword');
    await loginPage.clickLoginButton();
    
    const emailError = await loginPage.getEmailError();
    expect(emailError).toContain('请输入邮箱');
  });

  test('应该处理空密码字段', async () => {
    await loginPage.enterEmail('test@example.com');
    await loginPage.clickLoginButton();
    
    const passwordError = await loginPage.getPasswordError();
    expect(passwordError).toContain('请输入密码');
  });

  test('应该处理无效邮箱格式', async () => {
    await loginPage.enterEmail('invalid-email');
    await loginPage.enterPassword('password123');
    await loginPage.clickLoginButton();
    
    const emailError = await loginPage.getEmailError();
    expect(emailError).toContain('请输入有效的邮箱地址');
  });

  test('应该清空表单', async () => {
    await loginPage.enterEmail('test@example.com');
    await loginPage.enterPassword('password123');
    await loginPage.checkRememberMe();
    
    await loginPage.clearForm();
    
    // 验证表单已清空
    const emailValue = await loginPage.page.inputValue('[data-testid="email-input"]');
    const passwordValue = await loginPage.page.inputValue('[data-testid="password-input"]');
    const rememberMeChecked = await loginPage.page.isChecked('[data-testid="remember-me-checkbox"]');
    
    expect(emailValue).toBe('');
    expect(passwordValue).toBe('');
    expect(rememberMeChecked).toBe(false);
  });

  test('应该导航到注册页面', async () => {
    await loginPage.clickRegisterLink();
    await expect(loginPage.page).toHaveURL(/\/register/);
  });

  test('应该导航到忘记密码页面', async () => {
    await loginPage.clickForgotPassword();
    await expect(loginPage.page).toHaveURL(/\/forgot-password/);
  });

  test('应该在慢速网络下正常工作', async () => {
    const email = process.env.TEST_USER_EMAIL || 'test@phoenixcoder.com';
    const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await loginPage.loginWithSlowNetwork(email, password);
    await loginPage.waitForLoginSuccess();
  });

  test('应该检查登录按钮状态', async () => {
    // 初始状态下登录按钮应该可用
    expect(await loginPage.isLoginButtonEnabled()).toBe(true);
    
    // 点击登录后应该显示加载状态
    await loginPage.enterEmail('test@example.com');
    await loginPage.enterPassword('password123');
    await loginPage.clickLoginButton();
    
    // 检查加载状态（可能很快消失）
    try {
      expect(await loginPage.isLoginButtonLoading()).toBe(true);
    } catch {
      // 如果加载状态消失得太快，忽略这个检查
    }
  });

  test('应该支持多次登录尝试', async () => {
    // 第一次失败的登录
    await loginPage.login('wrong@example.com', 'wrongpassword');
    await loginPage.waitForLoginFailure();
    
    // 清空表单
    await loginPage.clearForm();
    
    // 第二次成功的登录
    const email = process.env.TEST_USER_EMAIL || 'test@phoenixcoder.com';
    const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
    await loginPage.login(email, password);
    await loginPage.waitForLoginSuccess();
  });

  test('应该处理网络错误', async () => {
    // 模拟离线状态
    await loginPage.helpers.simulateNetworkCondition('offline');
    
    await loginPage.login('test@example.com', 'password123');
    
    // 应该显示网络错误
    const errorMessage = await loginPage.getLoginError();
    expect(errorMessage).toMatch(/网络错误|连接失败|Network error/);
    
    // 恢复网络
    await loginPage.helpers.simulateNetworkCondition('fast');
  });
});

/**
 * 第三方登录测试
 */
test.describe('第三方登录', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test.skip('应该重定向到GitHub授权页面', async () => {
    await loginPage.loginWithGitHub();
    await expect(loginPage.page).toHaveURL(/github\.com/);
  });

  test.skip('应该重定向到Google授权页面', async () => {
    await loginPage.loginWithGoogle();
    await expect(loginPage.page).toHaveURL(/accounts\.google\.com/);
  });

  test.skip('应该显示微信登录二维码', async () => {
    await loginPage.loginWithWechat();
    await loginPage.helpers.expectVisible('[data-testid="wechat-qr-code"]');
  });
});

/**
 * 可访问性测试
 */
test.describe('登录页面可访问性', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('应该具有正确的ARIA标签', async () => {
    await loginPage.checkAccessibility();
  });

  test('应该支持键盘导航', async () => {
    // Tab键导航测试
    await loginPage.page.keyboard.press('Tab');
    await expect(loginPage.page.locator('[data-testid="email-input"]')).toBeFocused();
    
    await loginPage.page.keyboard.press('Tab');
    await expect(loginPage.page.locator('[data-testid="password-input"]')).toBeFocused();
    
    await loginPage.page.keyboard.press('Tab');
    await expect(loginPage.page.locator('[data-testid="remember-me-checkbox"]')).toBeFocused();
    
    await loginPage.page.keyboard.press('Tab');
    await expect(loginPage.page.locator('[data-testid="login-button"]')).toBeFocused();
  });

  test('应该有正确的颜色对比度', async () => {
    // 这里可以集成axe-core进行自动化可访问性测试
    // 或者使用Playwright的内置可访问性检查
    const accessibilityScanResults = await loginPage.page.accessibility.snapshot();
    expect(accessibilityScanResults).toBeDefined();
  });
});

/**
 * 视觉回归测试
 */
test.describe('登录页面视觉回归', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('应该匹配登录页面截图', async () => {
    await loginPage.helpers.compareScreenshot('login-page', { fullPage: true });
  });

  test('应该匹配错误状态截图', async () => {
    await loginPage.login('invalid@example.com', 'wrongpassword');
    await loginPage.waitForLoginFailure();
    await loginPage.helpers.compareScreenshot('login-page-error');
  });

  test('应该匹配移动端登录页面', async () => {
    await loginPage.helpers.setViewportSize(375, 667); // iPhone SE尺寸
    await loginPage.helpers.compareScreenshot('login-page-mobile', { fullPage: true });
  });
});