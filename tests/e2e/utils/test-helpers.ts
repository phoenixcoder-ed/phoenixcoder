import { Page, Locator, expect } from '@playwright/test';

/**
 * E2E测试辅助工具类
 * 
 * 提供常用的测试操作方法，简化测试代码编写
 */
export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * 等待页面加载完成
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 等待元素可见
   */
  async waitForVisible(selector: string): Promise<Locator> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible' });
    return element;
  }

  /**
   * 等待元素隐藏
   */
  async waitForHidden(selector: string): Promise<void> {
    await this.page.locator(selector).waitFor({ state: 'hidden' });
  }

  /**
   * 填写表单字段
   */
  async fillForm(fields: Record<string, string>): Promise<void> {
    for (const [selector, value] of Object.entries(fields)) {
      await this.page.fill(selector, value);
    }
  }

  /**
   * 点击并等待导航
   */
  async clickAndWaitForNavigation(selector: string): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation(),
      this.page.click(selector)
    ]);
  }

  /**
   * 点击并等待响应
   */
  async clickAndWaitForResponse(selector: string, urlPattern: string | RegExp): Promise<void> {
    await Promise.all([
      this.page.waitForResponse(urlPattern),
      this.page.click(selector)
    ]);
  }

  /**
   * 滚动到元素
   */
  async scrollToElement(selector: string): Promise<void> {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  /**
   * 截图对比
   */
  async compareScreenshot(name: string, options?: {
    fullPage?: boolean;
    clip?: { x: number; y: number; width: number; height: number };
  }): Promise<void> {
    await expect(this.page).toHaveScreenshot(`${name}.png`, options);
  }

  /**
   * 检查元素文本
   */
  async expectText(selector: string, text: string | RegExp): Promise<void> {
    await expect(this.page.locator(selector)).toHaveText(text);
  }

  /**
   * 检查元素可见性
   */
  async expectVisible(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  /**
   * 检查元素隐藏
   */
  async expectHidden(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeHidden();
  }

  /**
   * 检查URL
   */
  async expectURL(url: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(url);
  }

  /**
   * 检查页面标题
   */
  async expectTitle(title: string | RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(title);
  }

  /**
   * 模拟文件上传
   */
  async uploadFile(selector: string, filePath: string): Promise<void> {
    await this.page.setInputFiles(selector, filePath);
  }

  /**
   * 模拟键盘操作
   */
  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  /**
   * 模拟鼠标悬停
   */
  async hover(selector: string): Promise<void> {
    await this.page.hover(selector);
  }

  /**
   * 获取元素属性
   */
  async getAttribute(selector: string, attribute: string): Promise<string | null> {
    return await this.page.getAttribute(selector, attribute);
  }

  /**
   * 获取元素文本
   */
  async getText(selector: string): Promise<string | null> {
    return await this.page.textContent(selector);
  }

  /**
   * 等待API响应
   */
  async waitForAPI(urlPattern: string | RegExp, timeout = 30000): Promise<void> {
    await this.page.waitForResponse(urlPattern, { timeout });
  }

  /**
   * 模拟网络条件
   */
  async simulateNetworkCondition(condition: 'slow' | 'fast' | 'offline'): Promise<void> {
    const conditions = {
      slow: { downloadThroughput: 50 * 1024, uploadThroughput: 20 * 1024, latency: 500 },
      fast: { downloadThroughput: 10 * 1024 * 1024, uploadThroughput: 5 * 1024 * 1024, latency: 20 },
      offline: { downloadThroughput: 0, uploadThroughput: 0, latency: 0 }
    };
    
    if (condition === 'offline') {
      await this.page.context().setOffline(true);
    } else {
      await this.page.context().setOffline(false);
      // @ts-ignore
      await this.page.context().route('**/*', route => {
        route.continue();
      });
    }
  }

  /**
   * 清理本地存储
   */
  async clearStorage(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  /**
   * 设置本地存储
   */
  async setLocalStorage(key: string, value: string): Promise<void> {
    await this.page.evaluate(({ key, value }) => {
      localStorage.setItem(key, value);
    }, { key, value });
  }

  /**
   * 获取本地存储
   */
  async getLocalStorage(key: string): Promise<string | null> {
    return await this.page.evaluate((key) => {
      return localStorage.getItem(key);
    }, key);
  }

  /**
   * 模拟地理位置
   */
  async setGeolocation(latitude: number, longitude: number): Promise<void> {
    await this.page.context().setGeolocation({ latitude, longitude });
  }

  /**
   * 模拟设备方向
   */
  async setViewportSize(width: number, height: number): Promise<void> {
    await this.page.setViewportSize({ width, height });
  }

  /**
   * 等待动画完成
   */
  async waitForAnimations(): Promise<void> {
    await this.page.waitForFunction(() => {
      return document.getAnimations().every(animation => 
        animation.playState === 'finished' || animation.playState === 'idle'
      );
    });
  }

  /**
   * 检查控制台错误
   */
  async checkConsoleErrors(): Promise<string[]> {
    const errors: string[] = [];
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    return errors;
  }

  /**
   * 模拟慢速操作
   */
  async slowType(selector: string, text: string, delay = 100): Promise<void> {
    await this.page.type(selector, text, { delay });
  }

  /**
   * 等待元素数量
   */
  async waitForElementCount(selector: string, count: number): Promise<void> {
    await this.page.waitForFunction(
      ({ selector, count }) => {
        return document.querySelectorAll(selector).length === count;
      },
      { selector, count }
    );
  }
}

/**
 * 测试数据生成器
 */
export class TestDataGenerator {
  /**
   * 生成随机字符串
   */
  static randomString(length = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 生成随机邮箱
   */
  static randomEmail(): string {
    return `test_${this.randomString(8)}@example.com`;
  }

  /**
   * 生成随机手机号
   */
  static randomPhone(): string {
    return `1${Math.floor(Math.random() * 9000000000) + 1000000000}`;
  }

  /**
   * 生成随机密码
   */
  static randomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * 生成测试用户数据
   */
  static generateUser() {
    return {
      email: this.randomEmail(),
      password: this.randomPassword(),
      username: this.randomString(8),
      firstName: this.randomString(6),
      lastName: this.randomString(6),
      phone: this.randomPhone()
    };
  }

  /**
   * 生成测试任务数据
   */
  static generateTask() {
    return {
      title: `测试任务_${this.randomString(6)}`,
      description: `这是一个测试任务描述_${this.randomString(20)}`,
      reward: Math.floor(Math.random() * 1000) + 100,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      skills: ['JavaScript', 'Python', 'React'].slice(0, Math.floor(Math.random() * 3) + 1)
    };
  }
}