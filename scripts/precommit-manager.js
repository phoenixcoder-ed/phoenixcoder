#!/usr/bin/env node

/**
 * PhoenixCoder 预提交钩子管理器
 * 提供钩子的启用、禁用、更新和状态检查功能
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const yaml = require('js-yaml');

// 颜色定义
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// 日志函数
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  debug: (msg) => console.log(`${colors.cyan}[DEBUG]${colors.reset} ${msg}`)
};

class PreCommitManager {
  constructor() {
    this.configPath = '.pre-commit-config.yaml';
    this.projectRoot = process.cwd();
  }

  /**
   * 检查pre-commit是否已安装
   */
  checkPreCommitInstalled() {
    try {
      execSync('pre-commit --version', { stdio: 'pipe' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 检查钩子是否已安装
   */
  checkHooksInstalled() {
    const gitHooksDir = path.join(this.projectRoot, '.git', 'hooks');
    const preCommitHook = path.join(gitHooksDir, 'pre-commit');
    return fs.existsSync(preCommitHook);
  }

  /**
   * 获取配置文件内容
   */
  getConfig() {
    try {
      const configContent = fs.readFileSync(this.configPath, 'utf8');
      return yaml.load(configContent);
    } catch (error) {
      log.error(`读取配置文件失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 保存配置文件
   */
  saveConfig(config) {
    try {
      const yamlContent = yaml.dump(config, {
        indent: 2,
        lineWidth: 120,
        noRefs: true
      });
      fs.writeFileSync(this.configPath, yamlContent, 'utf8');
      return true;
    } catch (error) {
      log.error(`保存配置文件失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 显示钩子状态
   */
  showStatus() {
    log.info('检查预提交钩子状态...');
    
    console.log('\n=== 环境状态 ===');
    
    // 检查pre-commit安装状态
    const preCommitInstalled = this.checkPreCommitInstalled();
    console.log(`pre-commit 安装状态: ${preCommitInstalled ? 
      `${colors.green}✓ 已安装${colors.reset}` : 
      `${colors.red}✗ 未安装${colors.reset}`}`);
    
    if (preCommitInstalled) {
      try {
        const version = execSync('pre-commit --version', { encoding: 'utf8' }).trim();
        console.log(`版本: ${version}`);
      } catch (error) {
        log.warning('无法获取pre-commit版本');
      }
    }
    
    // 检查钩子安装状态
    const hooksInstalled = this.checkHooksInstalled();
    console.log(`Git钩子安装状态: ${hooksInstalled ? 
      `${colors.green}✓ 已安装${colors.reset}` : 
      `${colors.red}✗ 未安装${colors.reset}`}`);
    
    // 检查配置文件
    const configExists = fs.existsSync(this.configPath);
    console.log(`配置文件状态: ${configExists ? 
      `${colors.green}✓ 存在${colors.reset}` : 
      `${colors.red}✗ 不存在${colors.reset}`}`);
    
    if (configExists) {
      const config = this.getConfig();
      if (config && config.repos) {
        console.log(`\n=== 配置的钩子 ===`);
        config.repos.forEach((repo, index) => {
          if (repo.repo === 'local') {
            console.log(`${index + 1}. 本地钩子 (${repo.hooks.length} 个)`);
            repo.hooks.forEach(hook => {
              console.log(`   - ${hook.name || hook.id}`);
            });
          } else {
            console.log(`${index + 1}. ${repo.repo} (${repo.hooks.length} 个钩子)`);
          }
        });
      }
    }
    
    console.log('');
  }

  /**
   * 安装钩子
   */
  install() {
    log.info('安装预提交钩子...');
    
    if (!this.checkPreCommitInstalled()) {
      log.error('pre-commit 未安装，请先运行: pip install pre-commit');
      return false;
    }
    
    if (!fs.existsSync(this.configPath)) {
      log.error('配置文件不存在，请先创建 .pre-commit-config.yaml');
      return false;
    }
    
    try {
      execSync('pre-commit install', { stdio: 'inherit' });
      execSync('pre-commit install --hook-type commit-msg', { stdio: 'inherit' });
      execSync('pre-commit install --hook-type pre-push', { stdio: 'inherit' });
      
      log.success('预提交钩子安装成功');
      return true;
    } catch (error) {
      log.error(`安装失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 卸载钩子
   */
  uninstall() {
    log.info('卸载预提交钩子...');
    
    try {
      execSync('pre-commit uninstall', { stdio: 'inherit' });
      execSync('pre-commit uninstall --hook-type commit-msg', { stdio: 'inherit' });
      execSync('pre-commit uninstall --hook-type pre-push', { stdio: 'inherit' });
      
      log.success('预提交钩子卸载成功');
      return true;
    } catch (error) {
      log.error(`卸载失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 更新钩子
   */
  update() {
    log.info('更新预提交钩子...');
    
    try {
      execSync('pre-commit autoupdate', { stdio: 'inherit' });
      log.success('钩子更新成功');
      return true;
    } catch (error) {
      log.error(`更新失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 运行所有钩子
   */
  runAll() {
    log.info('运行所有预提交钩子...');
    
    try {
      execSync('pre-commit run --all-files', { stdio: 'inherit' });
      log.success('所有钩子运行完成');
      return true;
    } catch (error) {
      log.warning('部分钩子检查失败，请修复问题后重试');
      return false;
    }
  }

  /**
   * 运行特定钩子
   */
  runHook(hookId) {
    log.info(`运行钩子: ${hookId}`);
    
    try {
      execSync(`pre-commit run ${hookId} --all-files`, { stdio: 'inherit' });
      log.success(`钩子 ${hookId} 运行完成`);
      return true;
    } catch (error) {
      log.warning(`钩子 ${hookId} 检查失败`);
      return false;
    }
  }

  /**
   * 启用/禁用特定钩子
   */
  toggleHook(hookId, enabled) {
    const config = this.getConfig();
    if (!config) return false;
    
    let found = false;
    config.repos.forEach(repo => {
      repo.hooks.forEach(hook => {
        if (hook.id === hookId) {
          if (enabled) {
            delete hook.stages;
          } else {
            hook.stages = ['manual'];
          }
          found = true;
        }
      });
    });
    
    if (!found) {
      log.error(`钩子 ${hookId} 不存在`);
      return false;
    }
    
    if (this.saveConfig(config)) {
      log.success(`钩子 ${hookId} ${enabled ? '已启用' : '已禁用'}`);
      return true;
    }
    
    return false;
  }

  /**
   * 列出所有可用的钩子
   */
  listHooks() {
    const config = this.getConfig();
    if (!config) return;
    
    console.log('\n=== 可用的钩子 ===');
    
    config.repos.forEach((repo, repoIndex) => {
      if (repo.repo === 'local') {
        console.log(`\n${colors.cyan}本地钩子:${colors.reset}`);
      } else {
        console.log(`\n${colors.cyan}${repo.repo}:${colors.reset}`);
      }
      
      repo.hooks.forEach((hook, hookIndex) => {
        const status = hook.stages && hook.stages.includes('manual') ? 
          `${colors.red}[禁用]${colors.reset}` : 
          `${colors.green}[启用]${colors.reset}`;
        
        console.log(`  ${repoIndex + 1}.${hookIndex + 1} ${hook.id} - ${hook.name || hook.id} ${status}`);
      });
    });
    
    console.log('');
  }

  /**
   * 生成钩子报告
   */
  generateReport() {
    log.info('生成钩子状态报告...');
    
    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        preCommitInstalled: this.checkPreCommitInstalled(),
        hooksInstalled: this.checkHooksInstalled(),
        configExists: fs.existsSync(this.configPath)
      },
      hooks: []
    };
    
    const config = this.getConfig();
    if (config && config.repos) {
      config.repos.forEach(repo => {
        repo.hooks.forEach(hook => {
          report.hooks.push({
            id: hook.id,
            name: hook.name || hook.id,
            repo: repo.repo,
            enabled: !hook.stages || !hook.stages.includes('manual'),
            stages: hook.stages || ['commit']
          });
        });
      });
    }
    
    const reportPath = 'precommit-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    log.success(`报告已生成: ${reportPath}`);
    return report;
  }
}

// 命令行接口
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const manager = new PreCommitManager();
  
  switch (command) {
    case 'status':
      manager.showStatus();
      break;
      
    case 'install':
      manager.install();
      break;
      
    case 'uninstall':
      manager.uninstall();
      break;
      
    case 'update':
      manager.update();
      break;
      
    case 'run':
      if (args[1]) {
        manager.runHook(args[1]);
      } else {
        manager.runAll();
      }
      break;
      
    case 'enable':
      if (args[1]) {
        manager.toggleHook(args[1], true);
      } else {
        log.error('请指定要启用的钩子ID');
      }
      break;
      
    case 'disable':
      if (args[1]) {
        manager.toggleHook(args[1], false);
      } else {
        log.error('请指定要禁用的钩子ID');
      }
      break;
      
    case 'list':
      manager.listHooks();
      break;
      
    case 'report':
      manager.generateReport();
      break;
      
    case 'help':
    default:
      console.log(`
${colors.green}PhoenixCoder 预提交钩子管理器${colors.reset}

使用方法:
  node precommit-manager.js <command> [options]

命令:
  status              显示钩子状态
  install             安装预提交钩子
  uninstall           卸载预提交钩子
  update              更新钩子版本
  run [hook-id]       运行所有钩子或指定钩子
  enable <hook-id>    启用指定钩子
  disable <hook-id>   禁用指定钩子
  list                列出所有钩子
  report              生成状态报告
  help                显示帮助信息

示例:
  node precommit-manager.js status
  node precommit-manager.js run backend-tests
  node precommit-manager.js disable performance-regression
  node precommit-manager.js enable coverage-check
`);
      break;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = PreCommitManager;