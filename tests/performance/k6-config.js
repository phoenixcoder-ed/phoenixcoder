import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

/**
 * PhoenixCoder 性能测试配置
 * 
 * 使用 k6 进行 API 和前端性能测试
 * 包括负载测试、压力测试、峰值测试等场景
 */

// 自定义指标
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('requests');
const loginSuccessRate = new Rate('login_success');
const taskCreationRate = new Rate('task_creation_success');

// 测试配置
export const options = {
  // 测试场景
  scenarios: {
    // 负载测试：模拟正常用户负载
    load_test: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '2m', target: 10 },   // 2分钟内增加到10个用户
        { duration: '5m', target: 10 },   // 保持10个用户5分钟
        { duration: '2m', target: 20 },   // 2分钟内增加到20个用户
        { duration: '5m', target: 20 },   // 保持20个用户5分钟
        { duration: '2m', target: 0 },    // 2分钟内减少到0个用户
      ],
      gracefulRampDown: '30s',
      tags: { test_type: 'load' },
    },
    
    // 压力测试：测试系统极限
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '1m', target: 20 },   // 1分钟内增加到20个用户
        { duration: '2m', target: 50 },   // 2分钟内增加到50个用户
        { duration: '2m', target: 100 },  // 2分钟内增加到100个用户
        { duration: '3m', target: 100 },  // 保持100个用户3分钟
        { duration: '2m', target: 0 },    // 2分钟内减少到0个用户
      ],
      gracefulRampDown: '30s',
      tags: { test_type: 'stress' },
      env: { STRESS_TEST: 'true' },
    },
    
    // 峰值测试：突发流量测试
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 10 },  // 30秒内增加到10个用户
        { duration: '1m', target: 100 },  // 1分钟内突增到100个用户
        { duration: '30s', target: 10 },  // 30秒内回落到10个用户
        { duration: '1m', target: 10 },   // 保持10个用户1分钟
        { duration: '30s', target: 0 },   // 30秒内减少到0个用户
      ],
      gracefulRampDown: '30s',
      tags: { test_type: 'spike' },
    },
    
    // 容量测试：长时间稳定负载
    volume_test: {
      executor: 'constant-vus',
      vus: 30,
      duration: '10m',
      tags: { test_type: 'volume' },
    },
    
    // API 专项测试
    api_test: {
      executor: 'per-vu-iterations',
      vus: 10,
      iterations: 100,
      maxDuration: '5m',
      tags: { test_type: 'api' },
    },
  },
  
  // 性能阈值
  thresholds: {
    // HTTP 请求失败率小于 1%
    http_req_failed: ['rate<0.01'],
    
    // 95% 的请求响应时间小于 500ms
    http_req_duration: ['p(95)<500'],
    
    // 平均响应时间小于 200ms
    'http_req_duration{expected_response:true}': ['avg<200'],
    
    // 错误率小于 1%
    errors: ['rate<0.01'],
    
    // 登录成功率大于 99%
    login_success: ['rate>0.99'],
    
    // 任务创建成功率大于 98%
    task_creation_success: ['rate>0.98'],
    
    // 特定场景的阈值
    'http_req_duration{test_type:load}': ['p(95)<300'],
    'http_req_duration{test_type:stress}': ['p(95)<1000'],
    'http_req_duration{test_type:spike}': ['p(95)<2000'],
  },
  
  // 其他配置
  userAgent: 'PhoenixCoder-K6-Performance-Test/1.0',
  insecureSkipTLSVerify: true,
  noConnectionReuse: false,
  
  // 输出配置
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// 环境配置
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:8000';
const TEST_USER_EMAIL = __ENV.TEST_USER_EMAIL || 'test@phoenixcoder.com';
const TEST_USER_PASSWORD = __ENV.TEST_USER_PASSWORD || 'TestPassword123!';

// 测试数据
const testUsers = [
  { email: 'user1@phoenixcoder.com', password: 'Password123!' },
  { email: 'user2@phoenixcoder.com', password: 'Password123!' },
  { email: 'user3@phoenixcoder.com', password: 'Password123!' },
  { email: 'user4@phoenixcoder.com', password: 'Password123!' },
  { email: 'user5@phoenixcoder.com', password: 'Password123!' },
];

const taskTemplates = [
  {
    title: 'React 组件开发',
    description: '开发一个可复用的 React 组件',
    skills: ['React', 'TypeScript', 'CSS'],
    reward: 2000,
    deadline: '2024-12-31'
  },
  {
    title: 'Python API 开发',
    description: '使用 FastAPI 开发 RESTful API',
    skills: ['Python', 'FastAPI', 'PostgreSQL'],
    reward: 3000,
    deadline: '2024-12-31'
  },
  {
    title: '数据库优化',
    description: '优化 PostgreSQL 查询性能',
    skills: ['PostgreSQL', 'SQL', '性能优化'],
    reward: 2500,
    deadline: '2024-12-31'
  }
];

// 辅助函数
function getRandomUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

function getRandomTask() {
  return taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
}

function generateRandomString(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 登录函数
function login(email = TEST_USER_EMAIL, password = TEST_USER_PASSWORD) {
  const loginPayload = {
    email: email,
    password: password
  };
  
  const response = http.post(`${API_BASE_URL}/api/auth/login`, JSON.stringify(loginPayload), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  const success = check(response, {
    '登录状态码为 200': (r) => r.status === 200,
    '登录响应包含 token': (r) => r.json('access_token') !== undefined,
    '登录响应时间 < 1s': (r) => r.timings.duration < 1000,
  });
  
  loginSuccessRate.add(success);
  requestCount.add(1);
  responseTime.add(response.timings.duration);
  
  if (!success) {
    errorRate.add(1);
    console.error(`登录失败: ${response.status} - ${response.body}`);
    return null;
  }
  
  return response.json('access_token');
}

// 获取任务列表
function getTasks(token) {
  const response = http.get(`${API_BASE_URL}/api/tasks`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  const success = check(response, {
    '获取任务列表状态码为 200': (r) => r.status === 200,
    '任务列表包含数据': (r) => r.json('data') !== undefined,
    '获取任务列表响应时间 < 500ms': (r) => r.timings.duration < 500,
  });
  
  requestCount.add(1);
  responseTime.add(response.timings.duration);
  
  if (!success) {
    errorRate.add(1);
  }
  
  return response;
}

// 创建任务
function createTask(token) {
  const taskData = getRandomTask();
  taskData.title += ` - ${generateRandomString(5)}`;
  
  const response = http.post(`${API_BASE_URL}/api/tasks`, JSON.stringify(taskData), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  const success = check(response, {
    '创建任务状态码为 201': (r) => r.status === 201,
    '创建任务响应包含 ID': (r) => r.json('id') !== undefined,
    '创建任务响应时间 < 1s': (r) => r.timings.duration < 1000,
  });
  
  taskCreationRate.add(success);
  requestCount.add(1);
  responseTime.add(response.timings.duration);
  
  if (!success) {
    errorRate.add(1);
  }
  
  return response;
}

// 搜索任务
function searchTasks(token, keyword) {
  const response = http.get(`${API_BASE_URL}/api/tasks/search?q=${keyword}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  const success = check(response, {
    '搜索任务状态码为 200': (r) => r.status === 200,
    '搜索结果包含数据': (r) => r.json('data') !== undefined,
    '搜索响应时间 < 300ms': (r) => r.timings.duration < 300,
  });
  
  requestCount.add(1);
  responseTime.add(response.timings.duration);
  
  if (!success) {
    errorRate.add(1);
  }
  
  return response;
}

// 获取用户成长数据
function getUserGrowth(token) {
  const response = http.get(`${API_BASE_URL}/api/users/growth`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  const success = check(response, {
    '获取成长数据状态码为 200': (r) => r.status === 200,
    '成长数据包含统计信息': (r) => r.json('stats') !== undefined,
    '获取成长数据响应时间 < 400ms': (r) => r.timings.duration < 400,
  });
  
  requestCount.add(1);
  responseTime.add(response.timings.duration);
  
  if (!success) {
    errorRate.add(1);
  }
  
  return response;
}

// 前端页面性能测试
function testFrontendPages() {
  const pages = [
    { name: '首页', url: `${BASE_URL}/` },
    { name: '任务大厅', url: `${BASE_URL}/tasks` },
    { name: '登录页', url: `${BASE_URL}/login` },
    { name: '注册页', url: `${BASE_URL}/register` },
  ];
  
  pages.forEach(page => {
    const response = http.get(page.url);
    
    check(response, {
      [`${page.name}状态码为 200`]: (r) => r.status === 200,
      [`${page.name}响应时间 < 2s`]: (r) => r.timings.duration < 2000,
      [`${page.name}包含基本内容`]: (r) => r.body.includes('<!DOCTYPE html>'),
    });
    
    requestCount.add(1);
    responseTime.add(response.timings.duration);
    
    if (response.status !== 200) {
      errorRate.add(1);
    }
  });
}

// 主测试函数
export default function () {
  const testType = __ENV.TEST_TYPE || 'mixed';
  
  // 根据测试类型执行不同的测试逻辑
  switch (testType) {
    case 'api':
      runAPITests();
      break;
    case 'frontend':
      runFrontendTests();
      break;
    case 'auth':
      runAuthTests();
      break;
    case 'tasks':
      runTaskTests();
      break;
    default:
      runMixedTests();
  }
  
  // 随机等待时间，模拟真实用户行为
  sleep(Math.random() * 3 + 1);
}

// API 专项测试
function runAPITests() {
  const user = getRandomUser();
  const token = login(user.email, user.password);
  
  if (token) {
    getTasks(token);
    searchTasks(token, 'Python');
    getUserGrowth(token);
    
    // 30% 概率创建任务
    if (Math.random() < 0.3) {
      createTask(token);
    }
  }
}

// 前端专项测试
function runFrontendTests() {
  testFrontendPages();
}

// 认证专项测试
function runAuthTests() {
  const user = getRandomUser();
  login(user.email, user.password);
}

// 任务专项测试
function runTaskTests() {
  const user = getRandomUser();
  const token = login(user.email, user.password);
  
  if (token) {
    getTasks(token);
    searchTasks(token, 'React');
    searchTasks(token, 'Python');
    searchTasks(token, 'JavaScript');
    
    // 50% 概率创建任务
    if (Math.random() < 0.5) {
      createTask(token);
    }
  }
}

// 混合测试（默认）
function runMixedTests() {
  const user = getRandomUser();
  const token = login(user.email, user.password);
  
  if (token) {
    // 80% 概率浏览任务
    if (Math.random() < 0.8) {
      getTasks(token);
    }
    
    // 60% 概率搜索任务
    if (Math.random() < 0.6) {
      const keywords = ['Python', 'React', 'JavaScript', 'Vue', 'Node.js'];
      const keyword = keywords[Math.floor(Math.random() * keywords.length)];
      searchTasks(token, keyword);
    }
    
    // 40% 概率查看成长数据
    if (Math.random() < 0.4) {
      getUserGrowth(token);
    }
    
    // 20% 概率创建任务
    if (Math.random() < 0.2) {
      createTask(token);
    }
  }
  
  // 30% 概率测试前端页面
  if (Math.random() < 0.3) {
    testFrontendPages();
  }
}

// 测试报告生成
export function handleSummary(data) {
  return {
    'performance-report.html': htmlReport(data),
    'performance-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

// 测试生命周期钩子
export function setup() {
  console.log('开始性能测试...');
  console.log(`目标 URL: ${BASE_URL}`);
  console.log(`API URL: ${API_BASE_URL}`);
  
  // 预热请求
  const warmupResponse = http.get(`${BASE_URL}/`);
  if (warmupResponse.status !== 200) {
    console.warn('预热请求失败，可能影响测试结果');
  }
  
  return { startTime: new Date().toISOString() };
}

export function teardown(data) {
  console.log('性能测试完成');
  console.log(`开始时间: ${data.startTime}`);
  console.log(`结束时间: ${new Date().toISOString()}`);
}