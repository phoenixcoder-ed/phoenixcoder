import { Page, Locator } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

/**
 * 基础页面对象模型
 * 
 * 所有页面对象的基类，提供通用的页面操作方法
 */
export abstract class BasePage {
  protected helpers: TestHelpers;
  
  // 通用元素选择器
  protected readonly loadingSpinner = '[data-testid="loading-spinner"]';
  protected readonly errorMessage = '[data-testid="error-message"]';
  protected readonly successMessage = '[data-testid="success-message"]';
  protected readonly confirmDialog = '[data-testid="confirm-dialog"]';
  protected readonly confirmButton = '[data-testid="confirm-button"]';
  protected readonly cancelButton = '[data-testid="cancel-button"]';
  
  // 导航元素
  protected readonly header = 'header';
  protected readonly navigation = 'nav';
  protected readonly footer = 'footer';
  protected readonly sidebar = '[data-testid="sidebar"]';
  
  // 表单元素
  protected readonly submitButton = '[type="submit"]';
  protected readonly resetButton = '[type="reset"]';
  protected readonly formError = '.form-error';
  protected readonly fieldError = '.field-error';

  constructor(protected page: Page) {
    this.helpers = new TestHelpers(page);
  }

  /**
   * 获取页面URL
   */
  abstract getUrl(): string;

  /**
   * 导航到页面
   */
  async goto(): Promise<void> {
    await this.page.goto(this.getUrl());
    await this.waitForPageLoad();
  }

  /**
   * 等待页面加载完成
   */
  async waitForPageLoad(): Promise<void> {
    await this.helpers.waitForPageLoad();
    await this.waitForLoadingComplete();
  }

  /**
   * 等待加载动画完成
   */
  async waitForLoadingComplete(): Promise<void> {
    try {
      await this.helpers.waitForHidden(this.loadingSpinner);
    } catch {
      // 如果没有加载动画，忽略错误
    }
  }

  /**
   * 检查页面是否已加载
   */
  async isPageLoaded(): Promise<boolean> {
    try {
      await this.page.waitForSelector('body', { state: 'attached', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取页面标题
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * 检查错误消息
   */
  async getErrorMessage(): Promise<string | null> {
    try {
      return await this.helpers.getText(this.errorMessage);
    } catch {
      return null;
    }
  }

  /**
   * 检查成功消息
   */
  async getSuccessMessage(): Promise<string | null> {
    try {
      return await this.helpers.getText(this.successMessage);
    } catch {
      return null;
    }
  }

  /**
   * 等待并点击确认按钮
   */
  async confirmAction(): Promise<void> {
    await this.helpers.waitForVisible(this.confirmDialog);
    await this.page.click(this.confirmButton);
    await this.helpers.waitForHidden(this.confirmDialog);
  }

  /**
   * 等待并点击取消按钮
   */
  async cancelAction(): Promise<void> {
    await this.helpers.waitForVisible(this.confirmDialog);
    await this.page.click(this.cancelButton);
    await this.helpers.waitForHidden(this.confirmDialog);
  }

  /**
   * 滚动到页面顶部
   */
  async scrollToTop(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, 0));
  }

  /**
   * 滚动到页面底部
   */
  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  /**
   * 刷新页面
   */
  async refresh(): Promise<void> {
    await this.page.reload();
    await this.waitForPageLoad();
  }

  /**
   * 返回上一页
   */
  async goBack(): Promise<void> {
    await this.page.goBack();
    await this.waitForPageLoad();
  }

  /**
   * 前进到下一页
   */
  async goForward(): Promise<void> {
    await this.page.goForward();
    await this.waitForPageLoad();
  }

  /**
   * 检查元素是否存在
   */
  async isElementPresent(selector: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 检查元素是否可见
   */
  async isElementVisible(selector: string): Promise<boolean> {
    try {
      const element = this.page.locator(selector);
      return await element.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * 检查元素是否可点击
   */
  async isElementClickable(selector: string): Promise<boolean> {
    try {
      const element = this.page.locator(selector);
      return await element.isEnabled();
    } catch {
      return false;
    }
  }

  /**
   * 等待元素出现
   */
  async waitForElement(selector: string, timeout = 10000): Promise<Locator> {
    return await this.helpers.waitForVisible(selector);
  }

  /**
   * 等待元素消失
   */
  async waitForElementToDisappear(selector: string, timeout = 10000): Promise<void> {
    await this.helpers.waitForHidden(selector);
  }

  /**
   * 点击元素（带重试）
   */
  async clickWithRetry(selector: string, maxRetries = 3): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.page.click(selector);
        return;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await this.page.waitForTimeout(1000);
      }
    }
  }

  /**
   * 填写输入框（带清空）
   */
  async fillInput(selector: string, value: string): Promise<void> {
    await this.page.fill(selector, '');
    await this.page.fill(selector, value);
  }

  /**
   * 选择下拉框选项
   */
  async selectOption(selector: string, value: string): Promise<void> {
    await this.page.selectOption(selector, value);
  }

  /**
   * 检查复选框
   */
  async checkCheckbox(selector: string): Promise<void> {
    await this.page.check(selector);
  }

  /**
   * 取消复选框
   */
  async uncheckCheckbox(selector: string): Promise<void> {
    await this.page.uncheck(selector);
  }

  /**
   * 选择单选按钮
   */
  async selectRadio(selector: string): Promise<void> {
    await this.page.check(selector);
  }

  /**
   * 上传文件
   */
  async uploadFile(selector: string, filePath: string): Promise<void> {
    await this.helpers.uploadFile(selector, filePath);
  }

  /**
   * 截图
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }

  /**
   * 等待API响应
   */
  async waitForAPIResponse(urlPattern: string | RegExp): Promise<void> {
    await this.helpers.waitForAPI(urlPattern);
  }

  /**
   * 模拟键盘快捷键
   */
  async pressShortcut(shortcut: string): Promise<void> {
    await this.page.keyboard.press(shortcut);
  }

  /**
   * 获取当前URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * 检查当前URL是否匹配
   */
  async expectCurrentUrl(expectedUrl: string | RegExp): Promise<void> {
    await this.helpers.expectURL(expectedUrl);
  }

  /**
   * 等待页面标题
   */
  async waitForTitle(title: string | RegExp): Promise<void> {
    await this.helpers.expectTitle(title);
  }

  /**
   * 清理页面状态
   */
  async cleanup(): Promise<void> {
    await this.helpers.clearStorage();
  }
}