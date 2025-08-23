import { test, expect } from '@playwright/test';
import { TasksPage } from '../../pages/tasks-page';
import { LoginPage } from '../../pages/login-page';
import { TestDataGenerator } from '../../utils/test-helpers';

/**
 * 任务功能E2E测试
 * 
 * 测试任务浏览、搜索、筛选、申请等核心功能
 */
test.describe('任务大厅', () => {
  let tasksPage: TasksPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
    loginPage = new LoginPage(page);
    
    // 登录用户
    await loginPage.goto();
    const email = process.env.TEST_USER_EMAIL || 'test@phoenixcoder.com';
    const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
    await loginPage.login(email, password);
    await loginPage.waitForLoginSuccess();
    
    // 导航到任务页面
    await tasksPage.goto();
  });

  test.afterEach(async ({ page }) => {
    await tasksPage.cleanup();
  });

  test('应该显示任务列表', async () => {
    await expect(tasksPage.isTasksPage()).resolves.toBe(true);
    
    const tasks = await tasksPage.getTaskList();
    expect(tasks.length).toBeGreaterThan(0);
    
    // 验证任务卡片包含必要信息
    const firstTask = tasks[0];
    expect(firstTask.title).toBeTruthy();
    expect(firstTask.reward).toBeTruthy();
    expect(firstTask.deadline).toBeTruthy();
  });

  test('应该支持任务搜索', async () => {
    const searchTerm = 'Python';
    await tasksPage.searchTasks(searchTerm);
    
    const tasks = await tasksPage.getTaskList();
    
    // 验证搜索结果包含搜索关键词
    for (const task of tasks) {
      const containsSearchTerm = 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
      expect(containsSearchTerm).toBe(true);
    }
  });

  test('应该支持按技能筛选', async () => {
    const skill = 'JavaScript';
    await tasksPage.filterBySkill(skill);
    
    const tasks = await tasksPage.getTaskList();
    
    // 验证筛选结果包含指定技能
    for (const task of tasks) {
      expect(task.skills).toContain(skill);
    }
  });

  test('应该支持按报酬范围筛选', async () => {
    const minReward = 1000;
    const maxReward = 5000;
    
    await tasksPage.filterByReward(minReward, maxReward);
    
    const tasks = await tasksPage.getTaskList();
    
    // 验证筛选结果在报酬范围内
    for (const task of tasks) {
      const reward = parseInt(task.reward.replace(/[^\d]/g, ''));
      expect(reward).toBeGreaterThanOrEqual(minReward);
      expect(reward).toBeLessThanOrEqual(maxReward);
    }
  });

  test('应该支持按截止时间筛选', async () => {
    const days = 7; // 7天内
    await tasksPage.filterByDeadline(days);
    
    const tasks = await tasksPage.getTaskList();
    const now = new Date();
    const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    // 验证筛选结果在时间范围内
    for (const task of tasks) {
      const deadline = new Date(task.deadline);
      expect(deadline.getTime()).toBeLessThanOrEqual(targetDate.getTime());
    }
  });

  test('应该支持任务排序', async () => {
    // 按报酬降序排序
    await tasksPage.sortTasks('reward', 'desc');
    
    const tasks = await tasksPage.getTaskList();
    
    // 验证排序结果
    for (let i = 0; i < tasks.length - 1; i++) {
      const currentReward = parseInt(tasks[i].reward.replace(/[^\d]/g, ''));
      const nextReward = parseInt(tasks[i + 1].reward.replace(/[^\d]/g, ''));
      expect(currentReward).toBeGreaterThanOrEqual(nextReward);
    }
  });

  test('应该支持分页', async () => {
    // 获取第一页任务
    const firstPageTasks = await tasksPage.getTaskList();
    
    // 如果有下一页，测试分页功能
    if (await tasksPage.hasNextPage()) {
      await tasksPage.goToNextPage();
      const secondPageTasks = await tasksPage.getTaskList();
      
      // 验证第二页任务与第一页不同
      expect(secondPageTasks[0].id).not.toBe(firstPageTasks[0].id);
      
      // 返回第一页
      await tasksPage.goToPreviousPage();
      const backToFirstPage = await tasksPage.getTaskList();
      expect(backToFirstPage[0].id).toBe(firstPageTasks[0].id);
    }
  });

  test('应该显示任务详情', async () => {
    const tasks = await tasksPage.getTaskList();
    const firstTask = tasks[0];
    
    await tasksPage.viewTaskDetails(firstTask.id);
    
    // 验证任务详情页面
    await expect(tasksPage.isTaskDetailsPage()).resolves.toBe(true);
    
    const taskDetails = await tasksPage.getTaskDetails();
    expect(taskDetails.title).toBe(firstTask.title);
    expect(taskDetails.description).toBeTruthy();
    expect(taskDetails.requirements).toBeTruthy();
  });

  test('应该支持任务申请', async () => {
    const tasks = await tasksPage.getTaskList();
    const applicableTask = tasks.find(task => task.canApply);
    
    if (applicableTask) {
      await tasksPage.viewTaskDetails(applicableTask.id);
      
      const proposal = TestDataGenerator.generateTaskProposal();
      await tasksPage.applyForTask(proposal);
      
      // 验证申请成功
      await tasksPage.helpers.expectVisible('[data-testid="application-success"]');
      
      // 验证按钮状态变化
      expect(await tasksPage.isTaskApplied()).toBe(true);
    }
  });

  test('应该处理空搜索结果', async () => {
    const nonExistentTerm = 'NonExistentTechnology12345';
    await tasksPage.searchTasks(nonExistentTerm);
    
    // 验证显示空状态
    await tasksPage.helpers.expectVisible('[data-testid="empty-state"]');
    
    const emptyMessage = await tasksPage.getEmptyStateMessage();
    expect(emptyMessage).toContain('没有找到相关任务');
  });

  test('应该清除筛选条件', async () => {
    // 应用多个筛选条件
    await tasksPage.searchTasks('Python');
    await tasksPage.filterBySkill('JavaScript');
    await tasksPage.filterByReward(1000, 5000);
    
    // 清除筛选
    await tasksPage.clearFilters();
    
    // 验证筛选条件已清除
    const searchValue = await tasksPage.getSearchValue();
    expect(searchValue).toBe('');
    
    const activeFilters = await tasksPage.getActiveFilters();
    expect(activeFilters.length).toBe(0);
  });

  test('应该显示任务统计信息', async () => {
    const stats = await tasksPage.getTaskStats();
    
    expect(stats.total).toBeGreaterThan(0);
    expect(stats.available).toBeGreaterThanOrEqual(0);
    expect(stats.inProgress).toBeGreaterThanOrEqual(0);
    expect(stats.completed).toBeGreaterThanOrEqual(0);
  });

  test('应该支持任务收藏', async () => {
    const tasks = await tasksPage.getTaskList();
    const firstTask = tasks[0];
    
    await tasksPage.toggleTaskFavorite(firstTask.id);
    
    // 验证收藏状态
    expect(await tasksPage.isTaskFavorited(firstTask.id)).toBe(true);
    
    // 取消收藏
    await tasksPage.toggleTaskFavorite(firstTask.id);
    expect(await tasksPage.isTaskFavorited(firstTask.id)).toBe(false);
  });
});

/**
 * 任务创建和管理测试
 */
test.describe('任务管理', () => {
  let tasksPage: TasksPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
    loginPage = new LoginPage(page);
    
    // 登录发布者账户
    await loginPage.goto();
    const email = process.env.TEST_PUBLISHER_EMAIL || 'publisher@phoenixcoder.com';
    const password = process.env.TEST_PUBLISHER_PASSWORD || 'PublisherPassword123!';
    await loginPage.login(email, password);
    await loginPage.waitForLoginSuccess();
    
    await tasksPage.goto();
  });

  test('应该创建新任务', async () => {
    const taskData = TestDataGenerator.generateTaskData();
    
    await tasksPage.createTask(taskData);
    
    // 验证任务创建成功
    await tasksPage.helpers.expectVisible('[data-testid="task-created-success"]');
    
    // 验证任务出现在列表中
    const tasks = await tasksPage.getTaskList();
    const createdTask = tasks.find(task => task.title === taskData.title);
    expect(createdTask).toBeDefined();
  });

  test('应该编辑现有任务', async () => {
    const tasks = await tasksPage.getMyTasks();
    const taskToEdit = tasks[0];
    
    const updatedData = {
      title: `${taskToEdit.title} - 已更新`,
      description: '更新后的任务描述',
      reward: taskToEdit.reward + 500
    };
    
    await tasksPage.editTask(taskToEdit.id, updatedData);
    
    // 验证任务更新成功
    await tasksPage.helpers.expectVisible('[data-testid="task-updated-success"]');
    
    // 验证更新后的信息
    const updatedTask = await tasksPage.getTaskById(taskToEdit.id);
    expect(updatedTask.title).toBe(updatedData.title);
  });

  test('应该删除任务', async () => {
    const tasks = await tasksPage.getMyTasks();
    const taskToDelete = tasks[tasks.length - 1]; // 删除最后一个任务
    
    await tasksPage.deleteTask(taskToDelete.id);
    
    // 验证删除确认对话框
    await tasksPage.helpers.expectVisible('[data-testid="delete-confirmation"]');
    await tasksPage.confirmDeleteTask();
    
    // 验证任务删除成功
    await tasksPage.helpers.expectVisible('[data-testid="task-deleted-success"]');
    
    // 验证任务不再出现在列表中
    const remainingTasks = await tasksPage.getMyTasks();
    const deletedTask = remainingTasks.find(task => task.id === taskToDelete.id);
    expect(deletedTask).toBeUndefined();
  });

  test('应该管理任务申请', async () => {
    const tasks = await tasksPage.getMyTasks();
    const taskWithApplications = tasks.find(task => task.applicationCount > 0);
    
    if (taskWithApplications) {
      await tasksPage.viewTaskApplications(taskWithApplications.id);
      
      const applications = await tasksPage.getTaskApplications();
      expect(applications.length).toBeGreaterThan(0);
      
      // 接受第一个申请
      const firstApplication = applications[0];
      await tasksPage.acceptApplication(firstApplication.id);
      
      // 验证申请状态更新
      await tasksPage.helpers.expectVisible('[data-testid="application-accepted"]');
    }
  });
});

/**
 * 任务状态和工作流测试
 */
test.describe('任务工作流', () => {
  let tasksPage: TasksPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
    loginPage = new LoginPage(page);
  });

  test('应该跟踪任务状态变化', async () => {
    // 登录发布者
    await loginPage.goto();
    const publisherEmail = process.env.TEST_PUBLISHER_EMAIL || 'publisher@phoenixcoder.com';
    const publisherPassword = process.env.TEST_PUBLISHER_PASSWORD || 'PublisherPassword123!';
    await loginPage.login(publisherEmail, publisherPassword);
    await loginPage.waitForLoginSuccess();
    
    await tasksPage.goto();
    
    // 创建任务
    const taskData = TestDataGenerator.generateTaskData();
    await tasksPage.createTask(taskData);
    
    const tasks = await tasksPage.getMyTasks();
    const newTask = tasks.find(task => task.title === taskData.title);
    
    // 验证初始状态
    expect(newTask.status).toBe('open');
    
    // 模拟任务申请和接受流程
    await loginPage.logout();
    
    // 登录申请者
    const applicantEmail = process.env.TEST_USER_EMAIL || 'test@phoenixcoder.com';
    const applicantPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
    await loginPage.login(applicantEmail, applicantPassword);
    await loginPage.waitForLoginSuccess();
    
    // 申请任务
    await tasksPage.goto();
    await tasksPage.viewTaskDetails(newTask.id);
    
    const proposal = TestDataGenerator.generateTaskProposal();
    await tasksPage.applyForTask(proposal);
    
    // 切换回发布者账户
    await loginPage.logout();
    await loginPage.login(publisherEmail, publisherPassword);
    await loginPage.waitForLoginSuccess();
    
    // 接受申请
    await tasksPage.goto();
    await tasksPage.viewTaskApplications(newTask.id);
    
    const applications = await tasksPage.getTaskApplications();
    await tasksPage.acceptApplication(applications[0].id);
    
    // 验证任务状态变为进行中
    const updatedTask = await tasksPage.getTaskById(newTask.id);
    expect(updatedTask.status).toBe('in_progress');
  });

  test('应该处理任务完成流程', async () => {
    // 这里可以测试任务完成、验收、付款等流程
    // 由于涉及复杂的状态变化，这里只做基本框架
    
    // 登录有进行中任务的用户
    await loginPage.goto();
    const email = process.env.TEST_USER_EMAIL || 'test@phoenixcoder.com';
    const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
    await loginPage.login(email, password);
    await loginPage.waitForLoginSuccess();
    
    await tasksPage.goto();
    
    // 获取进行中的任务
    const inProgressTasks = await tasksPage.getMyInProgressTasks();
    
    if (inProgressTasks.length > 0) {
      const task = inProgressTasks[0];
      
      // 提交任务完成
      await tasksPage.submitTaskCompletion(task.id, {
        deliverables: '任务交付物描述',
        notes: '完成说明'
      });
      
      // 验证提交成功
      await tasksPage.helpers.expectVisible('[data-testid="task-submitted"]');
      
      // 验证任务状态变为待验收
      const submittedTask = await tasksPage.getTaskById(task.id);
      expect(submittedTask.status).toBe('submitted');
    }
  });
});

/**
 * 响应式和移动端测试
 */
test.describe('任务页面响应式设计', () => {
  let tasksPage: TasksPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
    loginPage = new LoginPage(page);
    
    await loginPage.goto();
    const email = process.env.TEST_USER_EMAIL || 'test@phoenixcoder.com';
    const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
    await loginPage.login(email, password);
    await loginPage.waitForLoginSuccess();
    
    await tasksPage.goto();
  });

  test('应该在移动端正确显示', async () => {
    await tasksPage.helpers.setViewportSize(375, 667); // iPhone SE
    
    // 验证移动端布局
    await tasksPage.helpers.expectVisible('[data-testid="mobile-task-list"]');
    
    // 验证任务卡片在移动端的显示
    const tasks = await tasksPage.getTaskList();
    expect(tasks.length).toBeGreaterThan(0);
    
    // 测试移动端筛选功能
    await tasksPage.helpers.clickElement('[data-testid="mobile-filter-button"]');
    await tasksPage.helpers.expectVisible('[data-testid="mobile-filter-panel"]');
  });

  test('应该在平板端正确显示', async () => {
    await tasksPage.helpers.setViewportSize(768, 1024); // iPad
    
    // 验证平板端布局
    const tasks = await tasksPage.getTaskList();
    expect(tasks.length).toBeGreaterThan(0);
    
    // 验证侧边栏筛选在平板端的显示
    await tasksPage.helpers.expectVisible('[data-testid="sidebar-filters"]');
  });
});

/**
 * 性能测试
 */
test.describe('任务页面性能', () => {
  let tasksPage: TasksPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
    loginPage = new LoginPage(page);
    
    await loginPage.goto();
    const email = process.env.TEST_USER_EMAIL || 'test@phoenixcoder.com';
    const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
    await loginPage.login(email, password);
    await loginPage.waitForLoginSuccess();
  });

  test('应该快速加载任务列表', async () => {
    const startTime = Date.now();
    await tasksPage.goto();
    
    // 等待任务列表加载完成
    await tasksPage.helpers.waitForElement('[data-testid="task-list"]');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3秒内加载完成
  });

  test('应该快速响应搜索', async () => {
    await tasksPage.goto();
    
    const startTime = Date.now();
    await tasksPage.searchTasks('Python');
    
    // 等待搜索结果
    await tasksPage.helpers.waitForElement('[data-testid="search-results"]');
    
    const searchTime = Date.now() - startTime;
    expect(searchTime).toBeLessThan(2000); // 2秒内返回搜索结果
  });
});