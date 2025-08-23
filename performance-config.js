/**
 * PhoenixCoder 项目性能基准测试配置
 * 支持后端、前端、小程序的性能监控和回归检测
 */

const fs = require('fs');
const path = require('path');

// 项目路径配置
const PROJECT_PATHS = {
  backend: '/Users/zhuwencan/work/phoenixcoder/apps/community/server',
  admin: '/Users/zhuwencan/work/phoenixcoder/apps/community/admin',
  miniapp: '/Users/zhuwencan/work/phoenixcoder/apps/community/miniapp',
  oidc: '/Users/zhuwencan/work/phoenixcoder/apps/community/oidc-server'
};

// 性能基准配置
const PERFORMANCE_CONFIG = {
  // 后端性能基准
  backend: {
    api: {
      responseTime: {
        p50: 100, // 50%请求响应时间 < 100ms
        p95: 500, // 95%请求响应时间 < 500ms
        p99: 1000 // 99%请求响应时间 < 1000ms
      },
      throughput: {
        rps: 1000, // 每秒请求数 > 1000
        concurrent: 100 // 并发用户数 > 100
      },
      memory: {
        maxUsage: 512, // 最大内存使用 < 512MB
        leakThreshold: 10 // 内存泄漏阈值 < 10MB/hour
      },
      cpu: {
        maxUsage: 80, // CPU使用率 < 80%
        avgUsage: 50 // 平均CPU使用率 < 50%
      }
    },
    database: {
      queryTime: {
        simple: 10, // 简单查询 < 10ms
        complex: 100, // 复杂查询 < 100ms
        aggregation: 500 // 聚合查询 < 500ms
      },
      connections: {
        max: 100, // 最大连接数
        poolSize: 20 // 连接池大小
      }
    }
  },
  
  // 前端性能基准
  frontend: {
    loading: {
      fcp: 1500, // First Contentful Paint < 1.5s
      lcp: 2500, // Largest Contentful Paint < 2.5s
      fid: 100, // First Input Delay < 100ms
      cls: 0.1, // Cumulative Layout Shift < 0.1
      ttfb: 600 // Time to First Byte < 600ms
    },
    bundle: {
      maxSize: 1024, // 最大包大小 < 1MB
      chunkSize: 256, // 单个chunk大小 < 256KB
      gzipRatio: 0.3 // Gzip压缩比 > 70%
    },
    runtime: {
      memoryUsage: 50, // 内存使用 < 50MB
      renderTime: 16, // 渲染时间 < 16ms (60fps)
      scriptExecution: 50 // 脚本执行时间 < 50ms
    }
  },
  
  // 小程序性能基准
  miniapp: {
    startup: {
      coldStart: 3000, // 冷启动时间 < 3s
      hotStart: 1000, // 热启动时间 < 1s
      pageLoad: 1500 // 页面加载时间 < 1.5s
    },
    package: {
      mainSize: 2048, // 主包大小 < 2MB
      subpackageSize: 2048, // 分包大小 < 2MB
      totalSize: 20480 // 总包大小 < 20MB
    },
    runtime: {
      memoryUsage: 100, // 内存使用 < 100MB
      setDataTime: 50, // setData耗时 < 50ms
      renderTime: 16 // 渲染时间 < 16ms
    }
  }
};

// 性能测试场景
const PERFORMANCE_SCENARIOS = {
  backend: {
    load: {
      name: '负载测试',
      users: 100,
      duration: '5m',
      rampUp: '1m'
    },
    stress: {
      name: '压力测试',
      users: 500,
      duration: '10m',
      rampUp: '2m'
    },
    spike: {
      name: '峰值测试',
      users: 1000,
      duration: '2m',
      rampUp: '30s'
    },
    endurance: {
      name: '持久性测试',
      users: 50,
      duration: '30m',
      rampUp: '5m'
    }
  },
  frontend: {
    lighthouse: {
      name: 'Lighthouse性能测试',
      device: 'desktop',
      throttling: 'none'
    },
    webVitals: {
      name: 'Web Vitals测试',
      iterations: 5,
      warmup: 2
    },
    bundle: {
      name: '包大小分析',
      analyzer: true,
      gzip: true
    }
  },
  miniapp: {
    startup: {
      name: '启动性能测试',
      iterations: 10,
      devices: ['iPhone', 'Android']
    },
    memory: {
      name: '内存使用测试',
      duration: '10m',
      monitoring: true
    },
    package: {
      name: '包大小分析',
      subpackages: true,
      assets: true
    }
  }
};

// 回归检测配置
const REGRESSION_CONFIG = {
  threshold: {
    performance: 10, // 性能回归阈值 10%
    memory: 15, // 内存回归阈值 15%
    size: 5 // 包大小回归阈值 5%
  },
  comparison: {
    baseline: 'main', // 基准分支
    current: 'HEAD', // 当前分支
    history: 30 // 历史数据保留天数
  },
  alerts: {
    email: process.env.ALERT_EMAIL || '',
    webhook: process.env.ALERT_WEBHOOK || '',
    slack: process.env.SLACK_WEBHOOK || ''
  }
};

// 报告配置
const REPORT_CONFIG = {
  output: {
    directory: 'performance-reports',
    formats: ['html', 'json', 'csv'],
    charts: true,
    trends: true
  },
  dashboard: {
    port: 3001,
    realtime: true,
    history: true
  },
  storage: {
    type: 'file', // file | database | s3
    path: 'performance-data',
    retention: 90 // 数据保留天数
  }
};

// 工具函数
class PerformanceConfig {
  static getProjectPath(project) {
    return PROJECT_PATHS[project];
  }
  
  static getBenchmark(project, category) {
    return PERFORMANCE_CONFIG[project]?.[category];
  }
  
  static getScenario(project, scenario) {
    return PERFORMANCE_SCENARIOS[project]?.[scenario];
  }
  
  static getRegressionThreshold(metric) {
    return REGRESSION_CONFIG.threshold[metric] || 10;
  }
  
  static createReportDirectory() {
    const reportDir = path.join(process.cwd(), REPORT_CONFIG.output.directory);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    return reportDir;
  }
  
  static generateTestConfig(project, scenario) {
    const projectPath = this.getProjectPath(project);
    const scenarioConfig = this.getScenario(project, scenario);
    const benchmark = PERFORMANCE_CONFIG[project];
    
    return {
      project,
      scenario,
      path: projectPath,
      config: scenarioConfig,
      benchmark,
      timestamp: new Date().toISOString()
    };
  }
  
  static validateBenchmark(results, project, category) {
    const benchmark = this.getBenchmark(project, category);
    if (!benchmark) return { valid: true, violations: [] };
    
    const violations = [];
    
    // 递归检查基准值
    const checkBenchmark = (actual, expected, path = '') => {
      for (const [key, value] of Object.entries(expected)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof value === 'object' && value !== null) {
          if (actual[key]) {
            checkBenchmark(actual[key], value, currentPath);
          }
        } else {
          const actualValue = actual[key];
          if (actualValue !== undefined) {
            // 根据指标类型判断是否违反基准
            const isViolation = this.isViolation(actualValue, value, key);
            if (isViolation) {
              violations.push({
                metric: currentPath,
                expected: value,
                actual: actualValue,
                violation: this.getViolationType(actualValue, value, key)
              });
            }
          }
        }
      }
    };
    
    checkBenchmark(results, benchmark);
    
    return {
      valid: violations.length === 0,
      violations
    };
  }
  
  static isViolation(actual, expected, metric) {
    // 根据指标类型判断违反条件
    const lowerIsBetter = ['responseTime', 'queryTime', 'loadTime', 'memoryUsage', 'size'];
    const higherIsBetter = ['throughput', 'rps', 'concurrent'];
    
    if (lowerIsBetter.some(m => metric.includes(m))) {
      return actual > expected;
    } else if (higherIsBetter.some(m => metric.includes(m))) {
      return actual < expected;
    }
    
    return false;
  }
  
  static getViolationType(actual, expected, metric) {
    const ratio = actual / expected;
    if (ratio > 1.5) return 'critical';
    if (ratio > 1.2) return 'warning';
    if (ratio < 0.8) return 'below-target';
    return 'minor';
  }
}

module.exports = {
  PROJECT_PATHS,
  PERFORMANCE_CONFIG,
  PERFORMANCE_SCENARIOS,
  REGRESSION_CONFIG,
  REPORT_CONFIG,
  PerformanceConfig
};