#!/usr/bin/env node

/**
 * 测试报告生成脚本
 * 用于生成详细的测试和性能报告
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`)
};

/**
 * 读取JSON文件
 */
function readJsonFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
    return null;
  } catch (error) {
    log.warning(`读取文件失败: ${filePath} - ${error.message}`);
    return null;
  }
}

/**
 * 写入文件
 */
function writeFile(filePath, content) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    log.error(`写入文件失败: ${filePath} - ${error.message}`);
    return false;
  }
}

/**
 * 获取Git信息
 */
function getGitInfo() {
  try {
    const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const author = execSync('git log -1 --pretty=format:"%an"', { encoding: 'utf8' }).trim();
    const date = execSync('git log -1 --pretty=format:"%ci"', { encoding: 'utf8' }).trim();
    const message = execSync('git log -1 --pretty=format:"%s"', { encoding: 'utf8' }).trim();
    
    return {
      commit: commit.substring(0, 8),
      branch,
      author,
      date,
      message
    };
  } catch (error) {
    log.warning('获取Git信息失败');
    return {
      commit: 'unknown',
      branch: 'unknown',
      author: 'unknown',
      date: new Date().toISOString(),
      message: 'unknown'
    };
  }
}

/**
 * 获取项目信息
 */
function getProjectInfo() {
  const packageJson = readJsonFile('package.json');
  const gitInfo = getGitInfo();
  
  return {
    name: packageJson?.name || 'Unknown Project',
    version: packageJson?.version || '0.0.0',
    description: packageJson?.description || '',
    git: gitInfo,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  };
}

/**
 * 收集测试结果
 */
function collectTestResults() {
  const results = {
    unit_tests: null,
    integration_tests: null,
    e2e_tests: null,
    coverage: null,
    performance: null
  };
  
  // 查找测试结果文件
  const testFiles = [
    'test-results/junit.xml',
    'test-results/test-results.json',
    'coverage/coverage-summary.json',
    'test-results/performance-*.json'
  ];
  
  // Jest测试结果
  const jestResults = readJsonFile('test-results/jest-results.json');
  if (jestResults) {
    results.unit_tests = {
      total: jestResults.numTotalTests || 0,
      passed: jestResults.numPassedTests || 0,
      failed: jestResults.numFailedTests || 0,
      skipped: jestResults.numPendingTests || 0,
      duration: jestResults.testResults?.reduce((acc, test) => acc + (test.perfStats?.end - test.perfStats?.start || 0), 0) || 0
    };
  }
  
  // 覆盖率结果
  const coverageResults = readJsonFile('coverage/coverage-summary.json');
  if (coverageResults && coverageResults.total) {
    results.coverage = {
      lines: coverageResults.total.lines.pct,
      functions: coverageResults.total.functions.pct,
      branches: coverageResults.total.branches.pct,
      statements: coverageResults.total.statements.pct
    };
  }
  
  // 性能测试结果
  const performanceFiles = [
    'test-results/performance-build.json',
    'test-results/performance-database.json',
    'test-results/performance-benchmark.json'
  ];
  
  const performanceResults = {};
  performanceFiles.forEach(file => {
    const data = readJsonFile(file);
    if (data) {
      const key = path.basename(file, '.json').replace('performance-', '');
      performanceResults[key] = data;
    }
  });
  
  if (Object.keys(performanceResults).length > 0) {
    results.performance = performanceResults;
  }
  
  return results;
}

/**
 * 生成Markdown报告
 */
function generateMarkdownReport(projectInfo, testResults) {
  const report = `# 📊 测试报告

## 📋 项目信息

- **项目名称**: ${projectInfo.name}
- **版本**: ${projectInfo.version}
- **描述**: ${projectInfo.description}
- **环境**: ${projectInfo.environment}
- **生成时间**: ${new Date(projectInfo.timestamp).toLocaleString()}

## 🔧 Git信息

- **分支**: ${projectInfo.git.branch}
- **提交**: ${projectInfo.git.commit}
- **作者**: ${projectInfo.git.author}
- **提交时间**: ${projectInfo.git.date}
- **提交信息**: ${projectInfo.git.message}

## 🧪 测试结果

### 单元测试

${testResults.unit_tests ? `
- **总计**: ${testResults.unit_tests.total}
- **通过**: ${testResults.unit_tests.passed} ✅
- **失败**: ${testResults.unit_tests.failed} ${testResults.unit_tests.failed > 0 ? '❌' : '✅'}
- **跳过**: ${testResults.unit_tests.skipped}
- **耗时**: ${(testResults.unit_tests.duration / 1000).toFixed(2)}秒
- **成功率**: ${((testResults.unit_tests.passed / testResults.unit_tests.total) * 100).toFixed(1)}%
` : '❌ 未找到单元测试结果'}

### 代码覆盖率

${testResults.coverage ? `
- **行覆盖率**: ${testResults.coverage.lines}% ${testResults.coverage.lines >= 80 ? '✅' : '⚠️'}
- **函数覆盖率**: ${testResults.coverage.functions}% ${testResults.coverage.functions >= 80 ? '✅' : '⚠️'}
- **分支覆盖率**: ${testResults.coverage.branches}% ${testResults.coverage.branches >= 80 ? '✅' : '⚠️'}
- **语句覆盖率**: ${testResults.coverage.statements}% ${testResults.coverage.statements >= 80 ? '✅' : '⚠️'}
` : '❌ 未找到覆盖率数据'}

## 🚀 性能测试

${testResults.performance ? Object.entries(testResults.performance).map(([key, data]) => {
    if (key === 'build' && data.build_time) {
      return `### 构建性能\n\n- **构建时间**: ${data.build_time}秒 ${data.build_time < 60 ? '✅' : '⚠️'}\n`;
    }
    if (key === 'database' && data.tests) {
      return `### 数据库性能\n\n${data.tests.map(test => 
        `- **${test.name}**: ${test.duration.toFixed(4)} ${test.unit}`
      ).join('\n')}\n`;
    }
    return `### ${key}\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n`;
  }).join('\n') : '❌ 未找到性能测试数据'}

## 📈 趋势分析

> 性能趋势图和历史对比将在后续版本中添加

## 🔍 建议

${generateRecommendations(testResults)}

---

*报告生成时间: ${new Date().toLocaleString()}*
`;

  return report;
}

/**
 * 生成建议
 */
function generateRecommendations(testResults) {
  const recommendations = [];
  
  // 测试覆盖率建议
  if (testResults.coverage) {
    const avgCoverage = (testResults.coverage.lines + testResults.coverage.functions + 
                        testResults.coverage.branches + testResults.coverage.statements) / 4;
    
    if (avgCoverage < 70) {
      recommendations.push('🔴 **代码覆盖率偏低** - 建议增加测试用例，目标覆盖率应达到80%以上');
    } else if (avgCoverage < 80) {
      recommendations.push('🟡 **代码覆盖率需要改进** - 当前覆盖率良好，建议继续提升至80%以上');
    } else {
      recommendations.push('🟢 **代码覆盖率良好** - 保持当前的测试质量');
    }
  }
  
  // 测试失败建议
  if (testResults.unit_tests && testResults.unit_tests.failed > 0) {
    recommendations.push('🔴 **存在失败的测试用例** - 请及时修复失败的测试，确保代码质量');
  }
  
  // 性能建议
  if (testResults.performance?.build?.build_time > 120) {
    recommendations.push('🟡 **构建时间较长** - 考虑优化构建配置或使用缓存机制');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('🟢 **整体质量良好** - 继续保持当前的开发和测试标准');
  }
  
  return recommendations.join('\n\n');
}

/**
 * 生成HTML报告
 */
function generateHtmlReport(projectInfo, testResults) {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>测试报告 - ${projectInfo.name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { opacity: 0.9; font-size: 1.1em; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .card h2 { color: #2c3e50; margin-bottom: 20px; font-size: 1.5em; }
        .metric { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee; }
        .metric:last-child { border-bottom: none; }
        .metric-label { font-weight: 500; }
        .metric-value { font-weight: bold; }
        .success { color: #27ae60; }
        .warning { color: #f39c12; }
        .error { color: #e74c3c; }
        .progress-bar { width: 100%; height: 8px; background: #ecf0f1; border-radius: 4px; overflow: hidden; margin: 5px 0; }
        .progress-fill { height: 100%; transition: width 0.3s ease; }
        .progress-success { background: #27ae60; }
        .progress-warning { background: #f39c12; }
        .progress-error { background: #e74c3c; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .badge-success { background: #d4edda; color: #155724; }
        .badge-warning { background: #fff3cd; color: #856404; }
        .badge-error { background: #f8d7da; color: #721c24; }
        .recommendations { background: #e8f4fd; border-left: 4px solid #3498db; padding: 20px; border-radius: 5px; }
        .chart-container { height: 300px; margin: 20px 0; }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 测试报告</h1>
            <p>${projectInfo.name} v${projectInfo.version} - ${new Date(projectInfo.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="grid">
            <div class="card">
                <h2>📋 项目信息</h2>
                <div class="metric">
                    <span class="metric-label">项目名称</span>
                    <span class="metric-value">${projectInfo.name}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">版本</span>
                    <span class="metric-value">${projectInfo.version}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">环境</span>
                    <span class="metric-value">${projectInfo.environment}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">分支</span>
                    <span class="metric-value">${projectInfo.git.branch}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">提交</span>
                    <span class="metric-value">${projectInfo.git.commit}</span>
                </div>
            </div>
            
            ${testResults.unit_tests ? `
            <div class="card">
                <h2>🧪 单元测试</h2>
                <div class="metric">
                    <span class="metric-label">总计</span>
                    <span class="metric-value">${testResults.unit_tests.total}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">通过</span>
                    <span class="metric-value success">${testResults.unit_tests.passed}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">失败</span>
                    <span class="metric-value ${testResults.unit_tests.failed > 0 ? 'error' : 'success'}">${testResults.unit_tests.failed}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">成功率</span>
                    <span class="metric-value">${((testResults.unit_tests.passed / testResults.unit_tests.total) * 100).toFixed(1)}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill progress-success" style="width: ${(testResults.unit_tests.passed / testResults.unit_tests.total) * 100}%"></div>
                </div>
            </div>
            ` : ''}
            
            ${testResults.coverage ? `
            <div class="card">
                <h2>📈 代码覆盖率</h2>
                <div class="metric">
                    <span class="metric-label">行覆盖率</span>
                    <span class="metric-value ${testResults.coverage.lines >= 80 ? 'success' : 'warning'}">${testResults.coverage.lines}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${testResults.coverage.lines >= 80 ? 'progress-success' : 'progress-warning'}" style="width: ${testResults.coverage.lines}%"></div>
                </div>
                <div class="metric">
                    <span class="metric-label">函数覆盖率</span>
                    <span class="metric-value ${testResults.coverage.functions >= 80 ? 'success' : 'warning'}">${testResults.coverage.functions}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${testResults.coverage.functions >= 80 ? 'progress-success' : 'progress-warning'}" style="width: ${testResults.coverage.functions}%"></div>
                </div>
                <div class="metric">
                    <span class="metric-label">分支覆盖率</span>
                    <span class="metric-value ${testResults.coverage.branches >= 80 ? 'success' : 'warning'}">${testResults.coverage.branches}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${testResults.coverage.branches >= 80 ? 'progress-success' : 'progress-warning'}" style="width: ${testResults.coverage.branches}%"></div>
                </div>
            </div>
            ` : ''}
        </div>
        
        ${testResults.performance ? `
        <div class="card">
            <h2>🚀 性能测试</h2>
            ${Object.entries(testResults.performance).map(([key, data]) => {
              if (key === 'build' && data.build_time) {
                return `
                <div class="metric">
                    <span class="metric-label">构建时间</span>
                    <span class="metric-value ${data.build_time < 60 ? 'success' : 'warning'}">${data.build_time}秒</span>
                </div>`;
              }
              return '';
            }).join('')}
        </div>
        ` : ''}
        
        <div class="recommendations">
            <h2>🔍 建议</h2>
            ${generateRecommendations(testResults).split('\n\n').map(rec => `<p>${rec}</p>`).join('')}
        </div>
    </div>
    
    <script>
        // 添加图表和交互功能
        console.log('测试报告加载完成');
    </script>
</body>
</html>`;

  return html;
}

/**
 * 生成JSON报告
 */
function generateJsonReport(projectInfo, testResults) {
  return {
    project: projectInfo,
    results: testResults,
    summary: {
      total_tests: testResults.unit_tests?.total || 0,
      passed_tests: testResults.unit_tests?.passed || 0,
      failed_tests: testResults.unit_tests?.failed || 0,
      success_rate: testResults.unit_tests ? 
        ((testResults.unit_tests.passed / testResults.unit_tests.total) * 100).toFixed(1) : 0,
      coverage_average: testResults.coverage ? 
        ((testResults.coverage.lines + testResults.coverage.functions + 
          testResults.coverage.branches + testResults.coverage.statements) / 4).toFixed(1) : 0,
      build_time: testResults.performance?.build?.build_time || 0
    },
    generated_at: new Date().toISOString()
  };
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  const format = args[0] || 'all';
  
  log.info('开始生成测试报告...');
  
  // 创建输出目录
  const outputDir = 'reports';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 收集数据
  const projectInfo = getProjectInfo();
  const testResults = collectTestResults();
  
  log.info(`项目: ${projectInfo.name} v${projectInfo.version}`);
  log.info(`分支: ${projectInfo.git.branch} (${projectInfo.git.commit})`);
  
  // 生成报告
  let generated = 0;
  
  if (format === 'all' || format === 'markdown') {
    const markdownReport = generateMarkdownReport(projectInfo, testResults);
    if (writeFile(path.join(outputDir, 'test-report.md'), markdownReport)) {
      log.success('Markdown报告生成成功: reports/test-report.md');
      generated++;
    }
  }
  
  if (format === 'all' || format === 'html') {
    const htmlReport = generateHtmlReport(projectInfo, testResults);
    if (writeFile(path.join(outputDir, 'test-report.html'), htmlReport)) {
      log.success('HTML报告生成成功: reports/test-report.html');
      generated++;
    }
  }
  
  if (format === 'all' || format === 'json') {
    const jsonReport = generateJsonReport(projectInfo, testResults);
    if (writeFile(path.join(outputDir, 'test-report.json'), JSON.stringify(jsonReport, null, 2))) {
      log.success('JSON报告生成成功: reports/test-report.json');
      generated++;
    }
  }
  
  if (generated === 0) {
    log.error('未生成任何报告');
    process.exit(1);
  }
  
  // 输出摘要
  console.log('\n📊 报告摘要:');
  if (testResults.unit_tests) {
    console.log(`  测试: ${testResults.unit_tests.passed}/${testResults.unit_tests.total} 通过`);
  }
  if (testResults.coverage) {
    const avgCoverage = (testResults.coverage.lines + testResults.coverage.functions + 
                        testResults.coverage.branches + testResults.coverage.statements) / 4;
    console.log(`  覆盖率: ${avgCoverage.toFixed(1)}%`);
  }
  if (testResults.performance?.build) {
    console.log(`  构建时间: ${testResults.performance.build.build_time}秒`);
  }
  
  log.success(`报告生成完成! 共生成 ${generated} 个文件`);
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  generateMarkdownReport,
  generateHtmlReport,
  generateJsonReport,
  collectTestResults,
  getProjectInfo
};