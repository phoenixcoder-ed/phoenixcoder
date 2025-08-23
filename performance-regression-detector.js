#!/usr/bin/env node
/**
 * PhoenixCoder 性能回归检测器
 * 智能监控和分析性能变化趋势
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { performance } = require('perf_hooks');

// 性能回归配置
const REGRESSION_CONFIG = {
  // 回归阈值
  thresholds: {
    critical: 0.20,    // 20% 性能下降为严重回归
    warning: 0.10,     // 10% 性能下降为警告
    improvement: -0.05  // 5% 性能提升
  },
  
  // 监控指标
  metrics: {
    backend: {
      'api_response_time': { unit: 'ms', direction: 'lower_better' },
      'database_query_time': { unit: 'ms', direction: 'lower_better' },
      'memory_usage': { unit: 'MB', direction: 'lower_better' },
      'cpu_usage': { unit: '%', direction: 'lower_better' },
      'throughput': { unit: 'req/s', direction: 'higher_better' }
    },
    frontend: {
      'first_contentful_paint': { unit: 'ms', direction: 'lower_better' },
      'largest_contentful_paint': { unit: 'ms', direction: 'lower_better' },
      'cumulative_layout_shift': { unit: 'score', direction: 'lower_better' },
      'first_input_delay': { unit: 'ms', direction: 'lower_better' },
      'bundle_size': { unit: 'KB', direction: 'lower_better' }
    },
    miniapp: {
      'cold_start_time': { unit: 'ms', direction: 'lower_better' },
      'hot_start_time': { unit: 'ms', direction: 'lower_better' },
      'package_size': { unit: 'KB', direction: 'lower_better' },
      'setdata_time': { unit: 'ms', direction: 'lower_better' },
      'render_time': { unit: 'ms', direction: 'lower_better' }
    }
  },
  
  // 历史数据保留
  retention: {
    maxRecords: 100,     // 最多保留100条记录
    maxDays: 90          // 最多保留90天数据
  },
  
  // 报告配置
  reporting: {
    formats: ['console', 'json', 'html', 'slack'],
    outputDir: './performance-reports',
    alertWebhook: process.env.PERFORMANCE_ALERT_WEBHOOK
  }
};

class PerformanceRegressionDetector {
  constructor() {
    this.dataDir = path.join(process.cwd(), 'performance-data');
    this.reportsDir = REGRESSION_CONFIG.reporting.outputDir;
    this.ensureDirectories();
  }
  
  ensureDirectories() {
    [this.dataDir, this.reportsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  // 收集当前性能数据
  async collectCurrentMetrics() {
    console.log('🔍 Collecting current performance metrics...');
    
    const metrics = {
      timestamp: new Date().toISOString(),
      commit: this.getCurrentCommit(),
      branch: this.getCurrentBranch(),
      backend: await this.collectBackendMetrics(),
      frontend: await this.collectFrontendMetrics(),
      miniapp: await this.collectMiniappMetrics()
    };
    
    return metrics;
  }
  
  // 收集后端性能指标
  async collectBackendMetrics() {
    const metrics = {};
    
    try {
      // 运行后端性能测试
      console.log('  📊 Running backend performance tests...');
      const result = execSync(
        'cd apps/community/server && python -m pytest tests/performance/ --benchmark-json=../../../performance-data/backend-benchmark.json --quiet',
        { encoding: 'utf-8', timeout: 300000 }
      );
      
      // 解析基准测试结果
      const benchmarkPath = path.join(this.dataDir, 'backend-benchmark.json');
      if (fs.existsSync(benchmarkPath)) {
        const benchmarkData = JSON.parse(fs.readFileSync(benchmarkPath, 'utf-8'));
        
        benchmarkData.benchmarks?.forEach(benchmark => {
          const metricName = benchmark.name.replace('test_', '').replace('_performance', '');
          metrics[metricName] = {
            mean: benchmark.stats.mean,
            min: benchmark.stats.min,
            max: benchmark.stats.max,
            stddev: benchmark.stats.stddev
          };
        });
      }
      
    } catch (error) {
      console.warn('  ⚠️ Backend performance test failed:', error.message);
      metrics.error = error.message;
    }
    
    return metrics;
  }
  
  // 收集前端性能指标
  async collectFrontendMetrics() {
    const metrics = {};
    
    try {
      console.log('  📊 Running frontend performance tests...');
      const result = execSync(
        'cd apps/community/admin && pnpm run test:performance -- --reporter=json --outputFile=../../../performance-data/frontend-performance.json',
        { encoding: 'utf-8', timeout: 300000 }
      );
      
      // 解析前端性能结果
      const performancePath = path.join(this.dataDir, 'frontend-performance.json');
      if (fs.existsSync(performancePath)) {
        const performanceData = JSON.parse(fs.readFileSync(performancePath, 'utf-8'));
        
        // 提取 Lighthouse 指标
        if (performanceData.lighthouse) {
          metrics.lighthouse = performanceData.lighthouse;
        }
        
        // 提取 Web Vitals
        if (performanceData.webVitals) {
          metrics.webVitals = performanceData.webVitals;
        }
        
        // 提取包大小信息
        if (performanceData.bundleSize) {
          metrics.bundleSize = performanceData.bundleSize;
        }
      }
      
    } catch (error) {
      console.warn('  ⚠️ Frontend performance test failed:', error.message);
      metrics.error = error.message;
    }
    
    return metrics;
  }
  
  // 收集小程序性能指标
  async collectMiniappMetrics() {
    const metrics = {};
    
    try {
      console.log('  📊 Running miniapp performance tests...');
      const result = execSync(
        'cd apps/community/miniapp && pnpm run test:performance -- --reporter=json --outputFile=../../../performance-data/miniapp-performance.json',
        { encoding: 'utf-8', timeout: 300000 }
      );
      
      // 解析小程序性能结果
      const performancePath = path.join(this.dataDir, 'miniapp-performance.json');
      if (fs.existsSync(performancePath)) {
        const performanceData = JSON.parse(fs.readFileSync(performancePath, 'utf-8'));
        
        // 提取性能指标
        performanceData.results?.forEach(result => {
          if (result.metric && result.value !== undefined) {
            metrics[result.metric] = result.value;
          }
        });
      }
      
    } catch (error) {
      console.warn('  ⚠️ Miniapp performance test failed:', error.message);
      metrics.error = error.message;
    }
    
    return metrics;
  }
  
  // 加载历史性能数据
  loadHistoricalData() {
    const historyPath = path.join(this.dataDir, 'performance-history.json');
    
    if (fs.existsSync(historyPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
        return this.cleanupOldData(data);
      } catch (error) {
        console.warn('Failed to load historical data:', error.message);
        return [];
      }
    }
    
    return [];
  }
  
  // 清理过期数据
  cleanupOldData(data) {
    const now = new Date();
    const maxAge = REGRESSION_CONFIG.retention.maxDays * 24 * 60 * 60 * 1000;
    
    return data
      .filter(record => {
        const recordDate = new Date(record.timestamp);
        return (now - recordDate) <= maxAge;
      })
      .slice(-REGRESSION_CONFIG.retention.maxRecords);
  }
  
  // 保存性能数据
  savePerformanceData(currentMetrics, historicalData) {
    const updatedHistory = [...historicalData, currentMetrics];
    const historyPath = path.join(this.dataDir, 'performance-history.json');
    
    fs.writeFileSync(historyPath, JSON.stringify(updatedHistory, null, 2));
    console.log(`💾 Performance data saved to ${historyPath}`);
  }
  
  // 检测性能回归
  detectRegressions(currentMetrics, historicalData) {
    if (historicalData.length === 0) {
      console.log('📊 No historical data available for regression analysis');
      return { regressions: [], improvements: [], warnings: [] };
    }
    
    const baseline = this.calculateBaseline(historicalData);
    const regressions = [];
    const improvements = [];
    const warnings = [];
    
    // 分析各个平台的指标
    ['backend', 'frontend', 'miniapp'].forEach(platform => {
      if (currentMetrics[platform] && baseline[platform]) {
        const platformRegressions = this.analyzePlatformMetrics(
          platform,
          currentMetrics[platform],
          baseline[platform]
        );
        
        regressions.push(...platformRegressions.regressions);
        improvements.push(...platformRegressions.improvements);
        warnings.push(...platformRegressions.warnings);
      }
    });
    
    return { regressions, improvements, warnings };
  }
  
  // 计算基准线（使用最近N次的平均值）
  calculateBaseline(historicalData, windowSize = 5) {
    const recentData = historicalData.slice(-windowSize);
    const baseline = { backend: {}, frontend: {}, miniapp: {} };
    
    ['backend', 'frontend', 'miniapp'].forEach(platform => {
      const platformData = recentData
        .map(record => record[platform])
        .filter(data => data && !data.error);
      
      if (platformData.length > 0) {
        baseline[platform] = this.calculateAverageMetrics(platformData);
      }
    });
    
    return baseline;
  }
  
  // 计算平均指标
  calculateAverageMetrics(dataArray) {
    const metrics = {};
    const allKeys = new Set();
    
    // 收集所有指标键
    dataArray.forEach(data => {
      Object.keys(data).forEach(key => allKeys.add(key));
    });
    
    // 计算每个指标的平均值
    allKeys.forEach(key => {
      const values = dataArray
        .map(data => this.extractNumericValue(data[key]))
        .filter(value => value !== null);
      
      if (values.length > 0) {
        metrics[key] = values.reduce((sum, value) => sum + value, 0) / values.length;
      }
    });
    
    return metrics;
  }
  
  // 提取数值
  extractNumericValue(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && value.mean !== undefined) return value.mean;
    if (typeof value === 'object' && value.value !== undefined) return value.value;
    return null;
  }
  
  // 分析平台指标
  analyzePlatformMetrics(platform, currentMetrics, baselineMetrics) {
    const regressions = [];
    const improvements = [];
    const warnings = [];
    
    Object.keys(currentMetrics).forEach(metricName => {
      if (metricName === 'error' || !baselineMetrics[metricName]) return;
      
      const currentValue = this.extractNumericValue(currentMetrics[metricName]);
      const baselineValue = baselineMetrics[metricName];
      
      if (currentValue === null || baselineValue === null) return;
      
      const change = (currentValue - baselineValue) / baselineValue;
      const metricConfig = REGRESSION_CONFIG.metrics[platform]?.[metricName];
      const direction = metricConfig?.direction || 'lower_better';
      
      // 根据指标方向调整变化值
      const adjustedChange = direction === 'higher_better' ? -change : change;
      
      const result = {
        platform,
        metric: metricName,
        current: currentValue,
        baseline: baselineValue,
        change: change,
        changePercent: `${(change * 100).toFixed(1)}%`,
        unit: metricConfig?.unit || ''
      };
      
      if (adjustedChange >= REGRESSION_CONFIG.thresholds.critical) {
        regressions.push({ ...result, severity: 'critical' });
      } else if (adjustedChange >= REGRESSION_CONFIG.thresholds.warning) {
        warnings.push({ ...result, severity: 'warning' });
      } else if (adjustedChange <= REGRESSION_CONFIG.thresholds.improvement) {
        improvements.push({ ...result, severity: 'improvement' });
      }
    });
    
    return { regressions, improvements, warnings };
  }
  
  // 生成回归报告
  generateRegressionReport(analysis, currentMetrics) {
    const report = {
      timestamp: new Date().toISOString(),
      commit: currentMetrics.commit,
      branch: currentMetrics.branch,
      summary: {
        totalRegressions: analysis.regressions.length,
        criticalRegressions: analysis.regressions.filter(r => r.severity === 'critical').length,
        warnings: analysis.warnings.length,
        improvements: analysis.improvements.length
      },
      details: analysis
    };
    
    return report;
  }
  
  // 输出控制台报告
  outputConsoleReport(report) {
    console.log('\n🔍 Performance Regression Analysis Report');
    console.log('=' .repeat(50));
    console.log(`📅 Timestamp: ${report.timestamp}`);
    console.log(`🌿 Branch: ${report.branch}`);
    console.log(`📝 Commit: ${report.commit}`);
    console.log('');
    
    // 摘要
    console.log('📊 Summary:');
    console.log(`  🔴 Critical Regressions: ${report.summary.criticalRegressions}`);
    console.log(`  🟡 Warnings: ${report.summary.warnings}`);
    console.log(`  🟢 Improvements: ${report.summary.improvements}`);
    console.log('');
    
    // 严重回归
    if (report.details.regressions.length > 0) {
      console.log('🚨 Critical Regressions:');
      report.details.regressions.forEach(regression => {
        console.log(`  ❌ ${regression.platform}.${regression.metric}: ${regression.changePercent} (${regression.baseline.toFixed(2)} → ${regression.current.toFixed(2)} ${regression.unit})`);
      });
      console.log('');
    }
    
    // 警告
    if (report.details.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      report.details.warnings.forEach(warning => {
        console.log(`  🟡 ${warning.platform}.${warning.metric}: ${warning.changePercent} (${warning.baseline.toFixed(2)} → ${warning.current.toFixed(2)} ${warning.unit})`);
      });
      console.log('');
    }
    
    // 改进
    if (report.details.improvements.length > 0) {
      console.log('🎉 Improvements:');
      report.details.improvements.forEach(improvement => {
        console.log(`  ✅ ${improvement.platform}.${improvement.metric}: ${improvement.changePercent} (${improvement.baseline.toFixed(2)} → ${improvement.current.toFixed(2)} ${improvement.unit})`);
      });
      console.log('');
    }
  }
  
  // 保存JSON报告
  saveJsonReport(report) {
    const reportPath = path.join(this.reportsDir, `regression-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`💾 JSON report saved to ${reportPath}`);
    return reportPath;
  }
  
  // 生成HTML报告
  generateHtmlReport(report) {
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Regression Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .critical { color: #dc3545; }
        .warning { color: #ffc107; }
        .improvement { color: #28a745; }
        .section { margin-bottom: 30px; }
        .section h3 { border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .regression-item { background: #fff; border: 1px solid #ddd; border-radius: 4px; padding: 15px; margin-bottom: 10px; }
        .regression-item.critical { border-left: 4px solid #dc3545; }
        .regression-item.warning { border-left: 4px solid #ffc107; }
        .regression-item.improvement { border-left: 4px solid #28a745; }
        .metric-details { display: flex; justify-content: space-between; align-items: center; }
        .change-badge { padding: 4px 8px; border-radius: 4px; font-weight: bold; color: white; }
        .change-badge.critical { background: #dc3545; }
        .change-badge.warning { background: #ffc107; }
        .change-badge.improvement { background: #28a745; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Performance Regression Report</h1>
            <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
            <p>Branch: ${report.branch} | Commit: ${report.commit}</p>
        </div>
        
        <div class="content">
            <div class="summary">
                <div class="metric-card">
                    <div class="metric-value critical">${report.summary.criticalRegressions}</div>
                    <div>Critical Regressions</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value warning">${report.summary.warnings}</div>
                    <div>Warnings</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value improvement">${report.summary.improvements}</div>
                    <div>Improvements</div>
                </div>
            </div>
            
            ${this.generateHtmlSection('🚨 Critical Regressions', report.details.regressions, 'critical')}
            ${this.generateHtmlSection('⚠️ Warnings', report.details.warnings, 'warning')}
            ${this.generateHtmlSection('🎉 Improvements', report.details.improvements, 'improvement')}
        </div>
    </div>
</body>
</html>`;
    
    const reportPath = path.join(this.reportsDir, `regression-report-${Date.now()}.html`);
    fs.writeFileSync(reportPath, htmlTemplate);
    console.log(`📄 HTML report saved to ${reportPath}`);
    return reportPath;
  }
  
  generateHtmlSection(title, items, className) {
    if (items.length === 0) return '';
    
    const itemsHtml = items.map(item => `
        <div class="regression-item ${className}">
            <div class="metric-details">
                <div>
                    <strong>${item.platform}.${item.metric}</strong>
                    <div style="color: #666; font-size: 0.9em;">
                        ${item.baseline.toFixed(2)} → ${item.current.toFixed(2)} ${item.unit}
                    </div>
                </div>
                <span class="change-badge ${className}">${item.changePercent}</span>
            </div>
        </div>
    `).join('');
    
    return `
        <div class="section">
            <h3>${title}</h3>
            ${itemsHtml}
        </div>
    `;
  }
  
  // 发送告警
  async sendAlert(report) {
    if (!REGRESSION_CONFIG.reporting.alertWebhook) return;
    
    if (report.summary.criticalRegressions > 0) {
      const message = {
        text: `🚨 Performance Regression Alert`,
        attachments: [{
          color: 'danger',
          fields: [
            { title: 'Branch', value: report.branch, short: true },
            { title: 'Commit', value: report.commit, short: true },
            { title: 'Critical Regressions', value: report.summary.criticalRegressions, short: true },
            { title: 'Warnings', value: report.summary.warnings, short: true }
          ]
        }]
      };
      
      try {
        const response = await fetch(REGRESSION_CONFIG.reporting.alertWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        });
        
        if (response.ok) {
          console.log('📢 Alert sent successfully');
        }
      } catch (error) {
        console.warn('Failed to send alert:', error.message);
      }
    }
  }
  
  // 获取当前提交信息
  getCurrentCommit() {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    } catch {
      return 'unknown';
    }
  }
  
  getCurrentBranch() {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    } catch {
      return 'unknown';
    }
  }
  
  // 主要执行方法
  async run() {
    console.log('🚀 Starting performance regression detection...');
    const startTime = performance.now();
    
    try {
      // 1. 收集当前性能数据
      const currentMetrics = await this.collectCurrentMetrics();
      
      // 2. 加载历史数据
      const historicalData = this.loadHistoricalData();
      
      // 3. 检测回归
      const analysis = this.detectRegressions(currentMetrics, historicalData);
      
      // 4. 生成报告
      const report = this.generateRegressionReport(analysis, currentMetrics);
      
      // 5. 输出报告
      this.outputConsoleReport(report);
      this.saveJsonReport(report);
      this.generateHtmlReport(report);
      
      // 6. 发送告警
      await this.sendAlert(report);
      
      // 7. 保存当前数据到历史记录
      this.savePerformanceData(currentMetrics, historicalData);
      
      const endTime = performance.now();
      console.log(`\n✅ Regression detection completed in ${(endTime - startTime).toFixed(2)}ms`);
      
      // 返回退出码
      return report.summary.criticalRegressions > 0 ? 1 : 0;
      
    } catch (error) {
      console.error('❌ Regression detection failed:', error.message);
      return 1;
    }
  }
}

// CLI 接口
if (require.main === module) {
  const detector = new PerformanceRegressionDetector();
  detector.run().then(exitCode => {
    process.exit(exitCode);
  });
}

module.exports = PerformanceRegressionDetector;