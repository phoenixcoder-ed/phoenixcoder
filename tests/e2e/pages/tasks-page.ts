import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

/**
 * 任务页面对象模型
 * 
 * 封装任务列表和任务详情页面的元素和操作方法
 */
export class TasksPage extends BasePage {
  // 任务列表页面元素
  private readonly tasksList = '[data-testid="tasks-list"]';
  private readonly taskCard = '[data-testid="task-card"]';
  private readonly taskTitle = '[data-testid="task-title"]';
  private readonly taskDescription = '[data-testid="task-description"]';
  private readonly taskReward = '[data-testid="task-reward"]';
  private readonly taskDeadline = '[data-testid="task-deadline"]';
  private readonly taskSkills = '[data-testid="task-skills"]';
  private readonly taskStatus = '[data-testid="task-status"]';
  
  // 筛选和搜索
  private readonly searchInput = '[data-testid="search-input"]';
  private readonly searchButton = '[data-testid="search-button"]';
  private readonly filterButton = '[data-testid="filter-button"]';
  private readonly filterPanel = '[data-testid="filter-panel"]';
  private readonly skillFilter = '[data-testid="skill-filter"]';
  private readonly rewardFilter = '[data-testid="reward-filter"]';
  private readonly statusFilter = '[data-testid="status-filter"]';
  private readonly deadlineFilter = '[data-testid="deadline-filter"]';
  private readonly clearFiltersButton = '[data-testid="clear-filters-button"]';
  private readonly applyFiltersButton = '[data-testid="apply-filters-button"]';
  
  // 排序
  private readonly sortDropdown = '[data-testid="sort-dropdown"]';
  private readonly sortByReward = '[data-testid="sort-by-reward"]';
  private readonly sortByDeadline = '[data-testid="sort-by-deadline"]';
  private readonly sortByCreated = '[data-testid="sort-by-created"]';
  
  // 分页
  private readonly pagination = '[data-testid="pagination"]';
  private readonly prevPageButton = '[data-testid="prev-page-button"]';
  private readonly nextPageButton = '[data-testid="next-page-button"]';
  private readonly pageNumber = '[data-testid="page-number"]';
  
  // 任务操作
  private readonly createTaskButton = '[data-testid="create-task-button"]';
  private readonly viewTaskButton = '[data-testid="view-task-button"]';
  private readonly applyTaskButton = '[data-testid="apply-task-button"]';
  private readonly editTaskButton = '[data-testid="edit-task-button"]';
  private readonly deleteTaskButton = '[data-testid="delete-task-button"]';
  
  // 任务详情页面元素
  private readonly taskDetail = '[data-testid="task-detail"]';
  private readonly taskDetailTitle = '[data-testid="task-detail-title"]';
  private readonly taskDetailDescription = '[data-testid="task-detail-description"]';
  private readonly taskDetailReward = '[data-testid="task-detail-reward"]';
  private readonly taskDetailDeadline = '[data-testid="task-detail-deadline"]';
  private readonly taskDetailSkills = '[data-testid="task-detail-skills"]';
  private readonly taskDetailRequirements = '[data-testid="task-detail-requirements"]';
  private readonly taskDetailContact = '[data-testid="task-detail-contact"]';
  private readonly taskDetailPublisher = '[data-testid="task-detail-publisher"]';
  
  // 任务申请
  private readonly applicationForm = '[data-testid="application-form"]';
  private readonly applicationMessage = '[data-testid="application-message"]';
  private readonly submitApplicationButton = '[data-testid="submit-application-button"]';
  private readonly applicationSuccess = '[data-testid="application-success"]';
  
  // 空状态
  private readonly emptyState = '[data-testid="empty-state"]';
  private readonly noTasksMessage = '[data-testid="no-tasks-message"]';

  constructor(page: Page) {
    super(page);
  }

  /**
   * 获取任务页面URL
   */
  getUrl(): string {
    return '/tasks';
  }

  /**
   * 等待任务页面加载完成
   */
  async waitForPageLoad(): Promise<void> {
    await super.waitForPageLoad();
    // 等待任务列表或空状态出现
    await Promise.race([
      this.helpers.waitForVisible(this.tasksList),
      this.helpers.waitForVisible(this.emptyState)
    ]);
  }

  /**
   * 获取任务列表
   */
  async getTaskCards(): Promise<Locator[]> {
    await this.helpers.waitForVisible(this.tasksList);
    return await this.page.locator(this.taskCard).all();
  }

  /**
   * 获取任务数量
   */
  async getTaskCount(): Promise<number> {
    const tasks = await this.getTaskCards();
    return tasks.length;
  }

  /**
   * 检查是否有任务
   */
  async hasTasks(): Promise<boolean> {
    return await this.isElementVisible(this.tasksList);
  }

  /**
   * 检查是否为空状态
   */
  async isEmpty(): Promise<boolean> {
    return await this.isElementVisible(this.emptyState);
  }

  /**
   * 搜索任务
   */
  async searchTasks(keyword: string): Promise<void> {
    await this.fillInput(this.searchInput, keyword);
    await this.page.click(this.searchButton);
    await this.waitForPageLoad();
  }

  /**
   * 清空搜索
   */
  async clearSearch(): Promise<void> {
    await this.fillInput(this.searchInput, '');
    await this.page.click(this.searchButton);
    await this.waitForPageLoad();
  }

  /**
   * 打开筛选面板
   */
  async openFilterPanel(): Promise<void> {
    await this.page.click(this.filterButton);
    await this.helpers.waitForVisible(this.filterPanel);
  }

  /**
   * 关闭筛选面板
   */
  async closeFilterPanel(): Promise<void> {
    await this.page.click(this.filterButton);
    await this.helpers.waitForHidden(this.filterPanel);
  }

  /**
   * 按技能筛选
   */
  async filterBySkill(skill: string): Promise<void> {
    await this.openFilterPanel();
    await this.page.selectOption(this.skillFilter, skill);
    await this.page.click(this.applyFiltersButton);
    await this.waitForPageLoad();
  }

  /**
   * 按报酬筛选
   */
  async filterByReward(minReward: number, maxReward: number): Promise<void> {
    await this.openFilterPanel();
    await this.fillInput(`${this.rewardFilter} input[name="min-reward"]`, minReward.toString());
    await this.fillInput(`${this.rewardFilter} input[name="max-reward"]`, maxReward.toString());
    await this.page.click(this.applyFiltersButton);
    await this.waitForPageLoad();
  }

  /**
   * 按状态筛选
   */
  async filterByStatus(status: string): Promise<void> {
    await this.openFilterPanel();
    await this.page.selectOption(this.statusFilter, status);
    await this.page.click(this.applyFiltersButton);
    await this.waitForPageLoad();
  }

  /**
   * 清空筛选条件
   */
  async clearFilters(): Promise<void> {
    await this.openFilterPanel();
    await this.page.click(this.clearFiltersButton);
    await this.page.click(this.applyFiltersButton);
    await this.waitForPageLoad();
  }

  /**
   * 按报酬排序
   */
  async sortByReward(order: 'asc' | 'desc' = 'desc'): Promise<void> {
    await this.page.click(this.sortDropdown);
    await this.page.click(`${this.sortByReward}[data-order="${order}"]`);
    await this.waitForPageLoad();
  }

  /**
   * 按截止时间排序
   */
  async sortByDeadline(order: 'asc' | 'desc' = 'asc'): Promise<void> {
    await this.page.click(this.sortDropdown);
    await this.page.click(`${this.sortByDeadline}[data-order="${order}"]`);
    await this.waitForPageLoad();
  }

  /**
   * 按创建时间排序
   */
  async sortByCreated(order: 'asc' | 'desc' = 'desc'): Promise<void> {
    await this.page.click(this.sortDropdown);
    await this.page.click(`${this.sortByCreated}[data-order="${order}"]`);
    await this.waitForPageLoad();
  }

  /**
   * 点击任务卡片查看详情
   */
  async viewTaskDetail(taskIndex: number): Promise<void> {
    const tasks = await this.getTaskCards();
    if (taskIndex < tasks.length) {
      await tasks[taskIndex].click();
      await this.helpers.waitForVisible(this.taskDetail);
    }
  }

  /**
   * 通过标题查看任务详情
   */
  async viewTaskByTitle(title: string): Promise<void> {
    const taskCard = this.page.locator(this.taskCard).filter({ hasText: title });
    await taskCard.click();
    await this.helpers.waitForVisible(this.taskDetail);
  }

  /**
   * 申请任务
   */
  async applyForTask(taskIndex: number, message?: string): Promise<void> {
    await this.viewTaskDetail(taskIndex);
    await this.page.click(this.applyTaskButton);
    await this.helpers.waitForVisible(this.applicationForm);
    
    if (message) {
      await this.fillInput(this.applicationMessage, message);
    }
    
    await this.page.click(this.submitApplicationButton);
    await this.helpers.waitForVisible(this.applicationSuccess);
  }

  /**
   * 创建新任务
   */
  async createTask(): Promise<void> {
    await this.page.click(this.createTaskButton);
    // 等待导航到创建任务页面
    await this.page.waitForURL('**/tasks/create');
  }

  /**
   * 编辑任务
   */
  async editTask(taskIndex: number): Promise<void> {
    await this.viewTaskDetail(taskIndex);
    await this.page.click(this.editTaskButton);
    // 等待导航到编辑任务页面
    await this.page.waitForURL('**/tasks/*/edit');
  }

  /**
   * 删除任务
   */
  async deleteTask(taskIndex: number): Promise<void> {
    await this.viewTaskDetail(taskIndex);
    await this.page.click(this.deleteTaskButton);
    await this.confirmAction();
    await this.waitForPageLoad();
  }

  /**
   * 获取任务信息
   */
  async getTaskInfo(taskIndex: number): Promise<{
    title: string;
    description: string;
    reward: string;
    deadline: string;
    skills: string[];
    status: string;
  }> {
    const tasks = await this.getTaskCards();
    const task = tasks[taskIndex];
    
    const title = await task.locator(this.taskTitle).textContent() || '';
    const description = await task.locator(this.taskDescription).textContent() || '';
    const reward = await task.locator(this.taskReward).textContent() || '';
    const deadline = await task.locator(this.taskDeadline).textContent() || '';
    const status = await task.locator(this.taskStatus).textContent() || '';
    
    const skillElements = await task.locator(`${this.taskSkills} .skill-tag`).all();
    const skills = await Promise.all(skillElements.map(el => el.textContent()));
    
    return {
      title,
      description,
      reward,
      deadline,
      skills: skills.filter(Boolean) as string[],
      status
    };
  }

  /**
   * 获取任务详情信息
   */
  async getTaskDetailInfo(): Promise<{
    title: string;
    description: string;
    reward: string;
    deadline: string;
    skills: string[];
    requirements: string;
    contact: string;
    publisher: string;
  }> {
    await this.helpers.waitForVisible(this.taskDetail);
    
    const title = await this.helpers.getText(this.taskDetailTitle) || '';
    const description = await this.helpers.getText(this.taskDetailDescription) || '';
    const reward = await this.helpers.getText(this.taskDetailReward) || '';
    const deadline = await this.helpers.getText(this.taskDetailDeadline) || '';
    const requirements = await this.helpers.getText(this.taskDetailRequirements) || '';
    const contact = await this.helpers.getText(this.taskDetailContact) || '';
    const publisher = await this.helpers.getText(this.taskDetailPublisher) || '';
    
    const skillElements = await this.page.locator(`${this.taskDetailSkills} .skill-tag`).all();
    const skills = await Promise.all(skillElements.map(el => el.textContent()));
    
    return {
      title,
      description,
      reward,
      deadline,
      skills: skills.filter(Boolean) as string[],
      requirements,
      contact,
      publisher
    };
  }

  /**
   * 翻页
   */
  async goToNextPage(): Promise<void> {
    if (await this.isElementClickable(this.nextPageButton)) {
      await this.page.click(this.nextPageButton);
      await this.waitForPageLoad();
    }
  }

  /**
   * 上一页
   */
  async goToPrevPage(): Promise<void> {
    if (await this.isElementClickable(this.prevPageButton)) {
      await this.page.click(this.prevPageButton);
      await this.waitForPageLoad();
    }
  }

  /**
   * 跳转到指定页面
   */
  async goToPage(pageNum: number): Promise<void> {
    const pageButton = this.page.locator(`${this.pageNumber}[data-page="${pageNum}"]`);
    if (await pageButton.isVisible()) {
      await pageButton.click();
      await this.waitForPageLoad();
    }
  }

  /**
   * 获取当前页码
   */
  async getCurrentPage(): Promise<number> {
    const activePageElement = this.page.locator(`${this.pageNumber}.active`);
    const pageText = await activePageElement.textContent();
    return parseInt(pageText || '1', 10);
  }

  /**
   * 检查任务是否可申请
   */
  async isTaskApplicable(taskIndex: number): Promise<boolean> {
    await this.viewTaskDetail(taskIndex);
    return await this.isElementVisible(this.applyTaskButton);
  }

  /**
   * 检查任务是否可编辑
   */
  async isTaskEditable(taskIndex: number): Promise<boolean> {
    await this.viewTaskDetail(taskIndex);
    return await this.isElementVisible(this.editTaskButton);
  }

  /**
   * 检查任务是否可删除
   */
  async isTaskDeletable(taskIndex: number): Promise<boolean> {
    await this.viewTaskDetail(taskIndex);
    return await this.isElementVisible(this.deleteTaskButton);
  }

  /**
   * 等待任务加载完成
   */
  async waitForTasksLoad(): Promise<void> {
    await this.helpers.waitForAPI('/api/tasks');
    await this.waitForPageLoad();
  }

  /**
   * 刷新任务列表
   */
  async refreshTasks(): Promise<void> {
    await this.refresh();
    await this.waitForTasksLoad();
  }
}