/**
 * PhoenixCoder 项目测试覆盖率监控配置
 * 
 * 统一管理后端、前端和小程序的测试覆盖率报告和可视化界面
 */

const path = require('path');
const fs = require('fs');

// 项目路径配置
const PROJECT_PATHS = {
  root: __dirname,
  backend: path.join(__dirname, 'apps/community/server'),
  frontend: path.join(__dirname, 'apps/community/admin'),
  miniapp: path.join(__dirname, 'apps/community/miniapp'),
  oidcServer: path.join(__dirname, 'apps/community/oidc-server'),
  reports: path.join(__dirname, 'coverage-reports')
};

// 覆盖率阈值配置
const COVERAGE_THRESHOLDS = {
  backend: {
    lines: 80,
    functions: 80,
    branches: 75,
    statements: 80
  },
  frontend: {
    lines: 75,
    functions: 75,
    branches: 70,
    statements: 75
  },
  miniapp: {
    lines: 70,
    functions: 70,
    branches: 65,
    statements: 70
  },
  oidcServer: {
    lines: 85,
    functions: 85,
    branches: 80,
    statements: 85
  }
};

// 报告格式配置
const REPORT_FORMATS = {
  backend: ['html', 'xml', 'json', 'lcov', 'term'],
  frontend: ['html', 'json', 'lcov', 'text', 'clover'],
  miniapp: ['html', 'json', 'lcov', 'text', 'clover'],
  oidcServer: ['html', 'xml', 'json', 'lcov', 'term']
};

// 排除文件配置
const EXCLUDE_PATTERNS = {
  backend: [
    '*/tests/*',
    '*/test_*',
    '*/__pycache__/*',
    '*/migrations/*',
    '*/venv/*',
    '*/env/*',
    '*/.pytest_cache/*',
    '*/conftest.py',
    '*/setup.py',
    '*/manage.py',
    '*/__init__.py'
  ],
  frontend: [
    'node_modules/**',
    'dist/**',
    'build/**',
    'coverage/**',
    '**/*.test.{ts,tsx,js,jsx}',
    '**/*.spec.{ts,tsx,js,jsx}',
    '**/tests/**',
    '**/test-utils/**',
    '**/mocks/**',
    '**/factories/**',
    '**/*.d.ts',
    '**/vite.config.ts',
    '**/vitest.config.ts',
    '**/tailwind.config.js',
    '**/postcss.config.js'
  ],
  miniapp: [
    'node_modules/**',
    'dist/**',
    'build/**',
    'coverage/**',
    '**/*.test.{ts,tsx,js,jsx}',
    '**/*.spec.{ts,tsx,js,jsx}',
    '**/tests/**',
    '**/test-utils/**',
    '**/mocks/**',
    '**/factories/**',
    '**/*.d.ts',
    '**/config/**',
    '**/project.config.json',
    '**/project.tt.json'
  ],
  oidcServer: [
    '*/tests/*',
    '*/test_*',
    '*/__pycache__/*',
    '*/venv/*',
    '*/env/*',
    '*/.pytest_cache/*',
    '*/conftest.py',
    '*/setup.py',
    '*/__init__.py'
  ]
};

// 生成后端pytest覆盖率配置
function generatePytestCoverageConfig(projectName) {
  const thresholds = COVERAGE_THRESHOLDS[projectName];
  const excludePatterns = EXCLUDE_PATTERNS[projectName];
  
  return {
    source: ['.'],
    omit: excludePatterns,
    'fail_under': thresholds.lines,
    'show_missing': true,
    'skip_covered': false,
    precision: 2,
    report: {
      html: {
        directory: path.join(PROJECT_PATHS.reports, projectName, 'html'),
        title: `${projectName} Coverage Report`
      },
      xml: {
        output: path.join(PROJECT_PATHS.reports, projectName, 'coverage.xml')
      },
      json: {
        output: path.join(PROJECT_PATHS.reports, projectName, 'coverage.json')
      },
      lcov: {
        output: path.join(PROJECT_PATHS.reports, projectName, 'lcov.info')
      },
      term: {
        'show_missing': true,
        'skip_covered': false
      }
    },
    thresholds: {
      lines: thresholds.lines,
      functions: thresholds.functions,
      branches: thresholds.branches,
      statements: thresholds.statements
    }
  };
}

// 生成前端vitest覆盖率配置
function generateVitestCoverageConfig(projectName) {
  const thresholds = COVERAGE_THRESHOLDS[projectName];
  const excludePatterns = EXCLUDE_PATTERNS[projectName];
  const reportFormats = REPORT_FORMATS[projectName];
  
  return {
    provider: 'v8',
    enabled: true,
    clean: true,
    cleanOnRerun: true,
    reportsDirectory: path.join(PROJECT_PATHS.reports, projectName),
    reporter: reportFormats,
    exclude: excludePatterns,
    include: [
      'src/**/*.{ts,tsx,js,jsx,vue}',
      'pages/**/*.{ts,tsx,js,jsx,vue}',
      'components/**/*.{ts,tsx,js,jsx,vue}',
      'utils/**/*.{ts,tsx,js,jsx}',
      'hooks/**/*.{ts,tsx,js,jsx}',
      'composables/**/*.{ts,tsx,js,jsx}',
      'stores/**/*.{ts,tsx,js,jsx}',
      'services/**/*.{ts,tsx,js,jsx}'
    ],
    thresholds: {
      global: {
        lines: thresholds.lines,
        functions: thresholds.functions,
        branches: thresholds.branches,
        statements: thresholds.statements
      },
      perFile: {
        lines: Math.max(thresholds.lines - 10, 50),
        functions: Math.max(thresholds.functions - 10, 50),
        branches: Math.max(thresholds.branches - 10, 40),
        statements: Math.max(thresholds.statements - 10, 50)
      }
    },
    watermarks: {
      statements: [thresholds.statements - 20, thresholds.statements],
      functions: [thresholds.functions - 20, thresholds.functions],
      branches: [thresholds.branches - 20, thresholds.branches],
      lines: [thresholds.lines - 20, thresholds.lines]
    },
    reportOnFailure: true,
    skipFull: false,
    all: true
  };
}

// 生成覆盖率报告HTML模板
function generateCoverageReportTemplate() {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PhoenixCoder 测试覆盖率报告</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8fafc;
        }
        
        .stat-card {
            background: white;
            border-radius: 8px;
            padding: 25px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            border-left: 4px solid #3b82f6;
            transition: transform 0.2s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-2px);
        }
        
        .stat-card.backend {
            border-left-color: #10b981;
        }
        
        .stat-card.frontend {
            border-left-color: #3b82f6;
        }
        
        .stat-card.miniapp {
            border-left-color: #8b5cf6;
        }
        
        .stat-card.oidc {
            border-left-color: #f59e0b;
        }
        
        .stat-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #374151;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .stat-value {
            font-size: 2.5rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 5px;
        }
        
        .stat-label {
            font-size: 0.9rem;
            color: #6b7280;
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 10px;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #10b981, #34d399);
            border-radius: 4px;
            transition: width 0.3s ease;
        }
        
        .projects-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            padding: 30px;
        }
        
        .project-card {
            background: white;
            border-radius: 8px;
            padding: 25px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            border: 1px solid #e5e7eb;
        }
        
        .project-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        
        .project-name {
            font-size: 1.3rem;
            font-weight: 600;
            color: #1f2937;
        }
        
        .project-status {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
            text-transform: uppercase;
        }
        
        .status-pass {
            background: #d1fae5;
            color: #065f46;
        }
        
        .status-fail {
            background: #fee2e2;
            color: #991b1b;
        }
        
        .status-warning {
            background: #fef3c7;
            color: #92400e;
        }
        
        .metrics {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }
        
        .metric {
            text-align: center;
        }
        
        .metric-value {
            font-size: 1.8rem;
            font-weight: 700;
            color: #1f2937;
        }
        
        .metric-label {
            font-size: 0.8rem;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .actions {
            margin-top: 20px;
            display: flex;
            gap: 10px;
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s ease;
        }
        
        .btn-primary {
            background: #3b82f6;
            color: white;
        }
        
        .btn-primary:hover {
            background: #2563eb;
        }
        
        .btn-secondary {
            background: #f3f4f6;
            color: #374151;
        }
        
        .btn-secondary:hover {
            background: #e5e7eb;
        }
        
        .footer {
            background: #1f2937;
            color: white;
            text-align: center;
            padding: 20px;
            font-size: 0.9rem;
        }
        
        .icon {
            width: 16px;
            height: 16px;
        }
        
        @media (max-width: 768px) {
            .stats-grid,
            .projects-grid {
                grid-template-columns: 1fr;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .metrics {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 PhoenixCoder 测试覆盖率报告</h1>
            <p>智能分层测试架构 - 代码质量监控面板</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card backend">
                <div class="stat-title">
                    🐍 后端服务
                </div>
                <div class="stat-value" id="backend-coverage">--</div>
                <div class="stat-label">代码覆盖率</div>
                <div class="progress-bar">
                    <div class="progress-fill" id="backend-progress"></div>
                </div>
            </div>
            
            <div class="stat-card frontend">
                <div class="stat-title">
                    ⚛️ 管理前端
                </div>
                <div class="stat-value" id="frontend-coverage">--</div>
                <div class="stat-label">代码覆盖率</div>
                <div class="progress-bar">
                    <div class="progress-fill" id="frontend-progress"></div>
                </div>
            </div>
            
            <div class="stat-card miniapp">
                <div class="stat-title">
                    📱 微信小程序
                </div>
                <div class="stat-value" id="miniapp-coverage">--</div>
                <div class="stat-label">代码覆盖率</div>
                <div class="progress-bar">
                    <div class="progress-fill" id="miniapp-progress"></div>
                </div>
            </div>
            
            <div class="stat-card oidc">
                <div class="stat-title">
                    🔐 OIDC服务
                </div>
                <div class="stat-value" id="oidc-coverage">--</div>
                <div class="stat-label">代码覆盖率</div>
                <div class="progress-bar">
                    <div class="progress-fill" id="oidc-progress"></div>
                </div>
            </div>
        </div>
        
        <div class="projects-grid" id="projects-container">
            <!-- 项目详情卡片将通过JavaScript动态生成 -->
        </div>
        
        <div class="footer">
            <p>📊 报告生成时间: <span id="report-time"></span> | 🚀 PhoenixCoder 智能测试系统</p>
        </div>
    </div>
    
    <script>
        // 模拟数据 - 实际使用时会从API获取
        const mockData = {
            backend: {
                name: '后端服务',
                coverage: 85.2,
                status: 'pass',
                lines: { covered: 1245, total: 1460 },
                functions: { covered: 234, total: 278 },
                branches: { covered: 156, total: 198 },
                statements: { covered: 1245, total: 1460 }
            },
            frontend: {
                name: '管理前端',
                coverage: 78.6,
                status: 'pass',
                lines: { covered: 892, total: 1135 },
                functions: { covered: 167, total: 213 },
                branches: { covered: 89, total: 127 },
                statements: { covered: 892, total: 1135 }
            },
            miniapp: {
                name: '微信小程序',
                coverage: 72.4,
                status: 'warning',
                lines: { covered: 634, total: 876 },
                functions: { covered: 123, total: 178 },
                branches: { covered: 67, total: 103 },
                statements: { covered: 634, total: 876 }
            },
            oidcServer: {
                name: 'OIDC服务',
                coverage: 88.9,
                status: 'pass',
                lines: { covered: 445, total: 501 },
                functions: { covered: 89, total: 98 },
                branches: { covered: 78, total: 89 },
                statements: { covered: 445, total: 501 }
            }
        };
        
        // 更新覆盖率统计
        function updateCoverageStats() {
            Object.keys(mockData).forEach(project => {
                const data = mockData[project];
                const coverageElement = document.getElementById(`${project}-coverage`);
                const progressElement = document.getElementById(`${project}-progress`);
                
                if (coverageElement && progressElement) {
                    coverageElement.textContent = `${data.coverage.toFixed(1)}%`;
                    progressElement.style.width = `${data.coverage}%`;
                    
                    // 根据覆盖率设置颜色
                    if (data.coverage >= 80) {
                        progressElement.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
                    } else if (data.coverage >= 70) {
                        progressElement.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
                    } else {
                        progressElement.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
                    }
                }
            });
        }
        
        // 生成项目详情卡片
        function generateProjectCards() {
            const container = document.getElementById('projects-container');
            
            Object.keys(mockData).forEach(project => {
                const data = mockData[project];
                const card = document.createElement('div');
                card.className = 'project-card';
                
                card.innerHTML = `
                    <div class="project-header">
                        <div class="project-name">${data.name}</div>
                        <div class="project-status status-${data.status}">
                            ${data.status === 'pass' ? '✅ 通过' : data.status === 'warning' ? '⚠️ 警告' : '❌ 失败'}
                        </div>
                    </div>
                    
                    <div class="metrics">
                        <div class="metric">
                            <div class="metric-value">${((data.lines.covered / data.lines.total) * 100).toFixed(1)}%</div>
                            <div class="metric-label">行覆盖率</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${((data.functions.covered / data.functions.total) * 100).toFixed(1)}%</div>
                            <div class="metric-label">函数覆盖率</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${((data.branches.covered / data.branches.total) * 100).toFixed(1)}%</div>
                            <div class="metric-label">分支覆盖率</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${((data.statements.covered / data.statements.total) * 100).toFixed(1)}%</div>
                            <div class="metric-label">语句覆盖率</div>
                        </div>
                    </div>
                    
                    <div class="actions">
                        <a href="./${project}/html/index.html" class="btn btn-primary">
                            📊 详细报告
                        </a>
                        <a href="./${project}/lcov.info" class="btn btn-secondary">
                            📄 LCOV数据
                        </a>
                    </div>
                `;
                
                container.appendChild(card);
            });
        }
        
        // 更新报告时间
        function updateReportTime() {
            const now = new Date();
            const timeString = now.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            document.getElementById('report-time').textContent = timeString;
        }
        
        // 初始化页面
        document.addEventListener('DOMContentLoaded', function() {
            updateCoverageStats();
            generateProjectCards();
            updateReportTime();
            
            // 每30秒刷新一次数据（实际使用时可以通过WebSocket实时更新）
            setInterval(() => {
                // 这里可以添加API调用来获取最新的覆盖率数据
                updateReportTime();
            }, 30000);
        });
    </script>
</body>
</html>
  `.trim();
}

// 创建覆盖率报告目录结构
function createCoverageDirectories() {
  const directories = [
    PROJECT_PATHS.reports,
    path.join(PROJECT_PATHS.reports, 'backend'),
    path.join(PROJECT_PATHS.reports, 'frontend'),
    path.join(PROJECT_PATHS.reports, 'miniapp'),
    path.join(PROJECT_PATHS.reports, 'oidcServer'),
    path.join(PROJECT_PATHS.reports, 'combined')
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// 生成合并覆盖率报告
function generateCombinedReport() {
  const reportPath = path.join(PROJECT_PATHS.reports, 'index.html');
  const template = generateCoverageReportTemplate();
  
  fs.writeFileSync(reportPath, template, 'utf8');
  console.log(`✅ 合并覆盖率报告已生成: ${reportPath}`);
}

// 覆盖率监控配置类
class CoverageMonitor {
  constructor() {
    this.projects = Object.keys(PROJECT_PATHS).filter(key => key !== 'root' && key !== 'reports');
    this.thresholds = COVERAGE_THRESHOLDS;
    this.reportFormats = REPORT_FORMATS;
  }
  
  // 获取项目覆盖率配置
  getProjectConfig(projectName) {
    if (projectName === 'backend' || projectName === 'oidcServer') {
      return generatePytestCoverageConfig(projectName);
    } else {
      return generateVitestCoverageConfig(projectName);
    }
  }
  
  // 检查覆盖率阈值
  checkThresholds(projectName, coverage) {
    const thresholds = this.thresholds[projectName];
    if (!thresholds) return { passed: false, message: '未找到项目阈值配置' };
    
    const results = {
      lines: coverage.lines >= thresholds.lines,
      functions: coverage.functions >= thresholds.functions,
      branches: coverage.branches >= thresholds.branches,
      statements: coverage.statements >= thresholds.statements
    };
    
    const passed = Object.values(results).every(result => result);
    const failedMetrics = Object.keys(results).filter(key => !results[key]);
    
    return {
      passed,
      results,
      message: passed 
        ? '✅ 所有覆盖率指标均达到阈值要求'
        : `❌ 以下指标未达到阈值要求: ${failedMetrics.join(', ')}`
    };
  }
  
  // 生成覆盖率徽章
  generateBadge(projectName, coverage) {
    const color = coverage >= 80 ? 'brightgreen' : coverage >= 70 ? 'yellow' : 'red';
    const badgeUrl = `https://img.shields.io/badge/coverage-${coverage.toFixed(1)}%25-${color}`;
    
    return {
      url: badgeUrl,
      markdown: `![Coverage](${badgeUrl})`,
      html: `<img src="${badgeUrl}" alt="Coverage Badge" />`
    };
  }
  
  // 初始化监控
  initialize() {
    console.log('🚀 初始化测试覆盖率监控系统...');
    
    // 创建目录结构
    createCoverageDirectories();
    
    // 生成合并报告
    generateCombinedReport();
    
    // 为每个项目生成配置
    this.projects.forEach(project => {
      const config = this.getProjectConfig(project);
      console.log(`📋 ${project} 覆盖率配置已生成`);
    });
    
    console.log('✅ 测试覆盖率监控系统初始化完成');
    console.log(`📊 覆盖率报告地址: ${path.join(PROJECT_PATHS.reports, 'index.html')}`);
  }
}

// 导出配置和工具
module.exports = {
  PROJECT_PATHS,
  COVERAGE_THRESHOLDS,
  REPORT_FORMATS,
  EXCLUDE_PATTERNS,
  generatePytestCoverageConfig,
  generateVitestCoverageConfig,
  generateCoverageReportTemplate,
  createCoverageDirectories,
  generateCombinedReport,
  CoverageMonitor
};

// 如果直接运行此文件，则初始化监控系统
if (require.main === module) {
  const monitor = new CoverageMonitor();
  monitor.initialize();
}