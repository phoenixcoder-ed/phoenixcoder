#!/usr/bin/env node

/**
 * CI/CD 流程测试脚本
 * 测试完整的 CI/CD 流程并生成验证结果
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class CICDFlowTester {
  constructor() {
    this.testResults = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      }
    };
    this.reportDir = 'reports/cicd-test';
    
    // 确保报告目录存在
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  /**
   * 添加测试结果
   */
  addTestResult(name, status, message = '', details = {}) {
    const result = {
      name,
      status, // 'passed', 'failed', 'skipped'
      message,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.tests.push(result);
    this.testResults.summary.total++;
    this.testResults.summary[status]++;
    
    const icon = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⏭️';
    console.log(`  ${icon} ${name}: ${message}`);
    
    return result;
  }

  /**
   * 执行命令并捕获输出
   */
  executeCommand(command, options = {}) {
    try {
      const output = execSync(command, {
        encoding: 'utf8',
        timeout: 30000,
        ...options
      });
      return { success: true, output: output.trim() };
    } catch (error) {
      return {
        success: false,
        output: error.stdout || '',
        error: error.stderr || error.message
      };
    }
  }

  /**
   * 测试 Git 仓库状态
   */
  testGitRepository() {
    console.log('\n🔍 测试 Git 仓库状态...');
    
    // 检查是否在 Git 仓库中
    const gitStatus = this.executeCommand('git status --porcelain');
    if (!gitStatus.success) {
      this.addTestResult('Git 仓库检查', 'failed', '不在 Git 仓库中或 Git 未安装');
      return false;
    }
    
    this.addTestResult('Git 仓库检查', 'passed', 'Git 仓库状态正常');
    
    // 检查远程仓库
    const remoteCheck = this.executeCommand('git remote -v');
    if (remoteCheck.success && remoteCheck.output) {
      this.addTestResult('远程仓库检查', 'passed', '远程仓库已配置');
    } else {
      this.addTestResult('远程仓库检查', 'failed', '未配置远程仓库');
    }
    
    // 检查当前分支
    const branchCheck = this.executeCommand('git branch --show-current');
    if (branchCheck.success) {
      this.addTestResult('分支检查', 'passed', `当前分支: ${branchCheck.output}`);
    } else {
      this.addTestResult('分支检查', 'failed', '无法获取当前分支');
    }
    
    return true;
  }

  /**
   * 测试工作流文件
   */
  testWorkflowFiles() {
    console.log('\n📄 测试工作流文件...');
    
    const workflowsDir = '.github/workflows';
    
    if (!fs.existsSync(workflowsDir)) {
      this.addTestResult('工作流目录检查', 'failed', '工作流目录不存在');
      return false;
    }
    
    this.addTestResult('工作流目录检查', 'passed', '工作流目录存在');
    
    const workflowFiles = fs.readdirSync(workflowsDir)
      .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));
    
    if (workflowFiles.length === 0) {
      this.addTestResult('工作流文件检查', 'failed', '未找到工作流文件');
      return false;
    }
    
    this.addTestResult('工作流文件检查', 'passed', `发现 ${workflowFiles.length} 个工作流文件`);
    
    // 验证每个工作流文件
    let validFiles = 0;
    workflowFiles.forEach(file => {
      try {
        const content = fs.readFileSync(path.join(workflowsDir, file), 'utf8');
        const yaml = require('js-yaml');
        const workflow = yaml.load(content);
        
        if (workflow.name && workflow.on && workflow.jobs) {
          validFiles++;
          this.addTestResult(`工作流文件 ${file}`, 'passed', '语法和结构正确');
        } else {
          this.addTestResult(`工作流文件 ${file}`, 'failed', '缺少必需字段');
        }
      } catch (error) {
        this.addTestResult(`工作流文件 ${file}`, 'failed', `解析失败: ${error.message}`);
      }
    });
    
    return validFiles === workflowFiles.length;
  }

  /**
   * 测试依赖安装
   */
  testDependencies() {
    console.log('\n📦 测试依赖安装...');
    
    // 检查 package.json
    if (!fs.existsSync('package.json')) {
      this.addTestResult('package.json 检查', 'failed', 'package.json 不存在');
      return false;
    }
    
    this.addTestResult('package.json 检查', 'passed', 'package.json 存在');
    
    // 检查 node_modules
    if (!fs.existsSync('node_modules')) {
      this.addTestResult('依赖安装检查', 'skipped', 'node_modules 不存在，尝试安装依赖');
      
      const installResult = this.executeCommand('npm install', { timeout: 120000 });
      if (installResult.success) {
        this.addTestResult('依赖安装', 'passed', '依赖安装成功');
      } else {
        this.addTestResult('依赖安装', 'failed', `依赖安装失败: ${installResult.error}`);
        return false;
      }
    } else {
      this.addTestResult('依赖安装检查', 'passed', '依赖已安装');
    }
    
    return true;
  }

  /**
   * 测试构建过程
   */
  testBuild() {
    console.log('\n🔨 测试构建过程...');
    
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const scripts = packageJson.scripts || {};
    
    // 测试 lint
    if (scripts.lint) {
      const lintResult = this.executeCommand('npm run lint', { timeout: 60000 });
      if (lintResult.success) {
        this.addTestResult('代码检查 (lint)', 'passed', '代码检查通过');
      } else {
        this.addTestResult('代码检查 (lint)', 'failed', `代码检查失败: ${lintResult.error}`);
      }
    } else {
      this.addTestResult('代码检查 (lint)', 'skipped', '未配置 lint 脚本');
    }
    
    // 测试 type check
    if (scripts['type-check'] || scripts.typecheck) {
      const scriptName = scripts['type-check'] ? 'type-check' : 'typecheck';
      const typeCheckResult = this.executeCommand(`npm run ${scriptName}`, { timeout: 60000 });
      if (typeCheckResult.success) {
        this.addTestResult('类型检查', 'passed', '类型检查通过');
      } else {
        this.addTestResult('类型检查', 'failed', `类型检查失败: ${typeCheckResult.error}`);
      }
    } else {
      this.addTestResult('类型检查', 'skipped', '未配置类型检查脚本');
    }
    
    // 测试构建
    if (scripts.build) {
      const buildResult = this.executeCommand('npm run build', { timeout: 180000 });
      if (buildResult.success) {
        this.addTestResult('项目构建', 'passed', '项目构建成功');
        return true;
      } else {
        this.addTestResult('项目构建', 'failed', `项目构建失败: ${buildResult.error}`);
        return false;
      }
    } else {
      this.addTestResult('项目构建', 'skipped', '未配置构建脚本');
      return true;
    }
  }

  /**
   * 测试单元测试
   */
  testUnitTests() {
    console.log('\n🧪 测试单元测试...');
    
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const scripts = packageJson.scripts || {};
    
    if (scripts.test) {
      const testResult = this.executeCommand('npm test', { timeout: 120000 });
      if (testResult.success) {
        this.addTestResult('单元测试', 'passed', '单元测试通过');
        return true;
      } else {
        this.addTestResult('单元测试', 'failed', `单元测试失败: ${testResult.error}`);
        return false;
      }
    } else {
      this.addTestResult('单元测试', 'skipped', '未配置测试脚本');
      return true;
    }
  }

  /**
   * 测试环境变量配置
   */
  testEnvironmentConfig() {
    console.log('\n🌍 测试环境变量配置...');
    
    // 检查环境配置文件
    const envFiles = ['.env.example', '.env.template', '.env.local', '.env'];
    let foundEnvFile = false;
    
    envFiles.forEach(file => {
      if (fs.existsSync(file)) {
        foundEnvFile = true;
        this.addTestResult(`环境文件 ${file}`, 'passed', '环境配置文件存在');
      }
    });
    
    if (!foundEnvFile) {
      this.addTestResult('环境配置检查', 'skipped', '未找到环境配置文件');
    }
    
    // 检查 GitHub 环境配置
    const githubEnvDir = '.github/environments';
    if (fs.existsSync(githubEnvDir)) {
      const envConfigs = fs.readdirSync(githubEnvDir)
        .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));
      
      if (envConfigs.length > 0) {
        this.addTestResult('GitHub 环境配置', 'passed', `发现 ${envConfigs.length} 个环境配置`);
      } else {
        this.addTestResult('GitHub 环境配置', 'skipped', '未找到环境配置文件');
      }
    } else {
      this.addTestResult('GitHub 环境配置', 'skipped', 'GitHub 环境配置目录不存在');
    }
    
    return true;
  }

  /**
   * 测试安全配置
   */
  testSecurityConfig() {
    console.log('\n🔒 测试安全配置...');
    
    // 检查 .gitignore
    if (fs.existsSync('.gitignore')) {
      const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
      const securityPatterns = ['.env', 'node_modules', '*.log', 'dist/', 'build/'];
      
      let securePatterns = 0;
      securityPatterns.forEach(pattern => {
        if (gitignoreContent.includes(pattern)) {
          securePatterns++;
        }
      });
      
      if (securePatterns >= 3) {
        this.addTestResult('.gitignore 安全检查', 'passed', '包含必要的安全模式');
      } else {
        this.addTestResult('.gitignore 安全检查', 'failed', '缺少重要的安全模式');
      }
    } else {
      this.addTestResult('.gitignore 检查', 'failed', '.gitignore 文件不存在');
    }
    
    // 检查是否有敏感文件被提交
    const sensitiveFiles = ['.env', '.env.local', '.env.production', 'config/secrets.json'];
    let foundSensitiveFiles = [];
    
    sensitiveFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const gitCheck = this.executeCommand(`git ls-files ${file}`);
        if (gitCheck.success && gitCheck.output) {
          foundSensitiveFiles.push(file);
        }
      }
    });
    
    if (foundSensitiveFiles.length === 0) {
      this.addTestResult('敏感文件检查', 'passed', '未发现被提交的敏感文件');
    } else {
      this.addTestResult('敏感文件检查', 'failed', `发现被提交的敏感文件: ${foundSensitiveFiles.join(', ')}`);
    }
    
    return true;
  }

  /**
   * 生成测试报告
   */
  generateReport() {
    console.log('\n📝 生成测试报告...');
    
    // 保存 JSON 报告
    const jsonReportPath = path.join(this.reportDir, `cicd-test-${Date.now()}.json`);
    fs.writeFileSync(jsonReportPath, JSON.stringify(this.testResults, null, 2));
    
    // 生成 Markdown 报告
    const markdownReport = this.generateMarkdownReport();
    const mdReportPath = path.join(this.reportDir, `cicd-test-${Date.now()}.md`);
    fs.writeFileSync(mdReportPath, markdownReport);
    
    console.log(`📄 JSON 报告已保存: ${jsonReportPath}`);
    console.log(`📄 Markdown 报告已保存: ${mdReportPath}`);
    
    return {
      jsonReport: jsonReportPath,
      markdownReport: mdReportPath
    };
  }

  /**
   * 生成 Markdown 格式报告
   */
  generateMarkdownReport() {
    const { summary, tests } = this.testResults;
    
    let markdown = `# CI/CD 流程测试报告\n\n`;
    markdown += `**生成时间**: ${new Date(this.testResults.timestamp).toLocaleString('zh-CN')}\n\n`;
    
    // 摘要
    markdown += `## 📊 测试摘要\n\n`;
    markdown += `| 指标 | 数值 |\n`;
    markdown += `|------|------|\n`;
    markdown += `| 总测试数 | ${summary.total} |\n`;
    markdown += `| 通过 | ${summary.passed} |\n`;
    markdown += `| 失败 | ${summary.failed} |\n`;
    markdown += `| 跳过 | ${summary.skipped} |\n`;
    
    const successRate = summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 0;
    markdown += `| 成功率 | ${successRate}% |\n`;
    markdown += `\n`;
    
    // 状态徽章
    const badgeColor = summary.failed === 0 ? 'brightgreen' : 'red';
    const badgeText = summary.failed === 0 ? 'passing' : 'failing';
    markdown += `![CI/CD Test](https://img.shields.io/badge/CI%2FCD%20Test-${badgeText}-${badgeColor})\n\n`;
    
    // 详细结果
    markdown += `## 📋 详细测试结果\n\n`;
    
    tests.forEach(test => {
      const icon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏭️';
      markdown += `### ${icon} ${test.name}\n\n`;
      markdown += `**状态**: ${test.status}\n\n`;
      markdown += `**消息**: ${test.message}\n\n`;
      
      if (test.details && Object.keys(test.details).length > 0) {
        markdown += `**详细信息**:\n`;
        Object.keys(test.details).forEach(key => {
          markdown += `- ${key}: ${test.details[key]}\n`;
        });
        markdown += `\n`;
      }
    });
    
    return markdown;
  }

  /**
   * 打印测试摘要
   */
  printSummary() {
    const { summary } = this.testResults;
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 CI/CD 流程测试摘要');
    console.log('='.repeat(60));
    
    console.log(`\n📊 测试结果:`);
    console.log(`  • 总计: ${summary.total} 个测试`);
    console.log(`  • 通过: ${summary.passed} 个`);
    console.log(`  • 失败: ${summary.failed} 个`);
    console.log(`  • 跳过: ${summary.skipped} 个`);
    
    const successRate = summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 0;
    console.log(`  • 成功率: ${successRate}%`);
    
    // 健康状态评估
    let healthStatus = '🟢 健康';
    if (summary.failed > 0) {
      healthStatus = '🔴 不健康 - 存在失败的测试';
    } else if (successRate < 80) {
      healthStatus = '🟡 需要关注 - 成功率偏低';
    } else if (summary.skipped > summary.passed / 2) {
      healthStatus = '🟡 需要完善 - 跳过的测试较多';
    }
    
    console.log(`\n🏥 CI/CD 流程健康状态: ${healthStatus}`);
    
    console.log('\n' + '='.repeat(60));
  }

  /**
   * 运行完整的 CI/CD 流程测试
   */
  async runCompleteTest() {
    console.log('🚀 开始 CI/CD 流程完整测试...\n');
    
    try {
      // 检查依赖
      try {
        require('js-yaml');
      } catch (error) {
        console.log('📦 安装必要的依赖...');
        execSync('npm install js-yaml', { stdio: 'inherit' });
      }
      
      // 执行各项测试
      this.testGitRepository();
      this.testWorkflowFiles();
      this.testDependencies();
      this.testBuild();
      this.testUnitTests();
      this.testEnvironmentConfig();
      this.testSecurityConfig();
      
      // 生成报告
      const reports = this.generateReport();
      
      // 打印摘要
      this.printSummary();
      
      return {
        success: this.testResults.summary.failed === 0,
        results: this.testResults,
        reports
      };
    } catch (error) {
      console.error(`❌ 测试执行失败: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// 主函数
async function main() {
  const tester = new CICDFlowTester();
  const result = await tester.runCompleteTest();
  
  process.exit(result.success ? 0 : 1);
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 脚本执行失败:', error.message);
    process.exit(1);
  });
}

module.exports = CICDFlowTester;