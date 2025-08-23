#!/usr/bin/env node

/**
 * PhoenixCoder 智能测试覆盖率监控脚本
 * 
 * 功能：
 * 1. 实时监控各项目的测试覆盖率
 * 2. 生成统一的覆盖率报告
 * 3. 覆盖率阈值检查和告警
 * 4. 支持多种报告格式输出
 * 5. 集成CI/CD流水线
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { CoverageMonitor } = require('./coverage-config');

// 颜色输出工具
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// 日志工具
class Logger {
  static info(message) {
    console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
  }
  
  static success(message) {
    console.log(`${colors.green}✅${colors.reset} ${message}`);
  }
  
  static warning(message) {
    console.log(`${colors.yellow}⚠️${colors.reset} ${message}`);
  }
  
  static error(message) {
    console.log(`${colors.red}❌${colors.reset} ${message}`);
  }
  
  static debug(message) {
    if (process.env.DEBUG) {
      console.log(`${colors.magenta}🐛${colors.reset} ${message}`);
    }
  }
}

// 项目配置
const PROJECTS = {
  backend: {
    name: '后端服务',
    path: './apps/community/server',
    type: 'python',
    testCommand: 'python -m pytest --cov=. --cov-report=html --cov-report=xml --cov-report=json --cov-report=lcov --cov-report=term',
    coverageFile: '.coverage',
    reportPath: './coverage-reports/backend'
  },
  oidcServer: {
    name: 'OIDC服务',
    path: './apps/community/oidc-server',
    type: 'python',
    testCommand: 'python -m pytest --cov=. --cov-report=html --cov-report=xml --cov-report=json --cov-report=lcov --cov-report=term',
    coverageFile: '.coverage',
    reportPath: './coverage-reports/oidcServer'
  },
  frontend: {
    name: '管理前端',
    path: './apps/community/admin',
    type: 'node',
    testCommand: 'pnpm run test:coverage',
    coverageFile: './coverage/coverage-final.json',
    reportPath: './coverage-reports/frontend'
  },
  miniapp: {
    name: '微信小程序',
    path: './apps/community/miniapp',
    type: 'node',
    testCommand: 'pnpm run test:coverage',
    coverageFile: './coverage/coverage-final.json',
    reportPath: './coverage-reports/miniapp'
  }
};

// 覆盖率监控器
class CoverageMonitorRunner {
  constructor() {
    this.monitor = new CoverageMonitor();
    this.results = {};
    this.startTime = Date.now();
  }
  
  // 运行单个项目的测试覆盖率
  async runProjectCoverage(projectKey) {
    const project = PROJECTS[projectKey];
    if (!project) {
      throw new Error(`未找到项目配置: ${projectKey}`);
    }
    
    Logger.info(`开始运行 ${project.name} 的测试覆盖率...`);
    
    try {
      // 切换到项目目录
      const originalCwd = process.cwd();
      process.chdir(project.path);
      
      // 运行测试命令
      const startTime = Date.now();
      const output = execSync(project.testCommand, {
        encoding: 'utf8',
        stdio: 'pipe',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      const duration = Date.now() - startTime;
      
      // 恢复原始目录
      process.chdir(originalCwd);
      
      // 解析覆盖率结果
      const coverage = await this.parseCoverageResult(projectKey, project);
      
      this.results[projectKey] = {
        project: project.name,
        coverage,
        duration,
        status: 'success',
        output: output.substring(0, 1000), // 限制输出长度
        timestamp: new Date().toISOString()
      };
      
      Logger.success(`${project.name} 测试覆盖率完成 (${duration}ms)`);
      
      return this.results[projectKey];
    } catch (error) {
      process.chdir(process.cwd()); // 确保恢复目录
      
      this.results[projectKey] = {
        project: project.name,
        coverage: null,
        duration: 0,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      Logger.error(`${project.name} 测试覆盖率失败: ${error.message}`);
      throw error;
    }
  }
  
  // 解析覆盖率结果
  async parseCoverageResult(projectKey, project) {
    try {
      if (project.type === 'python') {
        return await this.parsePythonCoverage(projectKey, project);
      } else {
        return await this.parseNodeCoverage(projectKey, project);
      }
    } catch (error) {
      Logger.warning(`解析 ${project.name} 覆盖率结果失败: ${error.message}`);
      return {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0
      };
    }
  }
  
  // 解析Python覆盖率结果
  async parsePythonCoverage(projectKey, project) {
    const jsonPath = path.join(project.reportPath, 'coverage.json');
    
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`覆盖率JSON文件不存在: ${jsonPath}`);
    }
    
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const totals = data.totals;
    
    return {
      lines: this.calculatePercentage(totals.covered_lines, totals.num_statements),
      functions: this.calculatePercentage(totals.covered_lines, totals.num_statements), // Python没有函数覆盖率，使用行覆盖率
      branches: this.calculatePercentage(totals.covered_branches, totals.num_branches),
      statements: this.calculatePercentage(totals.covered_lines, totals.num_statements)
    };
  }
  
  // 解析Node.js覆盖率结果
  async parseNodeCoverage(projectKey, project) {
    const jsonPath = path.join(project.path, 'coverage/coverage-summary.json');
    
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`覆盖率摘要文件不存在: ${jsonPath}`);
    }
    
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const total = data.total;
    
    return {
      lines: total.lines.pct,
      functions: total.functions.pct,
      branches: total.branches.pct,
      statements: total.statements.pct
    };
  }
  
  // 计算百分比
  calculatePercentage(covered, total) {
    if (total === 0) return 0;
    return Math.round((covered / total) * 100 * 100) / 100;
  }
  
  // 运行所有项目的覆盖率测试
  async runAllProjects(options = {}) {
    const { parallel = false, projects = Object.keys(PROJECTS) } = options;
    
    Logger.info(`开始运行 ${projects.length} 个项目的测试覆盖率...`);
    
    if (parallel) {
      // 并行运行
      const promises = projects.map(projectKey => 
        this.runProjectCoverage(projectKey).catch(error => {
          Logger.error(`项目 ${projectKey} 运行失败: ${error.message}`);
          return null;
        })
      );
      
      await Promise.all(promises);
    } else {
      // 串行运行
      for (const projectKey of projects) {
        try {
          await this.runProjectCoverage(projectKey);
        } catch (error) {
          Logger.error(`项目 ${projectKey} 运行失败，继续下一个项目...`);
        }
      }
    }
    
    return this.results;
  }
  
  // 检查覆盖率阈值
  checkThresholds() {
    const thresholdResults = {};
    
    Object.keys(this.results).forEach(projectKey => {
      const result = this.results[projectKey];
      if (result.status === 'success' && result.coverage) {
        const check = this.monitor.checkThresholds(projectKey, result.coverage);
        thresholdResults[projectKey] = check;
        
        if (check.passed) {
          Logger.success(`${result.project} 覆盖率检查通过`);
        } else {
          Logger.warning(`${result.project} 覆盖率检查失败: ${check.message}`);
        }
      }
    });
    
    return thresholdResults;
  }
  
  // 生成覆盖率报告
  generateReport(format = 'console') {
    const totalDuration = Date.now() - this.startTime;
    
    switch (format) {
      case 'console':
        this.generateConsoleReport(totalDuration);
        break;
      case 'json':
        return this.generateJsonReport(totalDuration);
      case 'html':
        this.generateHtmlReport(totalDuration);
        break;
      case 'markdown':
        return this.generateMarkdownReport(totalDuration);
      default:
        throw new Error(`不支持的报告格式: ${format}`);
    }
  }
  
  // 生成控制台报告
  generateConsoleReport(totalDuration) {
    console.log('\n' + '='.repeat(80));
    console.log(`${colors.bright}${colors.cyan}📊 PhoenixCoder 测试覆盖率报告${colors.reset}`);
    console.log('='.repeat(80));
    console.log(`🕒 总耗时: ${totalDuration}ms`);
    console.log(`📅 生成时间: ${new Date().toLocaleString('zh-CN')}`);
    console.log('');
    
    // 项目覆盖率表格
    console.log(`${colors.bright}项目覆盖率统计:${colors.reset}`);
    console.log('┌─────────────────┬──────────┬──────────┬──────────┬──────────┬────────┐');
    console.log('│ 项目名称        │ 行覆盖率 │ 函数覆盖 │ 分支覆盖 │ 语句覆盖 │ 状态   │');
    console.log('├─────────────────┼──────────┼──────────┼──────────┼──────────┼────────┤');
    
    Object.keys(this.results).forEach(projectKey => {
      const result = this.results[projectKey];
      const project = PROJECTS[projectKey];
      
      if (result.status === 'success' && result.coverage) {
        const c = result.coverage;
        const status = this.getStatusIcon(c.lines);
        console.log(`│ ${project.name.padEnd(15)} │ ${c.lines.toFixed(1).padStart(7)}% │ ${c.functions.toFixed(1).padStart(7)}% │ ${c.branches.toFixed(1).padStart(7)}% │ ${c.statements.toFixed(1).padStart(7)}% │ ${status.padEnd(6)} │`);
      } else {
        console.log(`│ ${project.name.padEnd(15)} │ ${'--'.padStart(8)} │ ${'--'.padStart(8)} │ ${'--'.padStart(8)} │ ${'--'.padStart(8)} │ ${'❌'.padEnd(6)} │`);
      }
    });
    
    console.log('└─────────────────┴──────────┴──────────┴──────────┴──────────┴────────┘');
    
    // 总体统计
    const successCount = Object.values(this.results).filter(r => r.status === 'success').length;
    const totalCount = Object.keys(this.results).length;
    const avgCoverage = this.calculateAverageCoverage();
    
    console.log('');
    console.log(`${colors.bright}总体统计:${colors.reset}`);
    console.log(`📈 成功项目: ${successCount}/${totalCount}`);
    console.log(`📊 平均覆盖率: ${avgCoverage.toFixed(1)}%`);
    console.log(`⏱️  平均耗时: ${Math.round(totalDuration / totalCount)}ms`);
    
    console.log('\n' + '='.repeat(80));
  }
  
  // 获取状态图标
  getStatusIcon(coverage) {
    if (coverage >= 80) return '✅';
    if (coverage >= 70) return '⚠️';
    return '❌';
  }
  
  // 计算平均覆盖率
  calculateAverageCoverage() {
    const successResults = Object.values(this.results).filter(r => r.status === 'success' && r.coverage);
    if (successResults.length === 0) return 0;
    
    const totalCoverage = successResults.reduce((sum, result) => sum + result.coverage.lines, 0);
    return totalCoverage / successResults.length;
  }
  
  // 生成JSON报告
  generateJsonReport(totalDuration) {
    const report = {
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      summary: {
        totalProjects: Object.keys(this.results).length,
        successfulProjects: Object.values(this.results).filter(r => r.status === 'success').length,
        averageCoverage: this.calculateAverageCoverage()
      },
      projects: this.results,
      thresholds: this.checkThresholds()
    };
    
    const reportPath = './coverage-reports/coverage-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    Logger.success(`JSON报告已生成: ${reportPath}`);
    
    return report;
  }
  
  // 生成HTML报告
  generateHtmlReport(totalDuration) {
    // 更新HTML模板中的数据
    const reportPath = './coverage-reports/index.html';
    
    // 这里可以使用模板引擎或直接替换占位符
    // 为了简化，我们直接生成基础的HTML报告
    this.monitor.generateCombinedReport();
    
    Logger.success(`HTML报告已生成: ${reportPath}`);
  }
  
  // 生成Markdown报告
  generateMarkdownReport(totalDuration) {
    let markdown = `# 📊 PhoenixCoder 测试覆盖率报告\n\n`;
    markdown += `**生成时间:** ${new Date().toLocaleString('zh-CN')}\n`;
    markdown += `**总耗时:** ${totalDuration}ms\n\n`;
    
    markdown += `## 📈 覆盖率统计\n\n`;
    markdown += `| 项目名称 | 行覆盖率 | 函数覆盖率 | 分支覆盖率 | 语句覆盖率 | 状态 |\n`;
    markdown += `|----------|----------|------------|------------|------------|------|\n`;
    
    Object.keys(this.results).forEach(projectKey => {
      const result = this.results[projectKey];
      const project = PROJECTS[projectKey];
      
      if (result.status === 'success' && result.coverage) {
        const c = result.coverage;
        const badge = this.monitor.generateBadge(projectKey, c.lines);
        markdown += `| ${project.name} | ${c.lines.toFixed(1)}% | ${c.functions.toFixed(1)}% | ${c.branches.toFixed(1)}% | ${c.statements.toFixed(1)}% | ${badge.markdown} |\n`;
      } else {
        markdown += `| ${project.name} | -- | -- | -- | -- | ❌ |\n`;
      }
    });
    
    markdown += `\n## 📊 总体统计\n\n`;
    const successCount = Object.values(this.results).filter(r => r.status === 'success').length;
    const totalCount = Object.keys(this.results).length;
    const avgCoverage = this.calculateAverageCoverage();
    
    markdown += `- **成功项目:** ${successCount}/${totalCount}\n`;
    markdown += `- **平均覆盖率:** ${avgCoverage.toFixed(1)}%\n`;
    markdown += `- **平均耗时:** ${Math.round(totalDuration / totalCount)}ms\n`;
    
    const reportPath = './coverage-reports/coverage-report.md';
    fs.writeFileSync(reportPath, markdown);
    Logger.success(`Markdown报告已生成: ${reportPath}`);
    
    return markdown;
  }
  
  // 监听模式
  async watchMode() {
    Logger.info('启动覆盖率监听模式...');
    
    const chokidar = require('chokidar');
    
    // 监听源代码变化
    const watchPaths = Object.values(PROJECTS).map(project => 
      path.join(project.path, '**/*.{py,js,ts,tsx,vue}')
    );
    
    const watcher = chokidar.watch(watchPaths, {
      ignored: /(^|[\/\\])\../, // 忽略隐藏文件
      persistent: true
    });
    
    let debounceTimer;
    
    watcher.on('change', (filePath) => {
      Logger.info(`文件变化: ${filePath}`);
      
      // 防抖处理
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        try {
          // 确定变化的项目
          const changedProject = this.detectChangedProject(filePath);
          if (changedProject) {
            Logger.info(`重新运行 ${PROJECTS[changedProject].name} 的测试覆盖率...`);
            await this.runProjectCoverage(changedProject);
            this.generateReport('console');
          }
        } catch (error) {
          Logger.error(`监听模式执行失败: ${error.message}`);
        }
      }, 2000); // 2秒防抖
    });
    
    Logger.success('覆盖率监听模式已启动，按 Ctrl+C 退出');
    
    // 优雅退出
    process.on('SIGINT', () => {
      Logger.info('正在关闭监听模式...');
      watcher.close();
      process.exit(0);
    });
  }
  
  // 检测变化的项目
  detectChangedProject(filePath) {
    for (const [projectKey, project] of Object.entries(PROJECTS)) {
      if (filePath.includes(project.path.replace('./', ''))) {
        return projectKey;
      }
    }
    return null;
  }
}

// 命令行接口
class CLI {
  static async run() {
    const args = process.argv.slice(2);
    const command = args[0] || 'run';
    
    const monitor = new CoverageMonitorRunner();
    
    try {
      switch (command) {
        case 'run':
          await CLI.runCommand(monitor, args.slice(1));
          break;
        case 'watch':
          await monitor.watchMode();
          break;
        case 'report':
          await CLI.reportCommand(monitor, args.slice(1));
          break;
        case 'init':
          await CLI.initCommand();
          break;
        case 'help':
        case '--help':
        case '-h':
          CLI.showHelp();
          break;
        default:
          Logger.error(`未知命令: ${command}`);
          CLI.showHelp();
          process.exit(1);
      }
    } catch (error) {
      Logger.error(`执行失败: ${error.message}`);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }
  
  static async runCommand(monitor, args) {
    const options = CLI.parseOptions(args);
    
    await monitor.runAllProjects(options);
    monitor.generateReport(options.format || 'console');
    
    if (options.json) {
      monitor.generateReport('json');
    }
    
    if (options.markdown) {
      monitor.generateReport('markdown');
    }
    
    // 检查阈值
    const thresholdResults = monitor.checkThresholds();
    const hasFailures = Object.values(thresholdResults).some(result => !result.passed);
    
    if (hasFailures && options.failOnThreshold) {
      Logger.error('覆盖率阈值检查失败');
      process.exit(1);
    }
  }
  
  static async reportCommand(monitor, args) {
    const format = args[0] || 'console';
    
    // 尝试从已有的报告文件加载数据
    const reportFile = './coverage-reports/coverage-report.json';
    if (fs.existsSync(reportFile)) {
      const data = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
      monitor.results = data.projects;
    }
    
    monitor.generateReport(format);
  }
  
  static async initCommand() {
    Logger.info('初始化覆盖率监控系统...');
    
    const coverageMonitor = new CoverageMonitor();
    coverageMonitor.initialize();
    
    Logger.success('覆盖率监控系统初始化完成');
  }
  
  static parseOptions(args) {
    const options = {
      parallel: false,
      projects: Object.keys(PROJECTS),
      format: 'console',
      json: false,
      markdown: false,
      failOnThreshold: false
    };
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--parallel':
        case '-p':
          options.parallel = true;
          break;
        case '--projects':
          options.projects = args[++i].split(',');
          break;
        case '--format':
        case '-f':
          options.format = args[++i];
          break;
        case '--json':
          options.json = true;
          break;
        case '--markdown':
        case '--md':
          options.markdown = true;
          break;
        case '--fail-on-threshold':
          options.failOnThreshold = true;
          break;
      }
    }
    
    return options;
  }
  
  static showHelp() {
    console.log(`
${colors.bright}${colors.cyan}📊 PhoenixCoder 覆盖率监控工具${colors.reset}
`);
    console.log('用法:');
    console.log('  node coverage-monitor.js <command> [options]\n');
    
    console.log('命令:');
    console.log('  run      运行测试覆盖率 (默认)');
    console.log('  watch    监听模式，文件变化时自动运行');
    console.log('  report   生成覆盖率报告');
    console.log('  init     初始化覆盖率监控系统');
    console.log('  help     显示帮助信息\n');
    
    console.log('选项:');
    console.log('  --parallel, -p           并行运行测试');
    console.log('  --projects <list>        指定项目列表 (逗号分隔)');
    console.log('  --format, -f <format>    报告格式 (console|json|html|markdown)');
    console.log('  --json                   生成JSON报告');
    console.log('  --markdown, --md         生成Markdown报告');
    console.log('  --fail-on-threshold      阈值检查失败时退出\n');
    
    console.log('示例:');
    console.log('  node coverage-monitor.js run --parallel --json');
    console.log('  node coverage-monitor.js run --projects backend,frontend');
    console.log('  node coverage-monitor.js watch');
    console.log('  node coverage-monitor.js report markdown\n');
  }
}

// 如果直接运行此文件
if (require.main === module) {
  CLI.run();
}

module.exports = {
  CoverageMonitorRunner,
  CLI,
  PROJECTS,
  Logger
};