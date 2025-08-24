#!/usr/bin/env node

/**
 * 基准测试更新脚本
 * 用于运行和更新性能基准测试
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { performance } = require('perf_hooks');

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
  benchmark: (msg) => console.log(`${colors.magenta}[BENCHMARK]${colors.reset} ${msg}`)
};

/**
 * 基准测试配置
 */
const BENCHMARK_CONFIG = {
  // 前端构建基准测试
  build: {
    name: 'Frontend Build Performance',
    command: 'npm run build',
    timeout: 300000, // 5分钟
    metrics: ['build_time', 'bundle_size', 'chunk_count']
  },
  
  // API响应时间基准测试
  api: {
    name: 'API Response Time',
    endpoints: [
      { path: '/api/health', method: 'GET' },
      { path: '/api/users', method: 'GET' },
      { path: '/api/projects', method: 'GET' },
      { path: '/api/tasks', method: 'GET' }
    ],
    iterations: 100,
    timeout: 30000
  },
  
  // 数据库查询基准测试
  database: {
    name: 'Database Query Performance',
    queries: [
      { name: 'simple_select', sql: 'SELECT COUNT(*) FROM users' },
      { name: 'join_query', sql: 'SELECT u.*, p.name FROM users u LEFT JOIN projects p ON u.id = p.user_id LIMIT 100' },
      { name: 'complex_aggregation', sql: 'SELECT COUNT(*), AVG(created_at) FROM tasks GROUP BY status' }
    ],
    iterations: 50
  },
  
  // 内存使用基准测试
  memory: {
    name: 'Memory Usage',
    scenarios: ['idle', 'load_test', 'stress_test'],
    duration: 60000 // 1分钟
  }
};

/**
 * 工具函数
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeJsonFile(filePath, data) {
  try {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    log.error(`写入文件失败: ${filePath} - ${error.message}`);
    return false;
  }
}

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

function formatDuration(ms) {
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}min`;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * 获取系统信息
 */
function getSystemInfo() {
  try {
    const os = require('os');
    return {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      memory: os.totalmem(),
      node_version: process.version,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    log.warning('获取系统信息失败');
    return {
      platform: 'unknown',
      arch: 'unknown',
      cpus: 1,
      memory: 0,
      node_version: process.version,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 前端构建基准测试
 */
async function runBuildBenchmark() {
  log.benchmark('开始前端构建基准测试...');
  
  const startTime = performance.now();
  const startMemory = process.memoryUsage();
  
  try {
    // 清理之前的构建
    if (fs.existsSync('dist')) {
      execSync('rm -rf dist', { stdio: 'pipe' });
    }
    
    // 运行构建
    const buildOutput = execSync(BENCHMARK_CONFIG.build.command, {
      encoding: 'utf8',
      timeout: BENCHMARK_CONFIG.build.timeout
    });
    
    const endTime = performance.now();
    const endMemory = process.memoryUsage();
    const buildTime = endTime - startTime;
    
    // 分析构建结果
    const distStats = analyzeBuildOutput();
    
    const result = {
      name: BENCHMARK_CONFIG.build.name,
      build_time: buildTime / 1000, // 转换为秒
      bundle_size: distStats.totalSize,
      chunk_count: distStats.chunkCount,
      memory_used: endMemory.heapUsed - startMemory.heapUsed,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    log.success(`构建完成: ${formatDuration(buildTime)}, 包大小: ${formatBytes(distStats.totalSize)}`);
    return result;
    
  } catch (error) {
    const endTime = performance.now();
    const buildTime = endTime - startTime;
    
    log.error(`构建失败: ${error.message}`);
    return {
      name: BENCHMARK_CONFIG.build.name,
      build_time: buildTime / 1000,
      error: error.message,
      timestamp: new Date().toISOString(),
      success: false
    };
  }
}

/**
 * 分析构建输出
 */
function analyzeBuildOutput() {
  const distPath = 'dist';
  let totalSize = 0;
  let chunkCount = 0;
  
  if (!fs.existsSync(distPath)) {
    return { totalSize: 0, chunkCount: 0 };
  }
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else {
        totalSize += stat.size;
        if (file.endsWith('.js') || file.endsWith('.css')) {
          chunkCount++;
        }
      }
    });
  }
  
  walkDir(distPath);
  
  return { totalSize, chunkCount };
}

/**
 * API基准测试
 */
async function runApiBenchmark() {
  log.benchmark('开始API基准测试...');
  
  const results = [];
  
  for (const endpoint of BENCHMARK_CONFIG.api.endpoints) {
    log.info(`测试端点: ${endpoint.method} ${endpoint.path}`);
    
    const times = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < BENCHMARK_CONFIG.api.iterations; i++) {
      try {
        const startTime = performance.now();
        
        // 模拟API调用（实际项目中应该使用真实的HTTP请求）
        await simulateApiCall(endpoint);
        
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        times.push(responseTime);
        successCount++;
        
      } catch (error) {
        errorCount++;
      }
    }
    
    if (times.length > 0) {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      const p95Time = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];
      
      results.push({
        endpoint: `${endpoint.method} ${endpoint.path}`,
        iterations: BENCHMARK_CONFIG.api.iterations,
        success_count: successCount,
        error_count: errorCount,
        avg_response_time: avgTime,
        min_response_time: minTime,
        max_response_time: maxTime,
        p95_response_time: p95Time,
        success_rate: (successCount / BENCHMARK_CONFIG.api.iterations) * 100
      });
      
      log.success(`${endpoint.path}: 平均 ${formatDuration(avgTime)}, P95 ${formatDuration(p95Time)}`);
    }
  }
  
  return {
    name: BENCHMARK_CONFIG.api.name,
    endpoints: results,
    timestamp: new Date().toISOString()
  };
}

/**
 * 模拟API调用
 */
async function simulateApiCall(endpoint) {
  // 模拟网络延迟和处理时间
  const baseDelay = Math.random() * 50 + 10; // 10-60ms
  const processingDelay = Math.random() * 100 + 20; // 20-120ms
  
  await new Promise(resolve => setTimeout(resolve, baseDelay + processingDelay));
  
  // 模拟偶尔的错误
  if (Math.random() < 0.02) { // 2%错误率
    throw new Error('Simulated API error');
  }
  
  return { status: 200, data: { message: 'success' } };
}

/**
 * 数据库基准测试
 */
async function runDatabaseBenchmark() {
  log.benchmark('开始数据库基准测试...');
  
  const results = [];
  
  for (const query of BENCHMARK_CONFIG.database.queries) {
    log.info(`测试查询: ${query.name}`);
    
    const times = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < BENCHMARK_CONFIG.database.iterations; i++) {
      try {
        const startTime = performance.now();
        
        // 模拟数据库查询（实际项目中应该使用真实的数据库连接）
        await simulateDatabaseQuery(query);
        
        const endTime = performance.now();
        const queryTime = endTime - startTime;
        
        times.push(queryTime);
        successCount++;
        
      } catch (error) {
        errorCount++;
      }
    }
    
    if (times.length > 0) {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      results.push({
        query_name: query.name,
        sql: query.sql,
        iterations: BENCHMARK_CONFIG.database.iterations,
        success_count: successCount,
        error_count: errorCount,
        avg_query_time: avgTime,
        min_query_time: minTime,
        max_query_time: maxTime,
        success_rate: (successCount / BENCHMARK_CONFIG.database.iterations) * 100
      });
      
      log.success(`${query.name}: 平均 ${formatDuration(avgTime)}`);
    }
  }
  
  return {
    name: BENCHMARK_CONFIG.database.name,
    queries: results,
    timestamp: new Date().toISOString()
  };
}

/**
 * 模拟数据库查询
 */
async function simulateDatabaseQuery(query) {
  // 根据查询类型模拟不同的执行时间
  let baseDelay = 5;
  
  if (query.name.includes('join')) {
    baseDelay = 15;
  } else if (query.name.includes('aggregation')) {
    baseDelay = 25;
  }
  
  const delay = baseDelay + Math.random() * 10;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // 模拟偶尔的查询错误
  if (Math.random() < 0.01) { // 1%错误率
    throw new Error('Simulated database error');
  }
  
  return { rows: Math.floor(Math.random() * 1000) };
}

/**
 * 内存使用基准测试
 */
async function runMemoryBenchmark() {
  log.benchmark('开始内存使用基准测试...');
  
  const results = [];
  
  for (const scenario of BENCHMARK_CONFIG.memory.scenarios) {
    log.info(`测试场景: ${scenario}`);
    
    const memorySnapshots = [];
    const startTime = performance.now();
    
    // 记录初始内存
    memorySnapshots.push({
      timestamp: 0,
      memory: process.memoryUsage()
    });
    
    // 模拟不同的内存使用场景
    const interval = setInterval(() => {
      const currentTime = performance.now() - startTime;
      if (currentTime >= BENCHMARK_CONFIG.memory.duration) {
        clearInterval(interval);
        return;
      }
      
      memorySnapshots.push({
        timestamp: currentTime,
        memory: process.memoryUsage()
      });
      
      // 模拟内存使用
      simulateMemoryUsage(scenario);
    }, 1000);
    
    // 等待测试完成
    await new Promise(resolve => {
      setTimeout(resolve, BENCHMARK_CONFIG.memory.duration + 1000);
    });
    
    // 分析内存使用
    const heapUsed = memorySnapshots.map(s => s.memory.heapUsed);
    const maxHeap = Math.max(...heapUsed);
    const minHeap = Math.min(...heapUsed);
    const avgHeap = heapUsed.reduce((a, b) => a + b, 0) / heapUsed.length;
    
    results.push({
      scenario,
      duration: BENCHMARK_CONFIG.memory.duration,
      max_heap_used: maxHeap,
      min_heap_used: minHeap,
      avg_heap_used: avgHeap,
      memory_growth: maxHeap - minHeap,
      snapshots: memorySnapshots.length
    });
    
    log.success(`${scenario}: 最大堆内存 ${formatBytes(maxHeap)}`);
  }
  
  return {
    name: BENCHMARK_CONFIG.memory.name,
    scenarios: results,
    timestamp: new Date().toISOString()
  };
}

/**
 * 模拟内存使用
 */
function simulateMemoryUsage(scenario) {
  switch (scenario) {
    case 'idle':
      // 空闲状态，不做任何操作
      break;
      
    case 'load_test':
      // 模拟正常负载
      const normalData = new Array(1000).fill(0).map(() => ({
        id: Math.random(),
        data: 'test data'.repeat(10)
      }));
      // 立即释放
      normalData.length = 0;
      break;
      
    case 'stress_test':
      // 模拟高负载
      const stressData = new Array(5000).fill(0).map(() => ({
        id: Math.random(),
        data: 'stress test data'.repeat(50)
      }));
      // 立即释放
      stressData.length = 0;
      break;
  }
}

/**
 * 比较基准测试结果
 */
function compareBenchmarks(current, previous) {
  if (!previous) {
    return { comparison: 'no_previous_data' };
  }
  
  const comparison = {
    build: null,
    api: null,
    database: null,
    memory: null
  };
  
  // 比较构建性能
  if (current.build && previous.build) {
    const buildTimeDiff = ((current.build.build_time - previous.build.build_time) / previous.build.build_time) * 100;
    const bundleSizeDiff = ((current.build.bundle_size - previous.build.bundle_size) / previous.build.bundle_size) * 100;
    
    comparison.build = {
      build_time_change: buildTimeDiff,
      bundle_size_change: bundleSizeDiff,
      improved: buildTimeDiff < -5 && bundleSizeDiff < 5 // 构建时间减少5%以上且包大小没有显著增加
    };
  }
  
  // 比较API性能
  if (current.api && previous.api) {
    const currentAvgTime = current.api.endpoints.reduce((sum, ep) => sum + ep.avg_response_time, 0) / current.api.endpoints.length;
    const previousAvgTime = previous.api.endpoints.reduce((sum, ep) => sum + ep.avg_response_time, 0) / previous.api.endpoints.length;
    const apiTimeDiff = ((currentAvgTime - previousAvgTime) / previousAvgTime) * 100;
    
    comparison.api = {
      avg_response_time_change: apiTimeDiff,
      improved: apiTimeDiff < -5 // 响应时间减少5%以上
    };
  }
  
  return comparison;
}

/**
 * 生成基准测试报告
 */
function generateBenchmarkReport(results, comparison) {
  const report = {
    summary: {
      timestamp: new Date().toISOString(),
      system_info: getSystemInfo(),
      total_tests: Object.keys(results).length,
      successful_tests: Object.values(results).filter(r => r.success !== false).length
    },
    results,
    comparison,
    recommendations: generatePerformanceRecommendations(results, comparison)
  };
  
  return report;
}

/**
 * 生成性能建议
 */
function generatePerformanceRecommendations(results, comparison) {
  const recommendations = [];
  
  // 构建性能建议
  if (results.build) {
    if (results.build.build_time > 120) {
      recommendations.push({
        type: 'build',
        severity: 'warning',
        message: '构建时间超过2分钟，建议优化构建配置或使用缓存'
      });
    }
    
    if (results.build.bundle_size > 5 * 1024 * 1024) { // 5MB
      recommendations.push({
        type: 'build',
        severity: 'warning',
        message: '包大小超过5MB，建议进行代码分割和优化'
      });
    }
  }
  
  // API性能建议
  if (results.api) {
    const slowEndpoints = results.api.endpoints.filter(ep => ep.avg_response_time > 1000);
    if (slowEndpoints.length > 0) {
      recommendations.push({
        type: 'api',
        severity: 'warning',
        message: `发现${slowEndpoints.length}个响应时间超过1秒的API端点，建议优化`
      });
    }
  }
  
  // 内存使用建议
  if (results.memory) {
    const highMemoryScenarios = results.memory.scenarios.filter(s => s.max_heap_used > 512 * 1024 * 1024); // 512MB
    if (highMemoryScenarios.length > 0) {
      recommendations.push({
        type: 'memory',
        severity: 'info',
        message: '检测到高内存使用场景，建议监控内存泄漏'
      });
    }
  }
  
  return recommendations;
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'all';
  
  log.info('开始基准测试...');
  
  // 创建输出目录
  const outputDir = 'test-results';
  ensureDir(outputDir);
  
  const results = {};
  
  try {
    // 运行指定的基准测试
    if (testType === 'all' || testType === 'build') {
      results.build = await runBuildBenchmark();
    }
    
    if (testType === 'all' || testType === 'api') {
      results.api = await runApiBenchmark();
    }
    
    if (testType === 'all' || testType === 'database') {
      results.database = await runDatabaseBenchmark();
    }
    
    if (testType === 'all' || testType === 'memory') {
      results.memory = await runMemoryBenchmark();
    }
    
    // 读取之前的基准测试结果进行比较
    const previousResults = readJsonFile(path.join(outputDir, 'benchmark-results.json'));
    const comparison = compareBenchmarks(results, previousResults?.results);
    
    // 生成报告
    const report = generateBenchmarkReport(results, comparison);
    
    // 保存结果
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = path.join(outputDir, 'benchmark-results.json');
    const historyFile = path.join(outputDir, `benchmark-${timestamp}.json`);
    
    writeJsonFile(resultsFile, report);
    writeJsonFile(historyFile, report);
    
    // 输出摘要
    console.log('\n📊 基准测试摘要:');
    
    if (results.build) {
      console.log(`  构建时间: ${formatDuration(results.build.build_time * 1000)}`);
      console.log(`  包大小: ${formatBytes(results.build.bundle_size)}`);
    }
    
    if (results.api) {
      const avgResponseTime = results.api.endpoints.reduce((sum, ep) => sum + ep.avg_response_time, 0) / results.api.endpoints.length;
      console.log(`  API平均响应时间: ${formatDuration(avgResponseTime)}`);
    }
    
    if (results.database) {
      const avgQueryTime = results.database.queries.reduce((sum, q) => sum + q.avg_query_time, 0) / results.database.queries.length;
      console.log(`  数据库平均查询时间: ${formatDuration(avgQueryTime)}`);
    }
    
    if (results.memory) {
      const maxHeap = Math.max(...results.memory.scenarios.map(s => s.max_heap_used));
      console.log(`  最大堆内存使用: ${formatBytes(maxHeap)}`);
    }
    
    // 输出建议
    if (report.recommendations.length > 0) {
      console.log('\n💡 性能建议:');
      report.recommendations.forEach(rec => {
        const icon = rec.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`  ${icon} ${rec.message}`);
      });
    }
    
    log.success(`基准测试完成! 结果已保存到 ${resultsFile}`);
    
  } catch (error) {
    log.error(`基准测试失败: ${error.message}`);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main().catch(error => {
    log.error(`未处理的错误: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runBuildBenchmark,
  runApiBenchmark,
  runDatabaseBenchmark,
  runMemoryBenchmark,
  generateBenchmarkReport
};