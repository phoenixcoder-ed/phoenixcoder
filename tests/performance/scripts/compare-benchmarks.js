#!/usr/bin/env node

/**
 * PhoenixCoder 性能基准比较脚本
 * 用于比较不同版本的性能基准数据
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const moment = require('moment');
const { table } = require('table');
const yargs = require('yargs');

class BenchmarkComparator {
  constructor(options = {}) {
    this.benchmarksFile = path.join(__dirname, '..', 'benchmarks.json');
    this.reportsDir = path.join(__dirname, '..', '..', '..', 'reports', 'performance');
    this.options = options;
    this.currentBenchmarks = null;
    this.comparisonBenchmarks = null;
  }

  async loadBenchmarks(filePath) {
    try {
      if (await fs.pathExists(filePath)) {
        return await fs.readJson(filePath);
      } else {
        throw new Error(`基准文件不存在: ${filePath}`);
      }
    } catch (error) {
      console.error(chalk.red('✗ 加载基准数据失败:'), error.message);
      throw error;
    }
  }

  async findBackupBenchmarks() {
    const backupFiles = [];
    const benchmarksDir = path.dirname(this.benchmarksFile);
    
    if (await fs.pathExists(benchmarksDir)) {
      const files = await fs.readdir(benchmarksDir);
      
      for (const file of files) {
        if (file.startsWith('benchmarks-backup-') && file.endsWith('.json')) {
          const filePath = path.join(benchmarksDir, file);
          const stats = await fs.stat(filePath);
          backupFiles.push({
            path: filePath,
            name: file,
            mtime: stats.mtime
          });
        }
      }
    }
    
    return backupFiles.sort((a, b) => b.mtime - a.mtime);
  }

  async selectComparisonFile() {
    if (this.options.compareWith) {
      return this.options.compareWith;
    }
    
    const backupFiles = await this.findBackupBenchmarks();
    
    if (backupFiles.length === 0) {
      throw new Error('未找到可比较的基准文件');
    }
    
    console.log(chalk.blue('📁 可用的基准文件:'));
    backupFiles.forEach((file, index) => {
      const date = moment(file.mtime).format('YYYY-MM-DD HH:mm:ss');
      console.log(`  ${index + 1}. ${file.name} (${date})`);
    });
    
    // 默认使用最新的备份文件
    return backupFiles[0].path;
  }

  compareMetrics(current, previous, category) {
    const comparison = {
      category,
      improvements: [],
      regressions: [],
      unchanged: [],
      new: [],
      removed: []
    };

    // 检查当前版本中的指标
    for (const [key, value] of Object.entries(current)) {
      if (previous[key] === undefined) {
        comparison.new.push({ key, current: value });
      } else {
        const change = this.calculateChange(previous[key], value);
        if (Math.abs(change.percentage) < 5) {
          comparison.unchanged.push({ key, current: value, previous: previous[key], change });
        } else if (change.percentage < 0) {
          comparison.improvements.push({ key, current: value, previous: previous[key], change });
        } else {
          comparison.regressions.push({ key, current: value, previous: previous[key], change });
        }
      }
    }

    // 检查已删除的指标
    for (const [key, value] of Object.entries(previous)) {
      if (current[key] === undefined) {
        comparison.removed.push({ key, previous: value });
      }
    }

    return comparison;
  }

  calculateChange(previous, current) {
    if (typeof previous === 'object' && typeof current === 'object') {
      // 对于对象，计算主要指标的变化
      const prevValue = previous.p95 || previous.avg || previous.loadTime || 0;
      const currValue = current.p95 || current.avg || current.loadTime || 0;
      
      if (prevValue === 0) return { absolute: currValue, percentage: 0 };
      
      const absolute = currValue - prevValue;
      const percentage = (absolute / prevValue) * 100;
      
      return { absolute, percentage };
    } else if (typeof previous === 'number' && typeof current === 'number') {
      if (previous === 0) return { absolute: current, percentage: 0 };
      
      const absolute = current - previous;
      const percentage = (absolute / previous) * 100;
      
      return { absolute, percentage };
    }
    
    return { absolute: 0, percentage: 0 };
  }

  async compareAllMetrics() {
    const comparisons = {};
    
    // 比较 API 指标
    if (this.currentBenchmarks.api && this.comparisonBenchmarks.api) {
      comparisons.api = {};
      
      for (const category of Object.keys(this.currentBenchmarks.api)) {
        const current = this.currentBenchmarks.api[category] || {};
        const previous = this.comparisonBenchmarks.api[category] || {};
        
        comparisons.api[category] = this.compareMetrics(current, previous, `API - ${category}`);
      }
    }
    
    // 比较前端指标
    if (this.currentBenchmarks.frontend && this.comparisonBenchmarks.frontend) {
      comparisons.frontend = {};
      
      for (const category of Object.keys(this.currentBenchmarks.frontend)) {
        const current = this.currentBenchmarks.frontend[category] || {};
        const previous = this.comparisonBenchmarks.frontend[category] || {};
        
        comparisons.frontend[category] = this.compareMetrics(current, previous, `Frontend - ${category}`);
      }
    }
    
    // 比较场景指标
    if (this.currentBenchmarks.scenarios && this.comparisonBenchmarks.scenarios) {
      const current = this.currentBenchmarks.scenarios;
      const previous = this.comparisonBenchmarks.scenarios;
      
      comparisons.scenarios = this.compareMetrics(current, previous, 'Scenarios');
    }
    
    return comparisons;
  }

  generateSummaryTable(comparisons) {
    const summaryData = [];
    let totalImprovements = 0;
    let totalRegressions = 0;
    let totalNew = 0;
    let totalRemoved = 0;
    
    const processComparison = (comp, category) => {
      if (comp.improvements.length > 0 || comp.regressions.length > 0 || 
          comp.new.length > 0 || comp.removed.length > 0) {
        summaryData.push([
          category,
          chalk.green(comp.improvements.length.toString()),
          chalk.red(comp.regressions.length.toString()),
          chalk.blue(comp.new.length.toString()),
          chalk.yellow(comp.removed.length.toString()),
          chalk.gray(comp.unchanged.length.toString())
        ]);
        
        totalImprovements += comp.improvements.length;
        totalRegressions += comp.regressions.length;
        totalNew += comp.new.length;
        totalRemoved += comp.removed.length;
      }
    };
    
    // 处理 API 比较
    if (comparisons.api) {
      for (const [category, comp] of Object.entries(comparisons.api)) {
        processComparison(comp, `API/${category}`);
      }
    }
    
    // 处理前端比较
    if (comparisons.frontend) {
      for (const [category, comp] of Object.entries(comparisons.frontend)) {
        processComparison(comp, `Frontend/${category}`);
      }
    }
    
    // 处理场景比较
    if (comparisons.scenarios) {
      processComparison(comparisons.scenarios, 'Scenarios');
    }
    
    // 添加总计行
    summaryData.push([
      chalk.bold('总计'),
      chalk.bold.green(totalImprovements.toString()),
      chalk.bold.red(totalRegressions.toString()),
      chalk.bold.blue(totalNew.toString()),
      chalk.bold.yellow(totalRemoved.toString()),
      chalk.bold.gray('-')
    ]);
    
    const tableData = [
      [chalk.bold('类别'), chalk.bold('改进'), chalk.bold('回归'), chalk.bold('新增'), chalk.bold('删除'), chalk.bold('无变化')],
      ...summaryData
    ];
    
    return table(tableData, {
      border: {
        topBody: '─',
        topJoin: '┬',
        topLeft: '┌',
        topRight: '┐',
        bottomBody: '─',
        bottomJoin: '┴',
        bottomLeft: '└',
        bottomRight: '┘',
        bodyLeft: '│',
        bodyRight: '│',
        bodyJoin: '│',
        joinBody: '─',
        joinLeft: '├',
        joinRight: '┤',
        joinJoin: '┼'
      }
    });
  }

  generateDetailedReport(comparisons) {
    let report = '';
    
    const formatMetric = (metric) => {
      if (typeof metric === 'object') {
        return `p95: ${metric.p95}ms, p99: ${metric.p99}ms`;
      }
      return metric.toString();
    };
    
    const processChanges = (changes, title, color) => {
      if (changes.length === 0) return '';
      
      let section = `\n${color(title)}:\n`;
      
      for (const change of changes) {
        const changeText = change.change ? 
          `${change.change.percentage > 0 ? '+' : ''}${change.change.percentage.toFixed(1)}%` : 
          'new';
        
        section += `  • ${change.key}: ${formatMetric(change.current)}`;
        if (change.previous) {
          section += ` (was: ${formatMetric(change.previous)}, ${changeText})`;
        }
        section += '\n';
      }
      
      return section;
    };
    
    const processComparison = (comp, category) => {
      if (comp.improvements.length === 0 && comp.regressions.length === 0 && 
          comp.new.length === 0 && comp.removed.length === 0) {
        return '';
      }
      
      let section = `\n${chalk.cyan.bold(`=== ${category} ===`)}\n`;
      
      section += processChanges(comp.improvements, '🚀 性能改进', chalk.green);
      section += processChanges(comp.regressions, '⚠️  性能回归', chalk.red);
      section += processChanges(comp.new, '✨ 新增指标', chalk.blue);
      section += processChanges(comp.removed, '🗑️  删除指标', chalk.yellow);
      
      return section;
    };
    
    // 处理 API 比较
    if (comparisons.api) {
      for (const [category, comp] of Object.entries(comparisons.api)) {
        report += processComparison(comp, `API - ${category}`);
      }
    }
    
    // 处理前端比较
    if (comparisons.frontend) {
      for (const [category, comp] of Object.entries(comparisons.frontend)) {
        report += processComparison(comp, `Frontend - ${category}`);
      }
    }
    
    // 处理场景比较
    if (comparisons.scenarios) {
      report += processComparison(comparisons.scenarios, 'Test Scenarios');
    }
    
    return report;
  }

  async generateHtmlReport(comparisons) {
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PhoenixCoder 性能基准比较报告</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; }
        .metric-card { background: #f8f9fa; border-radius: 6px; padding: 20px; margin: 15px 0; border-left: 4px solid #007bff; }
        .improvement { border-left-color: #28a745; }
        .regression { border-left-color: #dc3545; }
        .new { border-left-color: #17a2b8; }
        .removed { border-left-color: #ffc107; }
        .metric-title { font-weight: bold; margin-bottom: 10px; }
        .metric-value { font-family: 'Monaco', 'Menlo', monospace; }
        .change-positive { color: #28a745; }
        .change-negative { color: #dc3545; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .summary-card { background: white; border-radius: 6px; padding: 20px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .summary-number { font-size: 2em; font-weight: bold; margin-bottom: 10px; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 PhoenixCoder 性能基准比较报告</h1>
            <p class="timestamp">生成时间: ${moment().format('YYYY-MM-DD HH:mm:ss')}</p>
            <p>当前版本: ${this.currentBenchmarks.version} | 对比版本: ${this.comparisonBenchmarks.version}</p>
        </div>
        
        <div class="content">
            ${this.generateHtmlSummary(comparisons)}
            ${this.generateHtmlDetails(comparisons)}
        </div>
    </div>
</body>
</html>
    `;
    
    const reportPath = path.join(this.reportsDir, `benchmark-comparison-${moment().format('YYYYMMDD-HHmmss')}.html`);
    await fs.ensureDir(this.reportsDir);
    await fs.writeFile(reportPath, htmlTemplate);
    
    return reportPath;
  }

  generateHtmlSummary(comparisons) {
    let totalImprovements = 0;
    let totalRegressions = 0;
    let totalNew = 0;
    let totalRemoved = 0;
    
    const countChanges = (comp) => {
      totalImprovements += comp.improvements?.length || 0;
      totalRegressions += comp.regressions?.length || 0;
      totalNew += comp.new?.length || 0;
      totalRemoved += comp.removed?.length || 0;
    };
    
    // 统计所有变化
    if (comparisons.api) {
      Object.values(comparisons.api).forEach(countChanges);
    }
    if (comparisons.frontend) {
      Object.values(comparisons.frontend).forEach(countChanges);
    }
    if (comparisons.scenarios) {
      countChanges(comparisons.scenarios);
    }
    
    return `
        <div class="summary-grid">
            <div class="summary-card improvement">
                <div class="summary-number change-positive">${totalImprovements}</div>
                <div>性能改进</div>
            </div>
            <div class="summary-card regression">
                <div class="summary-number change-negative">${totalRegressions}</div>
                <div>性能回归</div>
            </div>
            <div class="summary-card new">
                <div class="summary-number" style="color: #17a2b8;">${totalNew}</div>
                <div>新增指标</div>
            </div>
            <div class="summary-card removed">
                <div class="summary-number" style="color: #ffc107;">${totalRemoved}</div>
                <div>删除指标</div>
            </div>
        </div>
    `;
  }

  generateHtmlDetails(comparisons) {
    let html = '<h2>详细变化</h2>';
    
    const processComparison = (comp, category) => {
      if (!comp.improvements?.length && !comp.regressions?.length && 
          !comp.new?.length && !comp.removed?.length) {
        return '';
      }
      
      let section = `<h3>${category}</h3>`;
      
      const processChanges = (changes, title, className) => {
        if (!changes?.length) return '';
        
        let changeHtml = `<div class="metric-card ${className}"><div class="metric-title">${title}</div>`;
        
        for (const change of changes) {
          const changeText = change.change ? 
            `${change.change.percentage > 0 ? '+' : ''}${change.change.percentage.toFixed(1)}%` : 
            'new';
          
          changeHtml += `<div class="metric-value">${change.key}: ${JSON.stringify(change.current)}`;
          if (change.previous) {
            changeHtml += ` (${changeText})`;
          }
          changeHtml += '</div>';
        }
        
        changeHtml += '</div>';
        return changeHtml;
      };
      
      section += processChanges(comp.improvements, '🚀 性能改进', 'improvement');
      section += processChanges(comp.regressions, '⚠️ 性能回归', 'regression');
      section += processChanges(comp.new, '✨ 新增指标', 'new');
      section += processChanges(comp.removed, '🗑️ 删除指标', 'removed');
      
      return section;
    };
    
    // 处理所有比较结果
    if (comparisons.api) {
      for (const [category, comp] of Object.entries(comparisons.api)) {
        html += processComparison(comp, `API - ${category}`);
      }
    }
    
    if (comparisons.frontend) {
      for (const [category, comp] of Object.entries(comparisons.frontend)) {
        html += processComparison(comp, `Frontend - ${category}`);
      }
    }
    
    if (comparisons.scenarios) {
      html += processComparison(comparisons.scenarios, 'Test Scenarios');
    }
    
    return html;
  }

  async run() {
    try {
      console.log(chalk.cyan('🔍 开始比较性能基准...\n'));
      
      // 加载当前基准
      this.currentBenchmarks = await this.loadBenchmarks(this.benchmarksFile);
      console.log(chalk.green('✓ 已加载当前基准数据'));
      
      // 选择比较文件
      const comparisonFile = await this.selectComparisonFile();
      this.comparisonBenchmarks = await this.loadBenchmarks(comparisonFile);
      console.log(chalk.green(`✓ 已加载比较基准数据: ${path.basename(comparisonFile)}`));
      
      // 执行比较
      const comparisons = await this.compareAllMetrics();
      
      // 显示摘要表格
      console.log(chalk.cyan('\n📊 比较摘要:'));
      console.log(this.generateSummaryTable(comparisons));
      
      // 显示详细报告
      if (this.options.detailed) {
        console.log(this.generateDetailedReport(comparisons));
      }
      
      // 生成 HTML 报告
      if (this.options.html) {
        const htmlReportPath = await this.generateHtmlReport(comparisons);
        console.log(chalk.blue(`📄 HTML 报告已生成: ${htmlReportPath}`));
      }
      
      console.log(chalk.green('\n✅ 基准比较完成!'));
    } catch (error) {
      console.error(chalk.red('\n❌ 基准比较失败:'), error.message);
      process.exit(1);
    }
  }
}

// 命令行参数处理
if (require.main === module) {
  const argv = yargs
    .option('compare-with', {
      alias: 'c',
      type: 'string',
      description: '指定要比较的基准文件路径'
    })
    .option('detailed', {
      alias: 'd',
      type: 'boolean',
      default: false,
      description: '显示详细的比较报告'
    })
    .option('html', {
      alias: 'h',
      type: 'boolean',
      default: true,
      description: '生成 HTML 格式的报告'
    })
    .help()
    .argv;
  
  const comparator = new BenchmarkComparator(argv);
  comparator.run();
}

module.exports = BenchmarkComparator;