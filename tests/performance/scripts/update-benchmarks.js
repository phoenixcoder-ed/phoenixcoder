#!/usr/bin/env node

/**
 * PhoenixCoder 性能基准更新脚本
 * 用于更新性能测试基准数据
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const moment = require('moment');

class BenchmarkUpdater {
  constructor() {
    this.benchmarksFile = path.join(__dirname, '..', 'benchmarks.json');
    this.reportsDir = path.join(__dirname, '..', '..', '..', 'reports', 'performance');
    this.currentBenchmarks = {};
    this.newBenchmarks = {};
  }

  async loadCurrentBenchmarks() {
    try {
      if (await fs.pathExists(this.benchmarksFile)) {
        this.currentBenchmarks = await fs.readJson(this.benchmarksFile);
        console.log(chalk.green('✓ 已加载当前基准数据'));
      } else {
        console.log(chalk.yellow('⚠ 基准文件不存在，将创建新的基准'));
        this.currentBenchmarks = this.getDefaultBenchmarks();
      }
    } catch (error) {
      console.error(chalk.red('✗ 加载基准数据失败:'), error.message);
      throw error;
    }
  }

  getDefaultBenchmarks() {
    return {
      version: '1.0.0',
      lastUpdated: moment().toISOString(),
      environment: {
        os: process.platform,
        nodeVersion: process.version,
        arch: process.arch
      },
      api: {
        auth: {
          login: { p95: 200, p99: 500, errorRate: 0.01 },
          register: { p95: 300, p99: 800, errorRate: 0.02 },
          logout: { p95: 100, p99: 200, errorRate: 0.005 }
        },
        tasks: {
          list: { p95: 150, p99: 400, errorRate: 0.01 },
          create: { p95: 250, p99: 600, errorRate: 0.02 },
          update: { p95: 200, p99: 500, errorRate: 0.015 },
          delete: { p95: 100, p99: 300, errorRate: 0.01 }
        },
        users: {
          profile: { p95: 100, p99: 250, errorRate: 0.005 },
          growth: { p95: 200, p99: 500, errorRate: 0.01 }
        }
      },
      frontend: {
        pages: {
          home: { loadTime: 1000, fcp: 800, lcp: 1200 },
          tasks: { loadTime: 1200, fcp: 900, lcp: 1400 },
          profile: { loadTime: 800, fcp: 600, lcp: 1000 }
        }
      },
      scenarios: {
        load: { throughput: 100, errorRate: 0.01 },
        stress: { throughput: 200, errorRate: 0.05 },
        spike: { throughput: 500, errorRate: 0.1 }
      }
    };
  }

  async collectLatestResults() {
    try {
      console.log(chalk.blue('📊 收集最新测试结果...'));
      
      // 查找最新的测试报告
      const reportFiles = await this.findLatestReports();
      
      if (reportFiles.length === 0) {
        console.log(chalk.yellow('⚠ 未找到测试报告，使用默认基准'));
        return this.getDefaultBenchmarks();
      }

      // 解析测试结果
      const results = await this.parseTestResults(reportFiles);
      
      // 更新基准数据
      this.newBenchmarks = this.mergeBenchmarks(this.currentBenchmarks, results);
      
      console.log(chalk.green('✓ 成功收集测试结果'));
      return this.newBenchmarks;
    } catch (error) {
      console.error(chalk.red('✗ 收集测试结果失败:'), error.message);
      throw error;
    }
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
    
    // 按修改时间排序，最新的在前
    return reportFiles.sort((a, b) => b.mtime - a.mtime).slice(0, 5);
  }

  async parseTestResults(reportFiles) {
    const results = {
      api: {},
      frontend: {},
      scenarios: {}
    };

    for (const reportFile of reportFiles) {
      try {
        const data = await fs.readJson(reportFile.path);
        
        // 解析 k6 结果
        if (data.metrics) {
          this.parseK6Metrics(data.metrics, results);
        }
        
        // 解析自定义结果
        if (data.custom) {
          this.parseCustomMetrics(data.custom, results);
        }
      } catch (error) {
        console.warn(chalk.yellow(`⚠ 解析报告失败: ${reportFile.name}`), error.message);
      }
    }

    return results;
  }

  parseK6Metrics(metrics, results) {
    // 解析 HTTP 请求指标
    if (metrics.http_req_duration) {
      const duration = metrics.http_req_duration;
      if (duration.values) {
        results.api.general = {
          p95: Math.round(duration.values['p(95)'] || 0),
          p99: Math.round(duration.values['p(99)'] || 0),
          avg: Math.round(duration.values.avg || 0)
        };
      }
    }

    // 解析错误率
    if (metrics.http_req_failed) {
      const failed = metrics.http_req_failed;
      if (failed.values) {
        results.api.errorRate = failed.values.rate || 0;
      }
    }

    // 解析吞吐量
    if (metrics.http_reqs) {
      const reqs = metrics.http_reqs;
      if (reqs.values) {
        results.scenarios.throughput = reqs.values.rate || 0;
      }
    }
  }

  parseCustomMetrics(custom, results) {
    // 解析自定义指标
    if (custom.api) {
      Object.assign(results.api, custom.api);
    }
    
    if (custom.frontend) {
      Object.assign(results.frontend, custom.frontend);
    }
    
    if (custom.scenarios) {
      Object.assign(results.scenarios, custom.scenarios);
    }
  }

  mergeBenchmarks(current, latest) {
    const merged = JSON.parse(JSON.stringify(current));
    
    // 更新版本和时间
    merged.version = this.incrementVersion(current.version || '1.0.0');
    merged.lastUpdated = moment().toISOString();
    
    // 更新环境信息
    merged.environment = {
      os: process.platform,
      nodeVersion: process.version,
      arch: process.arch,
      lastTestRun: moment().toISOString()
    };
    
    // 合并 API 指标
    if (latest.api) {
      merged.api = this.mergeApiMetrics(merged.api || {}, latest.api);
    }
    
    // 合并前端指标
    if (latest.frontend) {
      merged.frontend = this.mergeFrontendMetrics(merged.frontend || {}, latest.frontend);
    }
    
    // 合并场景指标
    if (latest.scenarios) {
      merged.scenarios = this.mergeScenarioMetrics(merged.scenarios || {}, latest.scenarios);
    }
    
    return merged;
  }

  mergeApiMetrics(current, latest) {
    const merged = JSON.parse(JSON.stringify(current));
    
    for (const [category, metrics] of Object.entries(latest)) {
      if (!merged[category]) {
        merged[category] = {};
      }
      
      for (const [endpoint, values] of Object.entries(metrics)) {
        if (!merged[category][endpoint]) {
          merged[category][endpoint] = values;
        } else {
          // 使用加权平均更新基准
          merged[category][endpoint] = this.weightedAverage(
            merged[category][endpoint],
            values,
            0.7 // 70% 权重给当前基准，30% 给新结果
          );
        }
      }
    }
    
    return merged;
  }

  mergeFrontendMetrics(current, latest) {
    const merged = JSON.parse(JSON.stringify(current));
    
    for (const [category, metrics] of Object.entries(latest)) {
      if (!merged[category]) {
        merged[category] = {};
      }
      
      Object.assign(merged[category], metrics);
    }
    
    return merged;
  }

  mergeScenarioMetrics(current, latest) {
    const merged = JSON.parse(JSON.stringify(current));
    
    for (const [scenario, metrics] of Object.entries(latest)) {
      if (!merged[scenario]) {
        merged[scenario] = metrics;
      } else {
        merged[scenario] = this.weightedAverage(
          merged[scenario],
          metrics,
          0.7
        );
      }
    }
    
    return merged;
  }

  weightedAverage(current, latest, currentWeight) {
    const result = {};
    const latestWeight = 1 - currentWeight;
    
    for (const [key, value] of Object.entries(latest)) {
      if (typeof value === 'number' && current[key] !== undefined) {
        result[key] = Math.round(
          current[key] * currentWeight + value * latestWeight
        );
      } else {
        result[key] = value;
      }
    }
    
    // 保留当前基准中存在但最新结果中不存在的指标
    for (const [key, value] of Object.entries(current)) {
      if (result[key] === undefined) {
        result[key] = value;
      }
    }
    
    return result;
  }

  incrementVersion(version) {
    const parts = version.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  async saveBenchmarks() {
    try {
      await fs.writeJson(this.benchmarksFile, this.newBenchmarks, { spaces: 2 });
      console.log(chalk.green('✓ 基准数据已更新'));
      
      // 创建备份
      const backupFile = this.benchmarksFile.replace('.json', `-backup-${moment().format('YYYYMMDD-HHmmss')}.json`);
      await fs.writeJson(backupFile, this.currentBenchmarks, { spaces: 2 });
      console.log(chalk.blue(`📁 已创建备份: ${path.basename(backupFile)}`));
    } catch (error) {
      console.error(chalk.red('✗ 保存基准数据失败:'), error.message);
      throw error;
    }
  }

  printSummary() {
    console.log(chalk.cyan('\n📊 基准更新摘要:'));
    console.log(chalk.white('─'.repeat(50)));
    
    console.log(`版本: ${chalk.green(this.currentBenchmarks.version)} → ${chalk.green(this.newBenchmarks.version)}`);
    console.log(`更新时间: ${chalk.blue(moment(this.newBenchmarks.lastUpdated).format('YYYY-MM-DD HH:mm:ss'))}`);
    
    // API 指标摘要
    if (this.newBenchmarks.api) {
      console.log(chalk.yellow('\nAPI 指标:'));
      for (const [category, endpoints] of Object.entries(this.newBenchmarks.api)) {
        console.log(`  ${category}: ${Object.keys(endpoints).length} 个端点`);
      }
    }
    
    // 前端指标摘要
    if (this.newBenchmarks.frontend) {
      console.log(chalk.yellow('\n前端指标:'));
      for (const [category, pages] of Object.entries(this.newBenchmarks.frontend)) {
        console.log(`  ${category}: ${Object.keys(pages).length} 个页面`);
      }
    }
    
    // 场景指标摘要
    if (this.newBenchmarks.scenarios) {
      console.log(chalk.yellow('\n场景指标:'));
      for (const scenario of Object.keys(this.newBenchmarks.scenarios)) {
        console.log(`  ${scenario}`);
      }
    }
    
    console.log(chalk.white('─'.repeat(50)));
  }

  async run() {
    try {
      console.log(chalk.cyan('🚀 开始更新性能基准...\n'));
      
      await this.loadCurrentBenchmarks();
      await this.collectLatestResults();
      await this.saveBenchmarks();
      
      this.printSummary();
      
      console.log(chalk.green('\n✅ 基准更新完成!'));
    } catch (error) {
      console.error(chalk.red('\n❌ 基准更新失败:'), error.message);
      process.exit(1);
    }
  }
}

// 命令行参数处理
if (require.main === module) {
  const updater = new BenchmarkUpdater();
  updater.run();
}

module.exports = BenchmarkUpdater;