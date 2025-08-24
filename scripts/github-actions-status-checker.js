#!/usr/bin/env node

/**
 * GitHub Actions 状态检查脚本
 * 用于监控和验证 CI/CD 流程的运行状态
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

class GitHubActionsStatusChecker {
  constructor() {
    this.repoOwner = process.env.GITHUB_REPOSITORY?.split('/')[0] || 'phoenixcoder';
    this.repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'phoenixcoder';
    this.token = process.env.GITHUB_TOKEN;
    this.baseUrl = 'api.github.com';
    this.workflowsDir = '.github/workflows';
    this.reportDir = 'reports/cicd-status';
    
    // 确保报告目录存在
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  /**
   * 发起 GitHub API 请求
   */
  async makeGitHubRequest(endpoint) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseUrl,
        path: endpoint,
        method: 'GET',
        headers: {
          'User-Agent': 'PhoenixCoder-CI-Status-Checker',
          'Accept': 'application/vnd.github.v3+json',
          ...(this.token && { 'Authorization': `token ${this.token}` })
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error(`解析响应失败: ${error.message}`));
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('请求超时'));
      });
      req.end();
    });
  }

  /**
   * 获取所有工作流文件
   */
  getWorkflowFiles() {
    try {
      const workflowFiles = fs.readdirSync(this.workflowsDir)
        .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
        .map(file => {
          const filePath = path.join(this.workflowsDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          return {
            name: file,
            path: filePath,
            content,
            size: fs.statSync(filePath).size
          };
        });
      
      console.log(`📁 发现 ${workflowFiles.length} 个工作流文件`);
      return workflowFiles;
    } catch (error) {
      console.error(`❌ 读取工作流文件失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 验证工作流文件语法
   */
  validateWorkflowSyntax(workflowFiles) {
    console.log('\n🔍 验证工作流文件语法...');
    const results = [];

    workflowFiles.forEach(workflow => {
      const result = {
        file: workflow.name,
        valid: true,
        errors: [],
        warnings: []
      };

      try {
        // 检查基本 YAML 语法
        const yaml = require('js-yaml');
        const parsed = yaml.load(workflow.content);
        
        // 检查必需字段
        if (!parsed.name) {
          result.warnings.push('缺少工作流名称');
        }
        if (!parsed.on) {
          result.errors.push('缺少触发条件');
        }
        if (!parsed.jobs) {
          result.errors.push('缺少作业定义');
        }

        // 检查作业配置
        if (parsed.jobs) {
          Object.keys(parsed.jobs).forEach(jobName => {
            const job = parsed.jobs[jobName];
            if (!job['runs-on']) {
              result.errors.push(`作业 ${jobName} 缺少 runs-on 配置`);
            }
            if (!job.steps || !Array.isArray(job.steps)) {
              result.errors.push(`作业 ${jobName} 缺少步骤定义`);
            }
          });
        }

        // 检查常见问题
        if (workflow.content.includes('\\r') && !workflow.content.includes('\\\\r')) {
          result.warnings.push('可能存在未转义的换行符');
        }

        if (result.errors.length > 0) {
          result.valid = false;
        }

      } catch (error) {
        result.valid = false;
        result.errors.push(`YAML 语法错误: ${error.message}`);
      }

      results.push(result);
      
      const status = result.valid ? '✅' : '❌';
      console.log(`  ${status} ${workflow.name}`);
      if (result.errors.length > 0) {
        result.errors.forEach(error => console.log(`    ❌ ${error}`));
      }
      if (result.warnings.length > 0) {
        result.warnings.forEach(warning => console.log(`    ⚠️ ${warning}`));
      }
    });

    return results;
  }

  /**
   * 获取工作流运行状态
   */
  async getWorkflowRuns() {
    console.log('\n🔄 获取工作流运行状态...');
    
    try {
      const endpoint = `/repos/${this.repoOwner}/${this.repoName}/actions/runs?per_page=50`;
      const response = await this.makeGitHubRequest(endpoint);
      
      if (!response.workflow_runs) {
        console.log('⚠️ 未找到工作流运行记录');
        return [];
      }

      const runs = response.workflow_runs.slice(0, 20); // 最近20次运行
      
      console.log(`📊 获取到 ${runs.length} 次最近的工作流运行`);
      
      runs.forEach(run => {
        const status = this.getStatusIcon(run.status, run.conclusion);
        const duration = run.updated_at ? 
          Math.round((new Date(run.updated_at) - new Date(run.created_at)) / 1000 / 60) : 'N/A';
        
        console.log(`  ${status} ${run.name} - ${run.head_branch} (${duration}分钟)`);
      });

      return runs;
    } catch (error) {
      console.error(`❌ 获取工作流运行状态失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 获取状态图标
   */
  getStatusIcon(status, conclusion) {
    if (status === 'completed') {
      switch (conclusion) {
        case 'success': return '✅';
        case 'failure': return '❌';
        case 'cancelled': return '⏹️';
        case 'skipped': return '⏭️';
        default: return '❓';
      }
    } else if (status === 'in_progress') {
      return '🔄';
    } else if (status === 'queued') {
      return '⏳';
    }
    return '❓';
  }

  /**
   * 生成状态徽章
   */
  generateStatusBadges(workflowRuns, validationResults) {
    console.log('\n🏷️ 生成状态徽章...');
    
    const badges = [];
    
    // CI 状态徽章
    const latestRun = workflowRuns.find(run => run.name.includes('CI'));
    if (latestRun) {
      const status = latestRun.conclusion === 'success' ? 'passing' : 'failing';
      const color = latestRun.conclusion === 'success' ? 'brightgreen' : 'red';
      badges.push({
        name: 'CI Status',
        url: `https://img.shields.io/badge/CI-${status}-${color}`,
        markdown: `![CI Status](https://img.shields.io/badge/CI-${status}-${color})`
      });
    }

    // 工作流语法状态
    const validFiles = validationResults.filter(r => r.valid).length;
    const totalFiles = validationResults.length;
    const syntaxStatus = validFiles === totalFiles ? 'valid' : 'invalid';
    const syntaxColor = validFiles === totalFiles ? 'brightgreen' : 'red';
    badges.push({
      name: 'Workflow Syntax',
      url: `https://img.shields.io/badge/Workflows-${syntaxStatus}-${syntaxColor}`,
      markdown: `![Workflow Syntax](https://img.shields.io/badge/Workflows-${syntaxStatus}-${syntaxColor})`
    });

    // 测试覆盖率徽章（如果有覆盖率报告）
    try {
      const coverageFile = 'coverage/coverage-summary.json';
      if (fs.existsSync(coverageFile)) {
        const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
        const totalCoverage = Math.round(coverage.total.lines.pct);
        const coverageColor = totalCoverage >= 80 ? 'brightgreen' : 
                             totalCoverage >= 60 ? 'yellow' : 'red';
        badges.push({
          name: 'Coverage',
          url: `https://img.shields.io/badge/Coverage-${totalCoverage}%25-${coverageColor}`,
          markdown: `![Coverage](https://img.shields.io/badge/Coverage-${totalCoverage}%25-${coverageColor})`
        });
      }
    } catch (error) {
      console.log('⚠️ 无法读取覆盖率报告');
    }

    badges.forEach(badge => {
      console.log(`  🏷️ ${badge.name}: ${badge.url}`);
    });

    return badges;
  }

  /**
   * 生成详细测试报告
   */
  generateDetailedReport(workflowFiles, validationResults, workflowRuns, badges) {
    console.log('\n📝 生成详细测试报告...');
    
    const timestamp = new Date().toISOString();
    const report = {
      timestamp,
      summary: {
        total_workflows: workflowFiles.length,
        valid_workflows: validationResults.filter(r => r.valid).length,
        recent_runs: workflowRuns.length,
        successful_runs: workflowRuns.filter(r => r.conclusion === 'success').length,
        failed_runs: workflowRuns.filter(r => r.conclusion === 'failure').length
      },
      workflow_files: workflowFiles.map(wf => ({
        name: wf.name,
        size: wf.size,
        path: wf.path
      })),
      validation_results: validationResults,
      recent_runs: workflowRuns.map(run => ({
        id: run.id,
        name: run.name,
        status: run.status,
        conclusion: run.conclusion,
        branch: run.head_branch,
        created_at: run.created_at,
        updated_at: run.updated_at,
        html_url: run.html_url
      })),
      badges
    };

    // 保存 JSON 报告
    const jsonReportPath = path.join(this.reportDir, `status-report-${Date.now()}.json`);
    fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));
    
    // 生成 Markdown 报告
    const markdownReport = this.generateMarkdownReport(report);
    const mdReportPath = path.join(this.reportDir, `status-report-${Date.now()}.md`);
    fs.writeFileSync(mdReportPath, markdownReport);
    
    console.log(`📄 JSON 报告已保存: ${jsonReportPath}`);
    console.log(`📄 Markdown 报告已保存: ${mdReportPath}`);
    
    return report;
  }

  /**
   * 生成 Markdown 格式报告
   */
  generateMarkdownReport(report) {
    const { summary, validation_results, recent_runs, badges } = report;
    
    let markdown = `# GitHub Actions CI/CD 状态报告\n\n`;
    markdown += `**生成时间**: ${new Date(report.timestamp).toLocaleString('zh-CN')}\n\n`;
    
    // 状态徽章
    markdown += `## 📊 状态徽章\n\n`;
    badges.forEach(badge => {
      markdown += `${badge.markdown} `;
    });
    markdown += `\n\n`;
    
    // 摘要
    markdown += `## 📈 摘要\n\n`;
    markdown += `| 指标 | 数值 |\n`;
    markdown += `|------|------|\n`;
    markdown += `| 工作流文件总数 | ${summary.total_workflows} |\n`;
    markdown += `| 有效工作流 | ${summary.valid_workflows} |\n`;
    markdown += `| 最近运行次数 | ${summary.recent_runs} |\n`;
    markdown += `| 成功运行 | ${summary.successful_runs} |\n`;
    markdown += `| 失败运行 | ${summary.failed_runs} |\n`;
    markdown += `\n`;
    
    // 工作流验证结果
    markdown += `## ✅ 工作流验证结果\n\n`;
    validation_results.forEach(result => {
      const status = result.valid ? '✅' : '❌';
      markdown += `### ${status} ${result.file}\n\n`;
      
      if (result.errors.length > 0) {
        markdown += `**错误:**\n`;
        result.errors.forEach(error => {
          markdown += `- ❌ ${error}\n`;
        });
        markdown += `\n`;
      }
      
      if (result.warnings.length > 0) {
        markdown += `**警告:**\n`;
        result.warnings.forEach(warning => {
          markdown += `- ⚠️ ${warning}\n`;
        });
        markdown += `\n`;
      }
    });
    
    // 最近运行记录
    markdown += `## 🔄 最近运行记录\n\n`;
    markdown += `| 状态 | 工作流 | 分支 | 时间 | 链接 |\n`;
    markdown += `|------|--------|------|------|------|\n`;
    recent_runs.slice(0, 10).forEach(run => {
      const status = this.getStatusIcon(run.status, run.conclusion);
      const time = new Date(run.created_at).toLocaleString('zh-CN');
      markdown += `| ${status} | ${run.name} | ${run.branch} | ${time} | [查看](${run.html_url}) |\n`;
    });
    
    return markdown;
  }

  /**
   * 运行完整的状态检查
   */
  async runCompleteCheck() {
    console.log('🚀 开始 GitHub Actions CI/CD 状态检查...\n');
    
    try {
      // 1. 获取工作流文件
      const workflowFiles = this.getWorkflowFiles();
      
      // 2. 验证语法
      const validationResults = this.validateWorkflowSyntax(workflowFiles);
      
      // 3. 获取运行状态
      const workflowRuns = await this.getWorkflowRuns();
      
      // 4. 生成徽章
      const badges = this.generateStatusBadges(workflowRuns, validationResults);
      
      // 5. 生成报告
      const report = this.generateDetailedReport(workflowFiles, validationResults, workflowRuns, badges);
      
      // 6. 输出总结
      this.printSummary(report);
      
      return report;
    } catch (error) {
      console.error(`❌ 状态检查失败: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * 打印检查总结
   */
  printSummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('📋 CI/CD 状态检查总结');
    console.log('='.repeat(60));
    
    const { summary } = report;
    
    console.log(`\n📊 工作流状态:`);
    console.log(`  • 总计: ${summary.total_workflows} 个工作流文件`);
    console.log(`  • 有效: ${summary.valid_workflows} 个`);
    console.log(`  • 无效: ${summary.total_workflows - summary.valid_workflows} 个`);
    
    console.log(`\n🔄 运行状态:`);
    console.log(`  • 最近运行: ${summary.recent_runs} 次`);
    console.log(`  • 成功: ${summary.successful_runs} 次`);
    console.log(`  • 失败: ${summary.failed_runs} 次`);
    
    const successRate = summary.recent_runs > 0 ? 
      Math.round((summary.successful_runs / summary.recent_runs) * 100) : 0;
    console.log(`  • 成功率: ${successRate}%`);
    
    // 健康状态评估
    let healthStatus = '🟢 健康';
    if (summary.total_workflows !== summary.valid_workflows) {
      healthStatus = '🔴 不健康 - 存在无效工作流';
    } else if (successRate < 80) {
      healthStatus = '🟡 需要关注 - 成功率偏低';
    } else if (successRate < 95) {
      healthStatus = '🟡 良好 - 可以优化';
    }
    
    console.log(`\n🏥 整体健康状态: ${healthStatus}`);
    
    console.log('\n' + '='.repeat(60));
  }
}

// 主函数
async function main() {
  const checker = new GitHubActionsStatusChecker();
  await checker.runCompleteCheck();
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 脚本执行失败:', error.message);
    process.exit(1);
  });
}

module.exports = GitHubActionsStatusChecker;