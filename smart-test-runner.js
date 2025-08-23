#!/usr/bin/env node

/**
 * PhoenixCoder 智能测试运行器
 * 
 * 功能：
 * 1. 智能测试选择和执行
 * 2. 并行测试运行
 * 3. 失败重试机制
 * 4. 测试依赖分析
 * 5. 增量测试执行
 * 6. 性能监控和优化
 * 7. 测试结果聚合和报告
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// 项目配置
const PROJECT_CONFIG = {
  backend: {
    name: 'Backend (Python)',
    path: './apps/community/server',
    testCommand: 'python -m pytest',
    testPattern: 'tests/**/*.py',
    coverageCommand: 'python -m pytest --cov=. --cov-report=json',
    language: 'python',
    framework: 'pytest'
  },
  oidc: {
    name: 'OIDC Service (Python)',
    path: './apps/community/oidc-server',
    testCommand: 'python -m pytest',
    testPattern: 'tests/**/*.py',
    coverageCommand: 'python -m pytest --cov=. --cov-report=json',
    language: 'python',
    framework: 'pytest'
  },
  admin: {
    name: 'Admin Frontend (React)',
    path: './apps/community/admin',
    testCommand: 'pnpm run test',
    testPattern: 'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
    coverageCommand: 'pnpm run test:coverage',
    language: 'typescript',
    framework: 'vitest'
  },
  miniapp: {
    name: 'MiniApp (Taro)',
    path: './apps/community/miniapp',
    testCommand: 'pnpm run test',
    testPattern: 'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
    coverageCommand: 'pnpm run test:coverage',
    language: 'typescript',
    framework: 'vitest'
  }
};

// 测试类型配置
const TEST_TYPES = {
  unit: {
    name: '单元测试',
    pattern: '**/*.test.*',
    timeout: 30000,
    parallel: true,
    priority: 1
  },
  integration: {
    name: '集成测试',
    pattern: '**/*.integration.*',
    timeout: 60000,
    parallel: false,
    priority: 2
  },
  e2e: {
    name: '端到端测试',
    pattern: '**/*.e2e.*',
    timeout: 120000,
    parallel: false,
    priority: 3
  },
  performance: {
    name: '性能测试',
    pattern: '**/*.perf.*',
    timeout: 180000,
    parallel: false,
    priority: 4
  }
};

// 智能测试运行器类
class SmartTestRunner {
  constructor(options = {}) {
    this.options = {
      parallel: true,
      maxRetries: 3,
      timeout: 300000, // 5分钟
      verbose: false,
      coverage: false,
      watch: false,
      incremental: false,
      failFast: false,
      ...options
    };
    
    this.results = {
      projects: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
        coverage: null
      },
      startTime: null,
      endTime: null
    };
    
    this.gitInfo = null;
    this.changedFiles = [];
    this.testQueue = [];
    this.runningTests = new Map();
  }
  
  // 运行测试
  async run(projects = [], testTypes = [], options = {}) {
    this.results.startTime = new Date();
    
    try {
      console.log('🚀 启动智能测试运行器\n');
      
      // 合并选项
      this.options = { ...this.options, ...options };
      
      // 初始化Git信息
      await this.initializeGitInfo();
      
      // 选择要运行的项目
      const selectedProjects = this.selectProjects(projects);
      
      // 选择要运行的测试类型
      const selectedTestTypes = this.selectTestTypes(testTypes);
      
      // 分析测试依赖
      await this.analyzeTestDependencies(selectedProjects, selectedTestTypes);
      
      // 构建测试队列
      this.buildTestQueue(selectedProjects, selectedTestTypes);
      
      // 执行测试
      await this.executeTests();
      
      // 生成报告
      await this.generateReport();
      
      // 检查结果
      this.checkResults();
      
    } catch (error) {
      console.error(`❌ 测试运行失败: ${error.message}`);
      if (this.options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    } finally {
      this.results.endTime = new Date();
      this.results.summary.duration = this.results.endTime - this.results.startTime;
    }
  }
  
  // 初始化Git信息
  async initializeGitInfo() {
    try {
      const { stdout: branch } = await execAsync('git rev-parse --abbrev-ref HEAD');
      const { stdout: commit } = await execAsync('git rev-parse HEAD');
      const { stdout: author } = await execAsync('git log -1 --pretty=format:"%an"');
      
      this.gitInfo = {
        branch: branch.trim(),
        commit: commit.trim().substring(0, 8),
        author: author.trim().replace(/"/g, '')
      };
      
      // 获取变更文件（如果是增量测试）
      if (this.options.incremental) {
        await this.getChangedFiles();
      }
      
    } catch (error) {
      console.warn('⚠️  无法获取Git信息，跳过增量测试功能');
      this.gitInfo = null;
    }
  }
  
  // 获取变更文件
  async getChangedFiles() {
    try {
      // 获取与主分支的差异
      const { stdout } = await execAsync('git diff --name-only origin/main...HEAD');
      this.changedFiles = stdout.trim().split('\n').filter(file => file.length > 0);
      
      if (this.changedFiles.length > 0) {
        console.log(`📝 检测到 ${this.changedFiles.length} 个变更文件`);
        if (this.options.verbose) {
          this.changedFiles.forEach(file => console.log(`   - ${file}`));
        }
      }
    } catch (error) {
      console.warn('⚠️  无法获取变更文件列表');
      this.changedFiles = [];
    }
  }
  
  // 选择项目
  selectProjects(projects) {
    if (projects.length === 0) {
      return Object.keys(PROJECT_CONFIG);
    }
    
    const validProjects = projects.filter(project => PROJECT_CONFIG[project]);
    const invalidProjects = projects.filter(project => !PROJECT_CONFIG[project]);
    
    if (invalidProjects.length > 0) {
      console.warn(`⚠️  无效的项目: ${invalidProjects.join(', ')}`);
    }
    
    return validProjects;
  }
  
  // 选择测试类型
  selectTestTypes(testTypes) {
    if (testTypes.length === 0) {
      return ['unit']; // 默认只运行单元测试
    }
    
    const validTypes = testTypes.filter(type => TEST_TYPES[type]);
    const invalidTypes = testTypes.filter(type => !TEST_TYPES[type]);
    
    if (invalidTypes.length > 0) {
      console.warn(`⚠️  无效的测试类型: ${invalidTypes.join(', ')}`);
    }
    
    return validTypes;
  }
  
  // 分析测试依赖
  async analyzeTestDependencies(projects, testTypes) {
    console.log('🔍 分析测试依赖关系...');
    
    for (const projectKey of projects) {
      const project = PROJECT_CONFIG[projectKey];
      
      // 检查项目是否存在
      if (!fs.existsSync(project.path)) {
        console.warn(`⚠️  项目路径不存在: ${project.path}`);
        continue;
      }
      
      // 检查测试文件
      const testFiles = await this.findTestFiles(project, testTypes);
      
      if (testFiles.length === 0) {
        console.warn(`⚠️  项目 ${projectKey} 没有找到测试文件`);
        continue;
      }
      
      // 增量测试过滤
      let filteredTestFiles = testFiles;
      if (this.options.incremental && this.changedFiles.length > 0) {
        filteredTestFiles = this.filterTestsByChanges(testFiles, projectKey);
      }
      
      this.results.projects[projectKey] = {
        config: project,
        testFiles: filteredTestFiles,
        status: 'pending',
        results: null,
        duration: 0,
        retries: 0
      };
    }
  }
  
  // 查找测试文件
  async findTestFiles(project, testTypes) {
    const testFiles = [];
    
    for (const testType of testTypes) {
      const typeConfig = TEST_TYPES[testType];
      const pattern = typeConfig.pattern;
      
      try {
        const { stdout } = await execAsync(`find ${project.path} -name "${pattern}" -type f`);
        const files = stdout.trim().split('\n').filter(file => file.length > 0);
        
        files.forEach(file => {
          testFiles.push({
            path: file,
            type: testType,
            config: typeConfig
          });
        });
      } catch (error) {
        // 忽略查找错误
      }
    }
    
    return testFiles;
  }
  
  // 根据变更过滤测试
  filterTestsByChanges(testFiles, projectKey) {
    const project = PROJECT_CONFIG[projectKey];
    const projectPath = project.path;
    
    // 检查项目内是否有变更
    const hasProjectChanges = this.changedFiles.some(file => 
      file.startsWith(projectPath.replace('./', ''))
    );
    
    if (!hasProjectChanges) {
      console.log(`⏭️  项目 ${projectKey} 无变更，跳过测试`);
      return [];
    }
    
    // 如果有变更，运行所有测试（简化版本）
    // 更复杂的实现可以分析具体的依赖关系
    return testFiles;
  }
  
  // 构建测试队列
  buildTestQueue(projects, testTypes) {
    console.log('📋 构建测试执行队列...');
    
    // 按优先级排序测试类型
    const sortedTestTypes = testTypes.sort((a, b) => 
      TEST_TYPES[a].priority - TEST_TYPES[b].priority
    );
    
    // 构建队列
    for (const testType of sortedTestTypes) {
      const typeConfig = TEST_TYPES[testType];
      
      for (const projectKey of projects) {
        const projectData = this.results.projects[projectKey];
        if (!projectData || projectData.testFiles.length === 0) continue;
        
        const testFilesForType = projectData.testFiles.filter(file => file.type === testType);
        if (testFilesForType.length === 0) continue;
        
        this.testQueue.push({
          projectKey,
          testType,
          testFiles: testFilesForType,
          config: typeConfig,
          canRunInParallel: typeConfig.parallel && this.options.parallel
        });
      }
    }
    
    console.log(`📊 测试队列包含 ${this.testQueue.length} 个任务`);
  }
  
  // 执行测试
  async executeTests() {
    console.log('\n🧪 开始执行测试...\n');
    
    const maxConcurrency = this.options.parallel ? 4 : 1;
    const promises = [];
    
    while (this.testQueue.length > 0 || this.runningTests.size > 0) {
      // 启动新的测试任务
      while (this.runningTests.size < maxConcurrency && this.testQueue.length > 0) {
        const task = this.testQueue.shift();
        
        // 检查是否可以并行运行
        if (!task.canRunInParallel && this.runningTests.size > 0) {
          // 等待当前任务完成
          this.testQueue.unshift(task);
          break;
        }
        
        const promise = this.executeTestTask(task);
        this.runningTests.set(task, promise);
        promises.push(promise);
      }
      
      // 等待至少一个任务完成
      if (this.runningTests.size > 0) {
        const completedTask = await Promise.race(this.runningTests.values());
        
        // 清理已完成的任务
        for (const [task, promise] of this.runningTests.entries()) {
          if (promise === completedTask) {
            this.runningTests.delete(task);
            break;
          }
        }
        
        // 检查是否需要快速失败
        if (this.options.failFast && completedTask.status === 'failed') {
          console.log('⚡ 快速失败模式：停止剩余测试');
          break;
        }
      }
    }
    
    // 等待所有任务完成
    await Promise.allSettled(promises);
  }
  
  // 执行单个测试任务
  async executeTestTask(task) {
    const { projectKey, testType, testFiles, config } = task;
    const project = PROJECT_CONFIG[projectKey];
    const projectData = this.results.projects[projectKey];
    
    console.log(`🔄 运行 ${project.name} - ${config.name}`);
    
    const startTime = Date.now();
    let attempt = 0;
    let lastError = null;
    
    while (attempt <= this.options.maxRetries) {
      try {
        const result = await this.runTestCommand(project, testType, testFiles, config);
        
        // 成功
        projectData.status = 'success';
        projectData.results = result;
        projectData.duration = Date.now() - startTime;
        projectData.retries = attempt;
        
        console.log(`✅ ${project.name} - ${config.name} 完成`);
        
        return { status: 'success', projectKey, testType, result };
        
      } catch (error) {
        lastError = error;
        attempt++;
        
        if (attempt <= this.options.maxRetries) {
          console.log(`🔄 ${project.name} - ${config.name} 重试 (${attempt}/${this.options.maxRetries})`);
          await this.delay(1000 * attempt); // 递增延迟
        }
      }
    }
    
    // 失败
    projectData.status = 'failed';
    projectData.error = lastError.message;
    projectData.duration = Date.now() - startTime;
    projectData.retries = attempt - 1;
    
    console.log(`❌ ${project.name} - ${config.name} 失败: ${lastError.message}`);
    
    return { status: 'failed', projectKey, testType, error: lastError };
  }
  
  // 运行测试命令
  async runTestCommand(project, testType, testFiles, config) {
    return new Promise((resolve, reject) => {
      const cwd = path.resolve(project.path);
      let command = project.testCommand;
      
      // 构建命令参数
      const args = [];
      
      if (project.framework === 'pytest') {
        // pytest参数
        args.push('-v'); // 详细输出
        args.push('--tb=short'); // 简短的错误追踪
        
        if (this.options.coverage) {
          args.push('--cov=.');
          args.push('--cov-report=json');
          args.push('--cov-report=term-missing');
        }
        
        if (config.parallel && this.options.parallel) {
          args.push('-n', 'auto'); // 自动并行
        }
        
        // 添加测试文件
        testFiles.forEach(file => {
          args.push(file.path);
        });
        
      } else if (project.framework === 'vitest') {
        // vitest参数
        if (this.options.coverage) {
          command = project.coverageCommand;
        }
        
        args.push('--reporter=verbose');
        args.push('--run'); // 非监听模式
        
        if (!config.parallel || !this.options.parallel) {
          args.push('--no-threads');
        }
      }
      
      // 执行命令
      const child = spawn(command.split(' ')[0], [...command.split(' ').slice(1), ...args], {
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' }
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
        if (this.options.verbose) {
          process.stdout.write(data);
        }
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
        if (this.options.verbose) {
          process.stderr.write(data);
        }
      });
      
      // 设置超时
      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`测试超时 (${config.timeout}ms)`));
      }, config.timeout);
      
      child.on('close', (code) => {
        clearTimeout(timeout);
        
        const result = {
          exitCode: code,
          stdout,
          stderr,
          testFiles: testFiles.length,
          passed: 0,
          failed: 0,
          skipped: 0
        };
        
        // 解析测试结果
        this.parseTestResults(result, project.framework);
        
        if (code === 0) {
          resolve(result);
        } else {
          reject(new Error(`测试失败 (退出码: ${code})\n${stderr}`));
        }
      });
      
      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }
  
  // 解析测试结果
  parseTestResults(result, framework) {
    if (framework === 'pytest') {
      // 解析pytest输出
      const output = result.stdout + result.stderr;
      
      // 查找测试统计
      const statsMatch = output.match(/(\d+) passed|failed|skipped/g);
      if (statsMatch) {
        statsMatch.forEach(stat => {
          const [count, status] = stat.split(' ');
          if (status === 'passed') result.passed = parseInt(count);
          else if (status === 'failed') result.failed = parseInt(count);
          else if (status === 'skipped') result.skipped = parseInt(count);
        });
      }
      
    } else if (framework === 'vitest') {
      // 解析vitest输出
      const output = result.stdout + result.stderr;
      
      // 查找测试统计
      const passedMatch = output.match(/(\d+) passed/);
      const failedMatch = output.match(/(\d+) failed/);
      const skippedMatch = output.match(/(\d+) skipped/);
      
      if (passedMatch) result.passed = parseInt(passedMatch[1]);
      if (failedMatch) result.failed = parseInt(failedMatch[1]);
      if (skippedMatch) result.skipped = parseInt(skippedMatch[1]);
    }
  }
  
  // 生成报告
  async generateReport() {
    console.log('\n📊 生成测试报告...');
    
    // 计算总体统计
    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    let totalDuration = 0;
    
    Object.values(this.results.projects).forEach(project => {
      if (project.results) {
        totalPassed += project.results.passed || 0;
        totalFailed += project.results.failed || 0;
        totalSkipped += project.results.skipped || 0;
      }
      totalDuration += project.duration || 0;
    });
    
    this.results.summary = {
      total: totalPassed + totalFailed + totalSkipped,
      passed: totalPassed,
      failed: totalFailed,
      skipped: totalSkipped,
      duration: totalDuration,
      coverage: null // 将在后续添加
    };
    
    // 保存详细报告
    const reportPath = './test-reports';
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }
    
    const reportFile = path.join(reportPath, `test-report-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify({
      ...this.results,
      gitInfo: this.gitInfo,
      options: this.options,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    console.log(`📄 详细报告已保存: ${reportFile}`);
  }
  
  // 检查结果
  checkResults() {
    console.log('\n📈 测试结果汇总:');
    console.log('=' .repeat(50));
    
    if (this.gitInfo) {
      console.log(`🌿 分支: ${this.gitInfo.branch}`);
      console.log(`📝 提交: ${this.gitInfo.commit}`);
      console.log(`👤 作者: ${this.gitInfo.author}`);
      console.log('');
    }
    
    // 项目结果
    Object.entries(this.results.projects).forEach(([projectKey, project]) => {
      const status = project.status === 'success' ? '✅' : '❌';
      const duration = (project.duration / 1000).toFixed(2);
      
      console.log(`${status} ${PROJECT_CONFIG[projectKey].name} (${duration}s)`);
      
      if (project.results) {
        const { passed, failed, skipped } = project.results;
        console.log(`   通过: ${passed}, 失败: ${failed}, 跳过: ${skipped}`);
      }
      
      if (project.retries > 0) {
        console.log(`   重试次数: ${project.retries}`);
      }
      
      if (project.error) {
        console.log(`   错误: ${project.error}`);
      }
      
      console.log('');
    });
    
    // 总体统计
    const { total, passed, failed, skipped, duration } = this.results.summary;
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    const totalDurationSec = (duration / 1000).toFixed(2);
    
    console.log('📊 总体统计:');
    console.log(`   总测试数: ${total}`);
    console.log(`   通过: ${passed}`);
    console.log(`   失败: ${failed}`);
    console.log(`   跳过: ${skipped}`);
    console.log(`   成功率: ${successRate}%`);
    console.log(`   总耗时: ${totalDurationSec}s`);
    
    // 退出码
    if (failed > 0) {
      console.log('\n❌ 测试失败');
      process.exit(1);
    } else {
      console.log('\n✅ 所有测试通过');
      process.exit(0);
    }
  }
  
  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // 监听模式
  async watch() {
    console.log('👀 启动监听模式...');
    
    const chokidar = require('chokidar');
    
    // 监听文件变化
    const watcher = chokidar.watch('.', {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/coverage/**',
        '**/test-reports/**',
        '**/dist/**',
        '**/build/**'
      ],
      persistent: true
    });
    
    let debounceTimer = null;
    
    watcher.on('change', (filePath) => {
      console.log(`📝 文件变更: ${filePath}`);
      
      // 防抖处理
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      debounceTimer = setTimeout(async () => {
        console.log('🔄 重新运行测试...');
        
        // 重置结果
        this.results = {
          projects: {},
          summary: {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            duration: 0,
            coverage: null
          },
          startTime: null,
          endTime: null
        };
        
        // 重新运行测试
        await this.run([], ['unit'], { ...this.options, incremental: true });
        
      }, 2000); // 2秒防抖
    });
    
    console.log('✅ 监听模式已启动，按 Ctrl+C 退出');
    
    // 处理退出信号
    process.on('SIGINT', () => {
      console.log('\n👋 停止监听模式');
      watcher.close();
      process.exit(0);
    });
  }
}

// 命令行接口
class TestRunnerCLI {
  static async run() {
    const args = process.argv.slice(2);
    const command = args[0] || 'run';
    
    try {
      switch (command) {
        case 'run':
          await TestRunnerCLI.runCommand(args.slice(1));
          break;
        case 'watch':
          await TestRunnerCLI.watchCommand(args.slice(1));
          break;
        case 'list':
          TestRunnerCLI.listCommand();
          break;
        case 'help':
        case '--help':
        case '-h':
          TestRunnerCLI.showHelp();
          break;
        default:
          console.error(`未知命令: ${command}`);
          TestRunnerCLI.showHelp();
          process.exit(1);
      }
    } catch (error) {
      console.error(`执行失败: ${error.message}`);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }
  
  static async runCommand(args) {
    const options = TestRunnerCLI.parseOptions(args);
    
    const runner = new SmartTestRunner({
      parallel: options.parallel,
      maxRetries: options.retries,
      verbose: options.verbose,
      coverage: options.coverage,
      incremental: options.incremental,
      failFast: options.failFast
    });
    
    await runner.run(options.projects, options.types, options);
  }
  
  static async watchCommand(args) {
    const options = TestRunnerCLI.parseOptions(args);
    
    const runner = new SmartTestRunner({
      parallel: false, // 监听模式下禁用并行
      maxRetries: 1,
      verbose: options.verbose,
      coverage: false, // 监听模式下禁用覆盖率
      incremental: true,
      failFast: false
    });
    
    await runner.watch();
  }
  
  static listCommand() {
    console.log('📋 可用项目:');
    Object.entries(PROJECT_CONFIG).forEach(([key, config]) => {
      console.log(`  ${key}: ${config.name}`);
    });
    
    console.log('\n🧪 可用测试类型:');
    Object.entries(TEST_TYPES).forEach(([key, config]) => {
      console.log(`  ${key}: ${config.name}`);
    });
  }
  
  static parseOptions(args) {
    const options = {
      projects: [],
      types: [],
      parallel: true,
      retries: 3,
      verbose: false,
      coverage: false,
      incremental: false,
      failFast: false
    };
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--projects':
        case '-p':
          options.projects = args[++i].split(',');
          break;
        case '--types':
        case '-t':
          options.types = args[++i].split(',');
          break;
        case '--parallel':
          options.parallel = true;
          break;
        case '--no-parallel':
          options.parallel = false;
          break;
        case '--retries':
        case '-r':
          options.retries = parseInt(args[++i]);
          break;
        case '--verbose':
        case '-v':
          options.verbose = true;
          break;
        case '--coverage':
        case '-c':
          options.coverage = true;
          break;
        case '--incremental':
        case '-i':
          options.incremental = true;
          break;
        case '--fail-fast':
        case '-f':
          options.failFast = true;
          break;
      }
    }
    
    return options;
  }
  
  static showHelp() {
    console.log(`
🧪 PhoenixCoder 智能测试运行器\n`);
    console.log('用法:');
    console.log('  node smart-test-runner.js <command> [options]\n');
    
    console.log('命令:');
    console.log('  run     运行测试 (默认)');
    console.log('  watch   监听模式');
    console.log('  list    列出可用项目和测试类型');
    console.log('  help    显示帮助信息\n');
    
    console.log('选项:');
    console.log('  --projects, -p <list>    指定项目 (逗号分隔)');
    console.log('  --types, -t <list>       指定测试类型 (逗号分隔)');
    console.log('  --parallel               启用并行测试 (默认)');
    console.log('  --no-parallel            禁用并行测试');
    console.log('  --retries, -r <num>      重试次数 (默认: 3)');
    console.log('  --verbose, -v            详细输出');
    console.log('  --coverage, -c           生成覆盖率报告');
    console.log('  --incremental, -i        增量测试 (仅测试变更)');
    console.log('  --fail-fast, -f          快速失败模式\n');
    
    console.log('示例:');
    console.log('  node smart-test-runner.js run');
    console.log('  node smart-test-runner.js run --projects backend,admin --types unit');
    console.log('  node smart-test-runner.js run --coverage --incremental');
    console.log('  node smart-test-runner.js watch\n');
  }
}

// 如果直接运行此文件
if (require.main === module) {
  TestRunnerCLI.run();
}

module.exports = {
  SmartTestRunner,
  TestRunnerCLI,
  PROJECT_CONFIG,
  TEST_TYPES
};