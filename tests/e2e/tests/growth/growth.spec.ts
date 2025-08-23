import { test, expect } from '@playwright/test';
import { BasePage } from '../../pages/base-page';
import { LoginPage } from '../../pages/login-page';
import { TestDataGenerator } from '../../utils/test-helpers';

/**
 * 用户成长页面对象模型
 */
class GrowthPage extends BasePage {
  constructor(page: any) {
    super(page);
  }

  async goto() {
    await this.navigateTo('/growth');
  }

  async isGrowthPage() {
    return await this.isCurrentUrl(/\/growth/);
  }

  // 技能图谱相关方法
  async getSkillRadar() {
    await this.waitForElement('[data-testid="skill-radar"]');
    const radar = await this.page.locator('[data-testid="skill-radar"]');
    return {
      frontend: await radar.locator('[data-skill="frontend"]').getAttribute('data-value'),
      backend: await radar.locator('[data-skill="backend"]').getAttribute('data-value'),
      database: await radar.locator('[data-skill="database"]').getAttribute('data-value'),
      devops: await radar.locator('[data-skill="devops"]').getAttribute('data-value'),
      mobile: await radar.locator('[data-skill="mobile"]').getAttribute('data-value'),
      ai: await radar.locator('[data-skill="ai"]').getAttribute('data-value')
    };
  }

  async getSkillDetails(skillName: string) {
    await this.clickElement(`[data-testid="skill-${skillName}"]`);
    await this.waitForElement('[data-testid="skill-details"]');
    
    return {
      level: await this.getTextContent('[data-testid="skill-level"]'),
      experience: await this.getTextContent('[data-testid="skill-experience"]'),
      projects: await this.getTextContent('[data-testid="skill-projects"]'),
      nextLevelRequirement: await this.getTextContent('[data-testid="next-level-requirement"]')
    };
  }

  // 勋章系统相关方法
  async getBadges() {
    await this.waitForElement('[data-testid="badges-container"]');
    const badges = await this.page.locator('[data-testid="badge-item"]').all();
    
    const badgeList = [];
    for (const badge of badges) {
      badgeList.push({
        id: await badge.getAttribute('data-badge-id'),
        name: await badge.locator('[data-testid="badge-name"]').textContent(),
        description: await badge.locator('[data-testid="badge-description"]').textContent(),
        earned: await badge.getAttribute('data-earned') === 'true',
        earnedDate: await badge.locator('[data-testid="badge-date"]').textContent(),
        rarity: await badge.getAttribute('data-rarity')
      });
    }
    
    return badgeList;
  }

  async getBadgeDetails(badgeId: string) {
    await this.clickElement(`[data-badge-id="${badgeId}"]`);
    await this.waitForElement('[data-testid="badge-modal"]');
    
    return {
      name: await this.getTextContent('[data-testid="badge-modal-name"]'),
      description: await this.getTextContent('[data-testid="badge-modal-description"]'),
      requirements: await this.getTextContent('[data-testid="badge-requirements"]'),
      progress: await this.getTextContent('[data-testid="badge-progress"]'),
      tips: await this.getTextContent('[data-testid="badge-tips"]')
    };
  }

  async closeBadgeModal() {
    await this.clickElement('[data-testid="badge-modal-close"]');
  }

  // 成长记录相关方法
  async getGrowthTimeline() {
    await this.waitForElement('[data-testid="growth-timeline"]');
    const items = await this.page.locator('[data-testid="timeline-item"]').all();
    
    const timeline = [];
    for (const item of items) {
      timeline.push({
        date: await item.locator('[data-testid="timeline-date"]').textContent(),
        type: await item.getAttribute('data-type'),
        title: await item.locator('[data-testid="timeline-title"]').textContent(),
        description: await item.locator('[data-testid="timeline-description"]').textContent(),
        points: await item.locator('[data-testid="timeline-points"]').textContent()
      });
    }
    
    return timeline;
  }

  async filterTimelineByType(type: string) {
    await this.clickElement(`[data-testid="timeline-filter-${type}"]`);
    await this.waitForElement('[data-testid="growth-timeline"]');
  }

  async filterTimelineByDateRange(startDate: string, endDate: string) {
    await this.clickElement('[data-testid="timeline-date-filter"]');
    await this.fillInput('[data-testid="start-date"]', startDate);
    await this.fillInput('[data-testid="end-date"]', endDate);
    await this.clickElement('[data-testid="apply-date-filter"]');
  }

  // 挑战系统相关方法
  async getChallenges() {
    await this.waitForElement('[data-testid="challenges-container"]');
    const challenges = await this.page.locator('[data-testid="challenge-item"]').all();
    
    const challengeList = [];
    for (const challenge of challenges) {
      challengeList.push({
        id: await challenge.getAttribute('data-challenge-id'),
        title: await challenge.locator('[data-testid="challenge-title"]').textContent(),
        description: await challenge.locator('[data-testid="challenge-description"]').textContent(),
        difficulty: await challenge.getAttribute('data-difficulty'),
        points: await challenge.locator('[data-testid="challenge-points"]').textContent(),
        deadline: await challenge.locator('[data-testid="challenge-deadline"]').textContent(),
        status: await challenge.getAttribute('data-status'),
        progress: await challenge.locator('[data-testid="challenge-progress"]').getAttribute('data-value')
      });
    }
    
    return challengeList;
  }

  async acceptChallenge(challengeId: string) {
    await this.clickElement(`[data-challenge-id="${challengeId}"] [data-testid="accept-challenge"]`);
    await this.waitForElement('[data-testid="challenge-accepted"]');
  }

  async submitChallengeProgress(challengeId: string, progress: any) {
    await this.clickElement(`[data-challenge-id="${challengeId}"] [data-testid="submit-progress"]`);
    await this.waitForElement('[data-testid="progress-modal"]');
    
    if (progress.description) {
      await this.fillInput('[data-testid="progress-description"]', progress.description);
    }
    
    if (progress.files) {
      await this.uploadFiles('[data-testid="progress-files"]', progress.files);
    }
    
    if (progress.links) {
      for (const link of progress.links) {
        await this.fillInput('[data-testid="progress-link"]', link);
        await this.clickElement('[data-testid="add-link"]');
      }
    }
    
    await this.clickElement('[data-testid="submit-progress-btn"]');
    await this.waitForElement('[data-testid="progress-submitted"]');
  }

  // 成长统计相关方法
  async getGrowthStats() {
    await this.waitForElement('[data-testid="growth-stats"]');
    
    return {
      totalPoints: await this.getTextContent('[data-testid="total-points"]'),
      level: await this.getTextContent('[data-testid="user-level"]'),
      rank: await this.getTextContent('[data-testid="user-rank"]'),
      completedTasks: await this.getTextContent('[data-testid="completed-tasks"]'),
      earnedBadges: await this.getTextContent('[data-testid="earned-badges"]'),
      activeChallenges: await this.getTextContent('[data-testid="active-challenges"]'),
      skillsCount: await this.getTextContent('[data-testid="skills-count"]'),
      monthlyGrowth: await this.getTextContent('[data-testid="monthly-growth"]')
    };
  }

  async getLeaderboard() {
    await this.clickElement('[data-testid="leaderboard-tab"]');
    await this.waitForElement('[data-testid="leaderboard"]');
    
    const items = await this.page.locator('[data-testid="leaderboard-item"]').all();
    const leaderboard = [];
    
    for (const item of items) {
      leaderboard.push({
        rank: await item.locator('[data-testid="user-rank"]').textContent(),
        username: await item.locator('[data-testid="username"]').textContent(),
        points: await item.locator('[data-testid="user-points"]').textContent(),
        level: await item.locator('[data-testid="user-level"]').textContent(),
        avatar: await item.locator('[data-testid="user-avatar"]').getAttribute('src')
      });
    }
    
    return leaderboard;
  }

  // 导出功能
  async exportGrowthReport(format: 'pdf' | 'json' | 'csv') {
    await this.clickElement('[data-testid="export-report"]');
    await this.waitForElement('[data-testid="export-modal"]');
    
    await this.clickElement(`[data-testid="export-${format}"]`);
    await this.clickElement('[data-testid="confirm-export"]');
    
    // 等待下载开始
    await this.waitForElement('[data-testid="export-started"]');
  }
}

/**
 * 用户成长功能E2E测试
 */
test.describe('用户成长系统', () => {
  let growthPage: GrowthPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    growthPage = new GrowthPage(page);
    loginPage = new LoginPage(page);
    
    // 登录用户
    await loginPage.goto();
    const email = process.env.TEST_USER_EMAIL || 'test@phoenixcoder.com';
    const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
    await loginPage.login(email, password);
    await loginPage.waitForLoginSuccess();
    
    // 导航到成长页面
    await growthPage.goto();
  });

  test.afterEach(async ({ page }) => {
    await growthPage.cleanup();
  });

  test('应该显示成长页面', async () => {
    await expect(growthPage.isGrowthPage()).resolves.toBe(true);
    
    // 验证页面基本元素
    await growthPage.helpers.expectVisible('[data-testid="growth-stats"]');
    await growthPage.helpers.expectVisible('[data-testid="skill-radar"]');
    await growthPage.helpers.expectVisible('[data-testid="badges-container"]');
    await growthPage.helpers.expectVisible('[data-testid="growth-timeline"]');
  });

  test('应该显示用户成长统计', async () => {
    const stats = await growthPage.getGrowthStats();
    
    expect(stats.totalPoints).toBeTruthy();
    expect(stats.level).toBeTruthy();
    expect(stats.completedTasks).toBeTruthy();
    expect(stats.earnedBadges).toBeTruthy();
    
    // 验证数值格式
    expect(parseInt(stats.totalPoints.replace(/[^\d]/g, ''))).toBeGreaterThanOrEqual(0);
    expect(parseInt(stats.level.replace(/[^\d]/g, ''))).toBeGreaterThan(0);
  });

  test('应该显示技能雷达图', async () => {
    const skillRadar = await growthPage.getSkillRadar();
    
    // 验证技能数据
    expect(skillRadar.frontend).toBeTruthy();
    expect(skillRadar.backend).toBeTruthy();
    expect(skillRadar.database).toBeTruthy();
    expect(skillRadar.devops).toBeTruthy();
    expect(skillRadar.mobile).toBeTruthy();
    expect(skillRadar.ai).toBeTruthy();
    
    // 验证技能值在合理范围内
    Object.values(skillRadar).forEach(value => {
      const numValue = parseInt(value as string);
      expect(numValue).toBeGreaterThanOrEqual(0);
      expect(numValue).toBeLessThanOrEqual(100);
    });
  });

  test('应该显示技能详情', async () => {
    const skillDetails = await growthPage.getSkillDetails('frontend');
    
    expect(skillDetails.level).toBeTruthy();
    expect(skillDetails.experience).toBeTruthy();
    expect(skillDetails.projects).toBeTruthy();
    expect(skillDetails.nextLevelRequirement).toBeTruthy();
    
    // 验证等级格式
    expect(skillDetails.level).toMatch(/级|Level|Lv\./i);
  });

  test('应该显示勋章系统', async () => {
    const badges = await growthPage.getBadges();
    
    expect(badges.length).toBeGreaterThan(0);
    
    // 验证勋章数据结构
    badges.forEach(badge => {
      expect(badge.id).toBeTruthy();
      expect(badge.name).toBeTruthy();
      expect(badge.description).toBeTruthy();
      expect(typeof badge.earned).toBe('boolean');
      expect(['common', 'rare', 'epic', 'legendary']).toContain(badge.rarity);
    });
    
    // 验证至少有一些已获得的勋章
    const earnedBadges = badges.filter(badge => badge.earned);
    expect(earnedBadges.length).toBeGreaterThan(0);
  });

  test('应该显示勋章详情', async () => {
    const badges = await growthPage.getBadges();
    const firstBadge = badges[0];
    
    const badgeDetails = await growthPage.getBadgeDetails(firstBadge.id);
    
    expect(badgeDetails.name).toBe(firstBadge.name);
    expect(badgeDetails.description).toBeTruthy();
    expect(badgeDetails.requirements).toBeTruthy();
    
    if (!firstBadge.earned) {
      expect(badgeDetails.progress).toBeTruthy();
      expect(badgeDetails.tips).toBeTruthy();
    }
    
    await growthPage.closeBadgeModal();
  });

  test('应该显示成长时间线', async () => {
    const timeline = await growthPage.getGrowthTimeline();
    
    expect(timeline.length).toBeGreaterThan(0);
    
    // 验证时间线数据结构
    timeline.forEach(item => {
      expect(item.date).toBeTruthy();
      expect(item.type).toBeTruthy();
      expect(item.title).toBeTruthy();
      expect(item.description).toBeTruthy();
      expect(['task_completed', 'badge_earned', 'level_up', 'challenge_completed', 'skill_improved']).toContain(item.type);
    });
    
    // 验证时间线按时间倒序排列
    for (let i = 0; i < timeline.length - 1; i++) {
      const currentDate = new Date(timeline[i].date);
      const nextDate = new Date(timeline[i + 1].date);
      expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
    }
  });

  test('应该支持时间线筛选', async () => {
    // 按类型筛选
    await growthPage.filterTimelineByType('badge_earned');
    
    const filteredTimeline = await growthPage.getGrowthTimeline();
    filteredTimeline.forEach(item => {
      expect(item.type).toBe('badge_earned');
    });
    
    // 按日期范围筛选
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    await growthPage.filterTimelineByDateRange(startDate, endDate);
    
    const dateFilteredTimeline = await growthPage.getGrowthTimeline();
    dateFilteredTimeline.forEach(item => {
      const itemDate = new Date(item.date);
      expect(itemDate.getTime()).toBeGreaterThanOrEqual(new Date(startDate).getTime());
      expect(itemDate.getTime()).toBeLessThanOrEqual(new Date(endDate).getTime());
    });
  });

  test('应该显示排行榜', async () => {
    const leaderboard = await growthPage.getLeaderboard();
    
    expect(leaderboard.length).toBeGreaterThan(0);
    
    // 验证排行榜数据结构
    leaderboard.forEach((user, index) => {
      expect(user.rank).toBe((index + 1).toString());
      expect(user.username).toBeTruthy();
      expect(user.points).toBeTruthy();
      expect(user.level).toBeTruthy();
    });
    
    // 验证排行榜按积分降序排列
    for (let i = 0; i < leaderboard.length - 1; i++) {
      const currentPoints = parseInt(leaderboard[i].points.replace(/[^\d]/g, ''));
      const nextPoints = parseInt(leaderboard[i + 1].points.replace(/[^\d]/g, ''));
      expect(currentPoints).toBeGreaterThanOrEqual(nextPoints);
    }
  });
});

/**
 * 挑战系统测试
 */
test.describe('挑战系统', () => {
  let growthPage: GrowthPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    growthPage = new GrowthPage(page);
    loginPage = new LoginPage(page);
    
    await loginPage.goto();
    const email = process.env.TEST_USER_EMAIL || 'test@phoenixcoder.com';
    const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
    await loginPage.login(email, password);
    await loginPage.waitForLoginSuccess();
    
    await growthPage.goto();
    await growthPage.clickElement('[data-testid="challenges-tab"]');
  });

  test('应该显示可用挑战', async () => {
    const challenges = await growthPage.getChallenges();
    
    expect(challenges.length).toBeGreaterThan(0);
    
    // 验证挑战数据结构
    challenges.forEach(challenge => {
      expect(challenge.id).toBeTruthy();
      expect(challenge.title).toBeTruthy();
      expect(challenge.description).toBeTruthy();
      expect(['easy', 'medium', 'hard', 'expert']).toContain(challenge.difficulty);
      expect(challenge.points).toBeTruthy();
      expect(['available', 'accepted', 'in_progress', 'completed', 'expired']).toContain(challenge.status);
    });
  });

  test('应该接受挑战', async () => {
    const challenges = await growthPage.getChallenges();
    const availableChallenge = challenges.find(c => c.status === 'available');
    
    if (availableChallenge) {
      await growthPage.acceptChallenge(availableChallenge.id);
      
      // 验证挑战状态更新
      const updatedChallenges = await growthPage.getChallenges();
      const acceptedChallenge = updatedChallenges.find(c => c.id === availableChallenge.id);
      expect(acceptedChallenge.status).toBe('accepted');
    }
  });

  test('应该提交挑战进度', async () => {
    const challenges = await growthPage.getChallenges();
    const inProgressChallenge = challenges.find(c => c.status === 'in_progress');
    
    if (inProgressChallenge) {
      const progress = {
        description: '完成了挑战的第一阶段，实现了基本功能',
        links: ['https://github.com/user/project', 'https://demo.example.com']
      };
      
      await growthPage.submitChallengeProgress(inProgressChallenge.id, progress);
      
      // 验证进度提交成功
      await growthPage.helpers.expectVisible('[data-testid="progress-submitted"]');
    }
  });
});

/**
 * 成长报告导出测试
 */
test.describe('成长报告导出', () => {
  let growthPage: GrowthPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    growthPage = new GrowthPage(page);
    loginPage = new LoginPage(page);
    
    await loginPage.goto();
    const email = process.env.TEST_USER_EMAIL || 'test@phoenixcoder.com';
    const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
    await loginPage.login(email, password);
    await loginPage.waitForLoginSuccess();
    
    await growthPage.goto();
  });

  test('应该导出PDF格式报告', async () => {
    await growthPage.exportGrowthReport('pdf');
    
    // 验证导出开始
    await growthPage.helpers.expectVisible('[data-testid="export-started"]');
  });

  test('应该导出JSON格式报告', async () => {
    await growthPage.exportGrowthReport('json');
    
    await growthPage.helpers.expectVisible('[data-testid="export-started"]');
  });

  test('应该导出CSV格式报告', async () => {
    await growthPage.exportGrowthReport('csv');
    
    await growthPage.helpers.expectVisible('[data-testid="export-started"]');
  });
});

/**
 * 响应式设计测试
 */
test.describe('成长页面响应式设计', () => {
  let growthPage: GrowthPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    growthPage = new GrowthPage(page);
    loginPage = new LoginPage(page);
    
    await loginPage.goto();
    const email = process.env.TEST_USER_EMAIL || 'test@phoenixcoder.com';
    const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
    await loginPage.login(email, password);
    await loginPage.waitForLoginSuccess();
    
    await growthPage.goto();
  });

  test('应该在移动端正确显示', async () => {
    await growthPage.helpers.setViewportSize(375, 667);
    
    // 验证移动端布局
    await growthPage.helpers.expectVisible('[data-testid="mobile-growth-layout"]');
    
    // 验证技能雷达图在移动端的显示
    await growthPage.helpers.expectVisible('[data-testid="skill-radar"]');
    
    // 验证勋章在移动端的网格布局
    await growthPage.helpers.expectVisible('[data-testid="mobile-badges-grid"]');
  });

  test('应该在平板端正确显示', async () => {
    await growthPage.helpers.setViewportSize(768, 1024);
    
    // 验证平板端布局
    const stats = await growthPage.getGrowthStats();
    expect(stats.totalPoints).toBeTruthy();
    
    // 验证技能雷达图在平板端的显示
    const skillRadar = await growthPage.getSkillRadar();
    expect(skillRadar.frontend).toBeTruthy();
  });
});

/**
 * 性能测试
 */
test.describe('成长页面性能', () => {
  let growthPage: GrowthPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    growthPage = new GrowthPage(page);
    loginPage = new LoginPage(page);
    
    await loginPage.goto();
    const email = process.env.TEST_USER_EMAIL || 'test@phoenixcoder.com';
    const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
    await loginPage.login(email, password);
    await loginPage.waitForLoginSuccess();
  });

  test('应该快速加载成长页面', async () => {
    const startTime = Date.now();
    await growthPage.goto();
    
    // 等待关键元素加载完成
    await growthPage.helpers.waitForElement('[data-testid="growth-stats"]');
    await growthPage.helpers.waitForElement('[data-testid="skill-radar"]');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3秒内加载完成
  });

  test('应该快速渲染技能雷达图', async () => {
    await growthPage.goto();
    
    const startTime = Date.now();
    await growthPage.getSkillRadar();
    
    const renderTime = Date.now() - startTime;
    expect(renderTime).toBeLessThan(1000); // 1秒内渲染完成
  });
});