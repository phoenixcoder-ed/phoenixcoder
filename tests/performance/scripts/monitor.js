#!/usr/bin/env node

/**
 * PhoenixCoder 性能监控脚本
 * 用于实时监控系统性能指标
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const moment = require('moment');
const axios = require('axios');
const os = require('os');
const { spawn } = require('child_process');
const EventEmitter = require('events');
const yargs = require('yargs');

class PerformanceMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      interval: options.interval || 30000, // 30秒
      baseUrl: options.baseUrl || 'http://localhost:3000',
      apiUrl: options.apiUrl || 'http://localhost:8000',
      alertThresholds: {
        responseTime: 1000, // 1秒
        errorRate: 5, // 5%
        cpuUsage: 80, // 80%
        memoryUsage: 85, // 85%
        diskUsage: 90 // 90%
      },
      ...options
    };
    
    this.isRunning = false;
    this.metrics = {
      timestamp: null,
      api: {},
      frontend: {},
      system: {},
      alerts: []
    };
    
    this.alertHistory = [];
    this.metricsHistory = [];
    this.maxHistorySize = 100;
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.on('alert', (alert) => {
      this.handleAlert(alert);
    });
    
    this.on('metric', (metric) => {
      this.handleMetric(metric);
    });
    
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n📊 停止性能监控...'));
      this.stop();
      process.exit(0);
    });
  }

  async start() {
    if (this.isRunning) {
      console.log(chalk.yellow('⚠️ 监控已在运行中'));
      return;
    }
    
    console.log(chalk.cyan('🚀 启动性能监控...'));
    console.log(chalk.blue(`📊 监控间隔: ${this.options.interval / 1000}秒`));
    console.log(chalk.blue(`🌐 前端地址: ${this.options.baseUrl}`));
    console.log(chalk.blue(`🔗 API地址: ${this.options.apiUrl}`));
    console.log(chalk.gray('按 Ctrl+C 停止监控\n'));
    
    this.isRunning = true;
    this.monitorLoop();
  }

  stop() {
    this.isRunning = false;
    console.log(chalk.green('✅ 性能监控已停止'));
    
    // 生成监控报告
    this.generateSummaryReport();
  }

  async monitorLoop() {
    while (this.isRunning) {
      try {
        await this.collectMetrics();
        await this.analyzeMetrics();
        await this.displayMetrics();
        
        // 保存历史数据
        this.saveMetricsHistory();
        
        // 等待下一次监控
        await this.sleep(this.options.interval);
      } catch (error) {
        console.error(chalk.red('❌ 监控过程中发生错误:'), error.message);
        await this.sleep(5000); // 错误后等待5秒
      }
    }
  }

  async collectMetrics() {
    this.metrics.timestamp = moment().toISOString();
    this.metrics.alerts = [];
    
    // 并行收集各种指标
    await Promise.all([
      this.collectApiMetrics(),
      this.collectFrontendMetrics(),
      this.collectSystemMetrics()
    ]);
  }

  async collectApiMetrics() {
    const apiMetrics = {
      status: 'unknown',
      responseTime: null,
      errorRate: null,
      endpoints: {}
    };
    
    // 测试关键API端点
    const endpoints = [
      { name: 'health', path: '/health' },
      { name: 'auth', path: '/api/auth/me' },
      { name: 'tasks', path: '/api/tasks' },
      { name: 'users', path: '/api/users/profile' }
    ];
    
    let totalRequests = 0;
    let totalErrors = 0;
    let totalResponseTime = 0;
    
    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const response = await axios.get(`${this.options.apiUrl}${endpoint.path}`, {
          timeout: 5000,
          validateStatus: () => true // 不抛出错误
        });
        const responseTime = Date.now() - startTime;
        
        const isError = response.status >= 400;
        
        apiMetrics.endpoints[endpoint.name] = {
          status: response.status,
          responseTime,
          isError
        };
        
        totalRequests++;
        totalResponseTime += responseTime;
        
        if (isError) {
          totalErrors++;
        }
        
        // 检查响应时间告警
        if (responseTime > this.options.alertThresholds.responseTime) {
          this.emit('alert', {
            type: 'api_response_time',
            severity: 'warning',
            message: `API ${endpoint.name} 响应时间过长: ${responseTime}ms`,
            value: responseTime,
            threshold: this.options.alertThresholds.responseTime
          });
        }
        
      } catch (error) {
        apiMetrics.endpoints[endpoint.name] = {
          status: 'error',
          responseTime: null,
          isError: true,
          error: error.message
        };
        
        totalRequests++;
        totalErrors++;
        
        this.emit('alert', {
          type: 'api_error',
          severity: 'error',
          message: `API ${endpoint.name} 请求失败: ${error.message}`,
          endpoint: endpoint.name
        });
      }
    }
    
    // 计算总体指标
    if (totalRequests > 0) {
      apiMetrics.responseTime = Math.round(totalResponseTime / totalRequests);
      apiMetrics.errorRate = (totalErrors / totalRequests) * 100;
      apiMetrics.status = totalErrors === 0 ? 'healthy' : 
                         apiMetrics.errorRate > 50 ? 'critical' : 'degraded';
    }
    
    // 检查错误率告警
    if (apiMetrics.errorRate > this.options.alertThresholds.errorRate) {
      this.emit('alert', {
        type: 'api_error_rate',
        severity: 'error',
        message: `API 错误率过高: ${apiMetrics.errorRate.toFixed(2)}%`,
        value: apiMetrics.errorRate,
        threshold: this.options.alertThresholds.errorRate
      });
    }
    
    this.metrics.api = apiMetrics;
  }

  async collectFrontendMetrics() {
    const frontendMetrics = {
      status: 'unknown',
      responseTime: null,
      loadTime: null,
      pages: {}
    };
    
    // 测试关键页面
    const pages = [
      { name: 'home', path: '/' },
      { name: 'login', path: '/login' },
      { name: 'tasks', path: '/tasks' },
      { name: 'profile', path: '/profile' }
    ];
    
    let totalResponseTime = 0;
    let successCount = 0;
    
    for (const page of pages) {
      try {
        const startTime = Date.now();
        const response = await axios.get(`${this.options.baseUrl}${page.path}`, {
          timeout: 10000,
          validateStatus: () => true
        });
        const responseTime = Date.now() - startTime;
        
        frontendMetrics.pages[page.name] = {
          status: response.status,
          responseTime,
          isError: response.status >= 400
        };
        
        if (response.status < 400) {
          totalResponseTime += responseTime;
          successCount++;
        }
        
      } catch (error) {
        frontendMetrics.pages[page.name] = {
          status: 'error',
          responseTime: null,
          isError: true,
          error: error.message
        };
        
        this.emit('alert', {
          type: 'frontend_error',
          severity: 'warning',
          message: `前端页面 ${page.name} 访问失败: ${error.message}`,
          page: page.name
        });
      }
    }
    
    // 计算总体指标
    if (successCount > 0) {
      frontendMetrics.responseTime = Math.round(totalResponseTime / successCount);
      frontendMetrics.status = successCount === pages.length ? 'healthy' : 'degraded';
    } else {
      frontendMetrics.status = 'critical';
    }
    
    this.metrics.frontend = frontendMetrics;
  }

  async collectSystemMetrics() {
    const systemMetrics = {
      cpu: {
        usage: null,
        loadAverage: os.loadavg()
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        usage: null,
        usagePercent: null
      },
      disk: {
        usage: null,
        usagePercent: null
      },
      network: {
        interfaces: os.networkInterfaces()
      }
    };
    
    // CPU 使用率 (简化计算)
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    systemMetrics.cpu.usage = Math.round(100 - (totalIdle / totalTick) * 100);
    
    // 内存使用率
    const usedMemory = systemMetrics.memory.total - systemMetrics.memory.free;
    systemMetrics.memory.usage = usedMemory;
    systemMetrics.memory.usagePercent = Math.round((usedMemory / systemMetrics.memory.total) * 100);
    
    // 磁盘使用率 (需要外部命令)
    try {
      const diskUsage = await this.getDiskUsage();
      systemMetrics.disk = diskUsage;
    } catch (error) {
      console.warn(chalk.yellow('⚠️ 无法获取磁盘使用率'));
    }
    
    // 检查系统资源告警
    if (systemMetrics.cpu.usage > this.options.alertThresholds.cpuUsage) {
      this.emit('alert', {
        type: 'system_cpu',
        severity: 'warning',
        message: `CPU 使用率过高: ${systemMetrics.cpu.usage}%`,
        value: systemMetrics.cpu.usage,
        threshold: this.options.alertThresholds.cpuUsage
      });
    }
    
    if (systemMetrics.memory.usagePercent > this.options.alertThresholds.memoryUsage) {
      this.emit('alert', {
        type: 'system_memory',
        severity: 'warning',
        message: `内存使用率过高: ${systemMetrics.memory.usagePercent}%`,
        value: systemMetrics.memory.usagePercent,
        threshold: this.options.alertThresholds.memoryUsage
      });
    }
    
    if (systemMetrics.disk.usagePercent > this.options.alertThresholds.diskUsage) {
      this.emit('alert', {
        type: 'system_disk',
        severity: 'error',
        message: `磁盘使用率过高: ${systemMetrics.disk.usagePercent}%`,
        value: systemMetrics.disk.usagePercent,
        threshold: this.options.alertThresholds.diskUsage
      });
    }
    
    this.metrics.system = systemMetrics;
  }

  async getDiskUsage() {
    return new Promise((resolve, reject) => {
      const command = process.platform === 'win32' ? 'wmic' : 'df';
      const args = process.platform === 'win32' ? 
        ['logicaldisk', 'get', 'size,freespace,caption'] : 
        ['-h', '/'];
      
      const child = spawn(command, args);
      let output = '';
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`命令执行失败: ${code}`));
          return;
        }
        
        try {
          let usage = { usage: 0, usagePercent: 0 };
          
          if (process.platform === 'win32') {
            // Windows 解析逻辑
            const lines = output.split('\n').filter(line => line.trim());
            if (lines.length > 1) {
              const data = lines[1].trim().split(/\s+/);
              if (data.length >= 2) {
                const free = parseInt(data[0]);
                const total = parseInt(data[1]);
                const used = total - free;
                usage = {
                  usage: used,
                  usagePercent: Math.round((used / total) * 100)
                };
              }
            }
          } else {
            // Unix/Linux 解析逻辑
            const lines = output.split('\n');
            if (lines.length > 1) {
              const data = lines[1].trim().split(/\s+/);
              if (data.length >= 5) {
                const usagePercent = parseInt(data[4].replace('%', ''));
                usage = {
                  usage: data[2],
                  usagePercent
                };
              }
            }
          }
          
          resolve(usage);
        } catch (error) {
          reject(error);
        }
      });
      
      child.on('error', reject);
    });
  }

  async analyzeMetrics() {
    // 分析指标趋势
    if (this.metricsHistory.length >= 3) {
      const recent = this.metricsHistory.slice(-3);
      
      // 分析API响应时间趋势
      const apiTimes = recent.map(m => m.api.responseTime).filter(t => t !== null);
      if (apiTimes.length === 3) {
        const isIncreasing = apiTimes[2] > apiTimes[1] && apiTimes[1] > apiTimes[0];
        const increaseRate = ((apiTimes[2] - apiTimes[0]) / apiTimes[0]) * 100;
        
        if (isIncreasing && increaseRate > 20) {
          this.emit('alert', {
            type: 'trend_api_response',
            severity: 'warning',
            message: `API响应时间呈上升趋势: ${increaseRate.toFixed(1)}%`,
            trend: 'increasing'
          });
        }
      }
      
      // 分析系统资源趋势
      const cpuUsages = recent.map(m => m.system.cpu.usage).filter(u => u !== null);
      if (cpuUsages.length === 3) {
        const avgCpu = cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length;
        if (avgCpu > this.options.alertThresholds.cpuUsage * 0.8) {
          this.emit('alert', {
            type: 'trend_system_cpu',
            severity: 'info',
            message: `CPU使用率持续偏高: 平均 ${avgCpu.toFixed(1)}%`,
            trend: 'high'
          });
        }
      }
    }
  }

  async displayMetrics() {
    // 清屏
    console.clear();
    
    // 显示标题
    console.log(chalk.cyan('🚀 PhoenixCoder 性能监控面板'));
    console.log(chalk.gray(`更新时间: ${moment().format('YYYY-MM-DD HH:mm:ss')}`));
    console.log(chalk.gray('='.repeat(80)));
    
    // API 状态
    console.log(chalk.blue('\n🔗 API 服务状态:'));
    const apiStatus = this.getStatusIcon(this.metrics.api.status);
    console.log(`  状态: ${apiStatus} ${this.metrics.api.status}`);
    
    if (this.metrics.api.responseTime !== null) {
      const responseColor = this.metrics.api.responseTime > 500 ? chalk.red : 
                           this.metrics.api.responseTime > 200 ? chalk.yellow : chalk.green;
      console.log(`  平均响应时间: ${responseColor(this.metrics.api.responseTime + 'ms')}`);
    }
    
    if (this.metrics.api.errorRate !== null) {
      const errorColor = this.metrics.api.errorRate > 5 ? chalk.red : 
                         this.metrics.api.errorRate > 1 ? chalk.yellow : chalk.green;
      console.log(`  错误率: ${errorColor(this.metrics.api.errorRate.toFixed(2) + '%')}`);
    }
    
    // API 端点详情
    console.log('  端点状态:');
    for (const [name, endpoint] of Object.entries(this.metrics.api.endpoints)) {
      const statusIcon = endpoint.isError ? chalk.red('✗') : chalk.green('✓');
      const responseTime = endpoint.responseTime ? `${endpoint.responseTime}ms` : 'N/A';
      console.log(`    ${statusIcon} ${name}: ${endpoint.status} (${responseTime})`);
    }
    
    // 前端状态
    console.log(chalk.blue('\n🌐 前端服务状态:'));
    const frontendStatus = this.getStatusIcon(this.metrics.frontend.status);
    console.log(`  状态: ${frontendStatus} ${this.metrics.frontend.status}`);
    
    if (this.metrics.frontend.responseTime !== null) {
      const responseColor = this.metrics.frontend.responseTime > 1000 ? chalk.red : 
                           this.metrics.frontend.responseTime > 500 ? chalk.yellow : chalk.green;
      console.log(`  平均响应时间: ${responseColor(this.metrics.frontend.responseTime + 'ms')}`);
    }
    
    // 系统资源
    console.log(chalk.blue('\n💻 系统资源:'));
    
    if (this.metrics.system.cpu.usage !== null) {
      const cpuColor = this.metrics.system.cpu.usage > 80 ? chalk.red : 
                      this.metrics.system.cpu.usage > 60 ? chalk.yellow : chalk.green;
      console.log(`  CPU 使用率: ${cpuColor(this.metrics.system.cpu.usage + '%')}`);
    }
    
    if (this.metrics.system.memory.usagePercent !== null) {
      const memColor = this.metrics.system.memory.usagePercent > 85 ? chalk.red : 
                      this.metrics.system.memory.usagePercent > 70 ? chalk.yellow : chalk.green;
      console.log(`  内存使用率: ${memColor(this.metrics.system.memory.usagePercent + '%')}`);
      console.log(`  内存使用量: ${this.formatBytes(this.metrics.system.memory.usage)} / ${this.formatBytes(this.metrics.system.memory.total)}`);
    }
    
    if (this.metrics.system.disk.usagePercent !== null) {
      const diskColor = this.metrics.system.disk.usagePercent > 90 ? chalk.red : 
                       this.metrics.system.disk.usagePercent > 80 ? chalk.yellow : chalk.green;
      console.log(`  磁盘使用率: ${diskColor(this.metrics.system.disk.usagePercent + '%')}`);
    }
    
    // 告警信息
    if (this.metrics.alerts.length > 0) {
      console.log(chalk.red('\n⚠️  当前告警:'));
      this.metrics.alerts.forEach(alert => {
        const severityIcon = alert.severity === 'error' ? chalk.red('🔴') : 
                             alert.severity === 'warning' ? chalk.yellow('🟡') : chalk.blue('🔵');
        console.log(`  ${severityIcon} ${alert.message}`);
      });
    }
    
    // 历史趋势简要信息
    if (this.metricsHistory.length > 1) {
      console.log(chalk.blue('\n📈 趋势信息:'));
      const prev = this.metricsHistory[this.metricsHistory.length - 2];
      const curr = this.metrics;
      
      if (prev.api.responseTime && curr.api.responseTime) {
        const change = curr.api.responseTime - prev.api.responseTime;
        const changeIcon = change > 0 ? chalk.red('↗') : change < 0 ? chalk.green('↘') : chalk.gray('→');
        console.log(`  API响应时间: ${changeIcon} ${change > 0 ? '+' : ''}${change}ms`);
      }
      
      if (prev.system.cpu.usage && curr.system.cpu.usage) {
        const change = curr.system.cpu.usage - prev.system.cpu.usage;
        const changeIcon = change > 0 ? chalk.red('↗') : change < 0 ? chalk.green('↘') : chalk.gray('→');
        console.log(`  CPU使用率: ${changeIcon} ${change > 0 ? '+' : ''}${change}%`);
      }
    }
    
    console.log(chalk.gray('\n='.repeat(80)));
    console.log(chalk.gray(`下次更新: ${moment().add(this.options.interval, 'ms').format('HH:mm:ss')}`));
  }

  getStatusIcon(status) {
    switch (status) {
      case 'healthy': return chalk.green('🟢');
      case 'degraded': return chalk.yellow('🟡');
      case 'critical': return chalk.red('🔴');
      default: return chalk.gray('⚪');
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  handleAlert(alert) {
    // 添加到当前指标
    this.metrics.alerts.push(alert);
    
    // 添加到历史记录
    this.alertHistory.push({
      ...alert,
      timestamp: moment().toISOString()
    });
    
    // 限制历史记录大小
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory = this.alertHistory.slice(-this.maxHistorySize);
    }
    
    // 可以在这里添加通知逻辑 (邮件、Slack等)
    if (this.options.notifications) {
      this.sendNotification(alert);
    }
  }

  handleMetric(metric) {
    // 可以在这里添加自定义指标处理逻辑
  }

  saveMetricsHistory() {
    this.metricsHistory.push(JSON.parse(JSON.stringify(this.metrics)));
    
    // 限制历史记录大小
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize);
    }
  }

  async sendNotification(alert) {
    // 这里可以实现各种通知方式
    // 例如: Slack, 邮件, 钉钉等
    console.log(chalk.red(`🚨 告警通知: ${alert.message}`));
  }

  generateSummaryReport() {
    if (this.metricsHistory.length === 0) {
      console.log(chalk.yellow('📊 没有监控数据可生成报告'));
      return;
    }
    
    console.log(chalk.cyan('\n📊 监控会话总结报告'));
    console.log(chalk.white('='.repeat(50)));
    
    // 监控时长
    const startTime = moment(this.metricsHistory[0].timestamp);
    const endTime = moment(this.metricsHistory[this.metricsHistory.length - 1].timestamp);
    const duration = moment.duration(endTime.diff(startTime));
    
    console.log(chalk.blue('\n⏱️  监控时长:'));
    console.log(`  开始时间: ${startTime.format('YYYY-MM-DD HH:mm:ss')}`);
    console.log(`  结束时间: ${endTime.format('YYYY-MM-DD HH:mm:ss')}`);
    console.log(`  总时长: ${Math.floor(duration.asMinutes())}分钟`);
    
    // 告警统计
    console.log(chalk.blue('\n🚨 告警统计:'));
    const alertCounts = this.alertHistory.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {});
    
    console.log(`  总告警数: ${this.alertHistory.length}`);
    Object.entries(alertCounts).forEach(([severity, count]) => {
      const color = severity === 'error' ? chalk.red : 
                   severity === 'warning' ? chalk.yellow : chalk.blue;
      console.log(`  ${color(severity)}: ${count}`);
    });
    
    // 性能统计
    const apiResponseTimes = this.metricsHistory
      .map(m => m.api.responseTime)
      .filter(t => t !== null);
    
    if (apiResponseTimes.length > 0) {
      const avgResponseTime = apiResponseTimes.reduce((a, b) => a + b, 0) / apiResponseTimes.length;
      const maxResponseTime = Math.max(...apiResponseTimes);
      const minResponseTime = Math.min(...apiResponseTimes);
      
      console.log(chalk.blue('\n⚡ API性能统计:'));
      console.log(`  平均响应时间: ${Math.round(avgResponseTime)}ms`);
      console.log(`  最大响应时间: ${maxResponseTime}ms`);
      console.log(`  最小响应时间: ${minResponseTime}ms`);
    }
    
    // 系统资源统计
    const cpuUsages = this.metricsHistory
      .map(m => m.system.cpu.usage)
      .filter(u => u !== null);
    
    if (cpuUsages.length > 0) {
      const avgCpu = cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length;
      const maxCpu = Math.max(...cpuUsages);
      
      console.log(chalk.blue('\n💻 系统资源统计:'));
      console.log(`  平均CPU使用率: ${Math.round(avgCpu)}%`);
      console.log(`  最大CPU使用率: ${maxCpu}%`);
    }
    
    console.log(chalk.white('='.repeat(50)));
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 命令行参数处理
if (require.main === module) {
  const argv = yargs
    .option('interval', {
      alias: 'i',
      type: 'number',
      default: 30,
      description: '监控间隔 (秒)'
    })
    .option('base-url', {
      type: 'string',
      default: 'http://localhost:3000',
      description: '前端服务地址'
    })
    .option('api-url', {
      type: 'string',
      default: 'http://localhost:8000',
      description: 'API服务地址'
    })
    .option('cpu-threshold', {
      type: 'number',
      default: 80,
      description: 'CPU使用率告警阈值 (%)'
    })
    .option('memory-threshold', {
      type: 'number',
      default: 85,
      description: '内存使用率告警阈值 (%)'
    })
    .option('response-threshold', {
      type: 'number',
      default: 1000,
      description: '响应时间告警阈值 (ms)'
    })
    .option('error-threshold', {
      type: 'number',
      default: 5,
      description: '错误率告警阈值 (%)'
    })
    .option('notifications', {
      type: 'boolean',
      default: false,
      description: '启用通知'
    })
    .help()
    .argv;
  
  const monitor = new PerformanceMonitor({
    interval: argv.interval * 1000,
    baseUrl: argv.baseUrl,
    apiUrl: argv.apiUrl,
    notifications: argv.notifications,
    alertThresholds: {
      responseTime: argv.responseThreshold,
      errorRate: argv.errorThreshold,
      cpuUsage: argv.cpuThreshold,
      memoryUsage: argv.memoryThreshold,
      diskUsage: 90
    }
  });
  
  monitor.start().catch(error => {
    console.error(chalk.red('❌ 启动监控失败:'), error.message);
    process.exit(1);
  });
}

module.exports = PerformanceMonitor;