#!/usr/bin/env node

/**
 * PhoenixCoder 性能报告生成脚本
 * 用于生成综合的性能测试报告
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const moment = require('moment');
const { table } = require('table');
const yargs = require('yargs');

class PerformanceReportGenerator {
  constructor(options = {}) {
    this.reportsDir = path.join(__dirname, '..', '..', '..', 'reports', 'performance');
    this.benchmarksFile = path.join(__dirname, '..', 'benchmarks.json');
    this.options = options;
    this.reportData = {
      summary: {},
      details: {},
      trends: {},
      recommendations: []
    };
  }

  async collectReportData() {
    try {
      console.log(chalk.blue('📊 收集报告数据...'));
      
      // 收集最新测试结果
      await this.collectLatestResults();
      
      // 收集历史趋势数据
      await this.collectTrendData();
      
      // 加载基准数据
      await this.loadBenchmarks();
      
      // 生成性能分析
      await this.analyzePerformance();
      
      // 生成建议
      await this.generateRecommendations();
      
      console.log(chalk.green('✓ 数据收集完成'));
    } catch (error) {
      console.error(chalk.red('✗ 数据收集失败:'), error.message);
      throw error;
    }
  }

  async collectLatestResults() {
    const reportFiles = await this.findLatestReports();
    
    if (reportFiles.length === 0) {
      console.warn(chalk.yellow('⚠ 未找到测试报告'));
      return;
    }

    const latestReport = reportFiles[0];
    const reportData = await fs.readJson(latestReport.path);
    
    this.reportData.summary = {
      testDate: moment(latestReport.mtime).format('YYYY-MM-DD HH:mm:ss'),
      testDuration: this.extractTestDuration(reportData),
      totalRequests: this.extractTotalRequests(reportData),
      errorRate: this.extractErrorRate(reportData),
      avgResponseTime: this.extractAvgResponseTime(reportData),
      throughput: this.extractThroughput(reportData)
    };
    
    this.reportData.details = this.extractDetailedMetrics(reportData);
  }

  async findLatestReports() {
    const reportFiles = [];
    
    if (await fs.pathExists(this.reportsDir)) {
      const files = await fs.readdir(this.reportsDir);
      
      for (const file of files) {
        if (file.endsWith('.json') && file.includes('performance')) {
          const filePath = path.join(this.reportsDir, file);
          const stats = await fs.stat(filePath);
          reportFiles.push({
            path: filePath,
            name: file,
            mtime: stats.mtime
          });
        }
      }
    }
    
    return reportFiles.sort((a, b) => b.mtime - a.mtime);
  }

  extractTestDuration(reportData) {
    if (reportData.state && reportData.state.testRunDurationMs) {
      return Math.round(reportData.state.testRunDurationMs / 1000);
    }
    return 0;
  }

  extractTotalRequests(reportData) {
    if (reportData.metrics && reportData.metrics.http_reqs) {
      return reportData.metrics.http_reqs.values.count || 0;
    }
    return 0;
  }

  extractErrorRate(reportData) {
    if (reportData.metrics && reportData.metrics.http_req_failed) {
      return (reportData.metrics.http_req_failed.values.rate * 100) || 0;
    }
    return 0;
  }

  extractAvgResponseTime(reportData) {
    if (reportData.metrics && reportData.metrics.http_req_duration) {
      return Math.round(reportData.metrics.http_req_duration.values.avg) || 0;
    }
    return 0;
  }

  extractThroughput(reportData) {
    if (reportData.metrics && reportData.metrics.http_reqs) {
      return Math.round(reportData.metrics.http_reqs.values.rate) || 0;
    }
    return 0;
  }

  extractDetailedMetrics(reportData) {
    const details = {
      httpMetrics: {},
      customMetrics: {},
      thresholds: {}
    };

    // HTTP 指标
    if (reportData.metrics) {
      for (const [key, metric] of Object.entries(reportData.metrics)) {
        if (key.startsWith('http_')) {
          details.httpMetrics[key] = {
            type: metric.type,
            contains: metric.contains,
            values: metric.values
          };
        } else {
          details.customMetrics[key] = {
            type: metric.type,
            contains: metric.contains,
            values: metric.values
          };
        }
      }
    }

    // 阈值检查结果
    if (reportData.thresholds) {
      for (const [key, threshold] of Object.entries(reportData.thresholds)) {
        details.thresholds[key] = {
          passes: threshold.passes,
          fails: threshold.fails,
          aborts: threshold.aborts
        };
      }
    }

    return details;
  }

  async collectTrendData() {
    const reportFiles = await this.findLatestReports();
    const trendData = {
      responseTime: [],
      errorRate: [],
      throughput: [],
      dates: []
    };

    // 取最近10次测试的数据
    const recentReports = reportFiles.slice(0, 10).reverse();
    
    for (const report of recentReports) {
      try {
        const data = await fs.readJson(report.path);
        const date = moment(report.mtime).format('MM-DD');
        
        trendData.dates.push(date);
        trendData.responseTime.push(this.extractAvgResponseTime(data));
        trendData.errorRate.push(this.extractErrorRate(data));
        trendData.throughput.push(this.extractThroughput(data));
      } catch (error) {
        console.warn(chalk.yellow(`⚠ 解析报告失败: ${report.name}`));
      }
    }

    this.reportData.trends = trendData;
  }

  async loadBenchmarks() {
    try {
      if (await fs.pathExists(this.benchmarksFile)) {
        this.reportData.benchmarks = await fs.readJson(this.benchmarksFile);
      }
    } catch (error) {
      console.warn(chalk.yellow('⚠ 加载基准数据失败'));
    }
  }

  async analyzePerformance() {
    const analysis = {
      status: 'unknown',
      score: 0,
      issues: [],
      highlights: []
    };

    const { summary, benchmarks } = this.reportData;
    
    // 计算性能得分
    let score = 100;
    
    // 响应时间评分 (40%)
    if (benchmarks && benchmarks.api && benchmarks.api.general) {
      const benchmark = benchmarks.api.general.p95 || 500;
      const actual = summary.avgResponseTime || 0;
      
      if (actual > benchmark * 1.5) {
        score -= 40;
        analysis.issues.push(`响应时间过慢: ${actual}ms (基准: ${benchmark}ms)`);
      } else if (actual > benchmark) {
        score -= 20;
        analysis.issues.push(`响应时间略慢: ${actual}ms (基准: ${benchmark}ms)`);
      } else {
        analysis.highlights.push(`响应时间良好: ${actual}ms`);
      }
    }
    
    // 错误率评分 (30%)
    const errorRate = summary.errorRate || 0;
    if (errorRate > 5) {
      score -= 30;
      analysis.issues.push(`错误率过高: ${errorRate.toFixed(2)}%`);
    } else if (errorRate > 1) {
      score -= 15;
      analysis.issues.push(`错误率偏高: ${errorRate.toFixed(2)}%`);
    } else {
      analysis.highlights.push(`错误率良好: ${errorRate.toFixed(2)}%`);
    }
    
    // 吞吐量评分 (30%)
    const throughput = summary.throughput || 0;
    if (throughput < 50) {
      score -= 30;
      analysis.issues.push(`吞吐量过低: ${throughput} req/s`);
    } else if (throughput < 100) {
      score -= 15;
      analysis.issues.push(`吞吐量偏低: ${throughput} req/s`);
    } else {
      analysis.highlights.push(`吞吐量良好: ${throughput} req/s`);
    }
    
    // 确定状态
    analysis.score = Math.max(0, score);
    
    if (analysis.score >= 90) {
      analysis.status = 'excellent';
    } else if (analysis.score >= 75) {
      analysis.status = 'good';
    } else if (analysis.score >= 60) {
      analysis.status = 'fair';
    } else {
      analysis.status = 'poor';
    }
    
    this.reportData.analysis = analysis;
  }

  async generateRecommendations() {
    const recommendations = [];
    const { analysis, summary, trends } = this.reportData;
    
    // 基于分析结果生成建议
    if (analysis.issues.length > 0) {
      for (const issue of analysis.issues) {
        if (issue.includes('响应时间')) {
          recommendations.push({
            type: 'performance',
            priority: 'high',
            title: '优化响应时间',
            description: '考虑优化数据库查询、添加缓存或优化算法',
            actions: [
              '检查慢查询日志',
              '添加 Redis 缓存',
              '优化数据库索引',
              '使用 CDN 加速静态资源'
            ]
          });
        }
        
        if (issue.includes('错误率')) {
          recommendations.push({
            type: 'reliability',
            priority: 'high',
            title: '降低错误率',
            description: '检查错误日志，修复导致错误的问题',
            actions: [
              '分析错误日志',
              '增加输入验证',
              '改进错误处理',
              '添加健康检查'
            ]
          });
        }
        
        if (issue.includes('吞吐量')) {
          recommendations.push({
            type: 'scalability',
            priority: 'medium',
            title: '提升吞吐量',
            description: '考虑水平扩展或优化并发处理',
            actions: [
              '增加服务器实例',
              '优化并发处理',
              '使用负载均衡',
              '优化连接池配置'
            ]
          });
        }
      }
    }
    
    // 基于趋势数据生成建议
    if (trends.responseTime.length >= 3) {
      const recent = trends.responseTime.slice(-3);
      const isIncreasing = recent[2] > recent[1] && recent[1] > recent[0];
      
      if (isIncreasing) {
        recommendations.push({
          type: 'trend',
          priority: 'medium',
          title: '响应时间呈上升趋势',
          description: '最近几次测试的响应时间在增加，需要关注',
          actions: [
            '监控系统资源使用情况',
            '检查是否有内存泄漏',
            '分析最近的代码变更',
            '考虑性能回归测试'
          ]
        });
      }
    }
    
    // 通用建议
    recommendations.push({
      type: 'general',
      priority: 'low',
      title: '持续监控',
      description: '建立持续的性能监控机制',
      actions: [
        '设置性能监控告警',
        '定期执行性能测试',
        '建立性能基准线',
        '记录性能优化历史'
      ]
    });
    
    this.reportData.recommendations = recommendations;
  }

  generateConsoleReport() {
    const { summary, analysis, recommendations } = this.reportData;
    
    console.log(chalk.cyan('\n📊 PhoenixCoder 性能测试报告'));
    console.log(chalk.white('='.repeat(50)));
    
    // 基本信息
    console.log(chalk.blue('\n📅 测试信息:'));
    console.log(`  测试时间: ${summary.testDate}`);
    console.log(`  测试时长: ${summary.testDuration}s`);
    console.log(`  总请求数: ${summary.totalRequests}`);
    
    // 性能指标
    console.log(chalk.blue('\n⚡ 性能指标:'));
    const metricsData = [
      ['指标', '数值', '状态'],
      ['平均响应时间', `${summary.avgResponseTime}ms`, this.getStatusIcon(summary.avgResponseTime, 500)],
      ['错误率', `${summary.errorRate.toFixed(2)}%`, this.getStatusIcon(summary.errorRate, 1, true)],
      ['吞吐量', `${summary.throughput} req/s`, this.getStatusIcon(summary.throughput, 100)]
    ];
    
    console.log(table(metricsData));
    
    // 性能评分
    console.log(chalk.blue('\n🎯 性能评分:'));
    const scoreColor = analysis.score >= 90 ? chalk.green : 
                      analysis.score >= 75 ? chalk.yellow : chalk.red;
    console.log(`  总分: ${scoreColor(analysis.score)}/100 (${this.getStatusText(analysis.status)})`);
    
    // 问题和亮点
    if (analysis.issues.length > 0) {
      console.log(chalk.red('\n⚠️  发现的问题:'));
      analysis.issues.forEach(issue => {
        console.log(`  • ${issue}`);
      });
    }
    
    if (analysis.highlights.length > 0) {
      console.log(chalk.green('\n✨ 表现亮点:'));
      analysis.highlights.forEach(highlight => {
        console.log(`  • ${highlight}`);
      });
    }
    
    // 建议
    if (recommendations.length > 0) {
      console.log(chalk.blue('\n💡 优化建议:'));
      recommendations.slice(0, 3).forEach((rec, index) => {
        const priorityColor = rec.priority === 'high' ? chalk.red : 
                             rec.priority === 'medium' ? chalk.yellow : chalk.gray;
        console.log(`  ${index + 1}. ${rec.title} ${priorityColor(`[${rec.priority}]`)}`);
        console.log(`     ${rec.description}`);
      });
    }
    
    console.log(chalk.white('='.repeat(50)));
  }

  getStatusIcon(value, threshold, reverse = false) {
    const isGood = reverse ? value <= threshold : value >= threshold;
    return isGood ? chalk.green('✓') : chalk.red('✗');
  }

  getStatusText(status) {
    const statusMap = {
      excellent: chalk.green('优秀'),
      good: chalk.blue('良好'),
      fair: chalk.yellow('一般'),
      poor: chalk.red('较差')
    };
    return statusMap[status] || chalk.gray('未知');
  }

  async generateHtmlReport() {
    const { summary, analysis, trends, recommendations } = this.reportData;
    
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PhoenixCoder 性能测试报告</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f7fa; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 12px; margin-bottom: 30px; text-align: center; }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { opacity: 0.9; font-size: 1.1em; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: white; border-radius: 12px; padding: 25px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .card h3 { color: #2d3748; margin-bottom: 20px; font-size: 1.3em; }
        .metric { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #e2e8f0; }
        .metric:last-child { border-bottom: none; }
        .metric-label { font-weight: 500; color: #4a5568; }
        .metric-value { font-weight: bold; font-size: 1.1em; }
        .score-circle { width: 120px; height: 120px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 1.8em; font-weight: bold; color: white; }
        .score-excellent { background: linear-gradient(135deg, #48bb78, #38a169); }
        .score-good { background: linear-gradient(135deg, #4299e1, #3182ce); }
        .score-fair { background: linear-gradient(135deg, #ed8936, #dd6b20); }
        .score-poor { background: linear-gradient(135deg, #f56565, #e53e3e); }
        .chart-container { position: relative; height: 300px; margin: 20px 0; }
        .recommendation { background: #f7fafc; border-left: 4px solid #4299e1; padding: 15px; margin: 10px 0; border-radius: 0 8px 8px 0; }
        .recommendation.high { border-left-color: #f56565; }
        .recommendation.medium { border-left-color: #ed8936; }
        .recommendation.low { border-left-color: #48bb78; }
        .recommendation h4 { color: #2d3748; margin-bottom: 8px; }
        .recommendation p { color: #4a5568; margin-bottom: 10px; }
        .recommendation ul { color: #718096; padding-left: 20px; }
        .status-good { color: #48bb78; }
        .status-warning { color: #ed8936; }
        .status-error { color: #f56565; }
        .trend-up { color: #f56565; }
        .trend-down { color: #48bb78; }
        .trend-stable { color: #4a5568; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 PhoenixCoder 性能测试报告</h1>
            <p>生成时间: ${moment().format('YYYY年MM月DD日 HH:mm:ss')}</p>
            <p>测试时间: ${summary.testDate}</p>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>📊 测试概览</h3>
                <div class="metric">
                    <span class="metric-label">测试时长</span>
                    <span class="metric-value">${summary.testDuration}秒</span>
                </div>
                <div class="metric">
                    <span class="metric-label">总请求数</span>
                    <span class="metric-value">${summary.totalRequests.toLocaleString()}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">平均响应时间</span>
                    <span class="metric-value ${summary.avgResponseTime > 500 ? 'status-error' : 'status-good'}">${summary.avgResponseTime}ms</span>
                </div>
                <div class="metric">
                    <span class="metric-label">错误率</span>
                    <span class="metric-value ${summary.errorRate > 1 ? 'status-error' : 'status-good'}">${summary.errorRate.toFixed(2)}%</span>
                </div>
                <div class="metric">
                    <span class="metric-label">吞吐量</span>
                    <span class="metric-value ${summary.throughput < 100 ? 'status-warning' : 'status-good'}">${summary.throughput} req/s</span>
                </div>
            </div>
            
            <div class="card">
                <h3>🎯 性能评分</h3>
                <div class="score-circle score-${analysis.status}">
                    ${analysis.score}
                </div>
                <div style="text-align: center;">
                    <h4>${this.getStatusText(analysis.status).replace(/\x1b\[[0-9;]*m/g, '')}</h4>
                </div>
                ${analysis.issues.length > 0 ? `
                <div style="margin-top: 20px;">
                    <h4 style="color: #f56565; margin-bottom: 10px;">⚠️ 发现的问题:</h4>
                    <ul style="color: #718096; padding-left: 20px;">
                        ${analysis.issues.map(issue => `<li>${issue}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                ${analysis.highlights.length > 0 ? `
                <div style="margin-top: 20px;">
                    <h4 style="color: #48bb78; margin-bottom: 10px;">✨ 表现亮点:</h4>
                    <ul style="color: #718096; padding-left: 20px;">
                        ${analysis.highlights.map(highlight => `<li>${highlight}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
        </div>
        
        ${trends.dates.length > 0 ? `
        <div class="card">
            <h3>📈 性能趋势</h3>
            <div class="chart-container">
                <canvas id="trendChart"></canvas>
            </div>
        </div>
        ` : ''}
        
        ${recommendations.length > 0 ? `
        <div class="card">
            <h3>💡 优化建议</h3>
            ${recommendations.map(rec => `
                <div class="recommendation ${rec.priority}">
                    <h4>${rec.title} [${rec.priority}]</h4>
                    <p>${rec.description}</p>
                    <ul>
                        ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>
        ` : ''}
    </div>
    
    ${trends.dates.length > 0 ? `
    <script>
        const ctx = document.getElementById('trendChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ${JSON.stringify(trends.dates)},
                datasets: [{
                    label: '响应时间 (ms)',
                    data: ${JSON.stringify(trends.responseTime)},
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4
                }, {
                    label: '错误率 (%)',
                    data: ${JSON.stringify(trends.errorRate)},
                    borderColor: '#f56565',
                    backgroundColor: 'rgba(245, 101, 101, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: '响应时间 (ms)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: '错误率 (%)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: '性能趋势图'
                    }
                }
            }
        });
    </script>
    ` : ''}
</body>
</html>
    `;
    
    const reportPath = path.join(this.reportsDir, `performance-report-${moment().format('YYYYMMDD-HHmmss')}.html`);
    await fs.ensureDir(this.reportsDir);
    await fs.writeFile(reportPath, htmlTemplate);
    
    return reportPath;
  }

  async generateJsonReport() {
    const reportPath = path.join(this.reportsDir, `performance-report-${moment().format('YYYYMMDD-HHmmss')}.json`);
    await fs.ensureDir(this.reportsDir);
    await fs.writeJson(reportPath, this.reportData, { spaces: 2 });
    
    return reportPath;
  }

  async run() {
    try {
      console.log(chalk.cyan('📊 开始生成性能报告...\n'));
      
      await this.collectReportData();
      
      // 生成控制台报告
      if (!this.options.quiet) {
        this.generateConsoleReport();
      }
      
      // 生成 HTML 报告
      if (this.options.html !== false) {
        const htmlPath = await this.generateHtmlReport();
        console.log(chalk.blue(`\n📄 HTML 报告已生成: ${htmlPath}`));
      }
      
      // 生成 JSON 报告
      if (this.options.json) {
        const jsonPath = await this.generateJsonReport();
        console.log(chalk.blue(`📄 JSON 报告已生成: ${jsonPath}`));
      }
      
      console.log(chalk.green('\n✅ 报告生成完成!'));
    } catch (error) {
      console.error(chalk.red('\n❌ 报告生成失败:'), error.message);
      process.exit(1);
    }
  }
}

// 命令行参数处理
if (require.main === module) {
  const argv = yargs
    .option('html', {
      type: 'boolean',
      default: true,
      description: '生成 HTML 格式的报告'
    })
    .option('json', {
      type: 'boolean',
      default: false,
      description: '生成 JSON 格式的报告'
    })
    .option('quiet', {
      alias: 'q',
      type: 'boolean',
      default: false,
      description: '静默模式，不显示控制台报告'
    })
    .help()
    .argv;
  
  const generator = new PerformanceReportGenerator(argv);
  generator.run();
}

module.exports = PerformanceReportGenerator;