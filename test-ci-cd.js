/**
 * CI/CD 流程测试文件
 * 用于验证 GitHub Actions 工作流是否正常运行
 */

const assert = require('assert');

// 基本功能测试
function testBasicFunctionality() {
  console.log('🧪 运行基本功能测试...');
  
  // 测试数学运算
  const result = 2 + 2;
  assert.strictEqual(result, 4, '数学运算测试失败');
  
  // 测试字符串操作
  const str = 'Hello CI/CD';
  assert.strictEqual(str.length, 11, '字符串长度测试失败');
  
  // 测试数组操作
  const arr = [1, 2, 3, 4, 5];
  assert.strictEqual(arr.length, 5, '数组长度测试失败');
  assert.strictEqual(arr.reduce((a, b) => a + b, 0), 15, '数组求和测试失败');
  
  console.log('✅ 基本功能测试通过');
}

// 异步操作测试
async function testAsyncOperations() {
  console.log('🔄 运行异步操作测试...');
  
  // 模拟异步操作
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  const start = Date.now();
  await delay(100);
  const end = Date.now();
  
  assert(end - start >= 100, '异步延迟测试失败');
  
  console.log('✅ 异步操作测试通过');
}

// 错误处理测试
function testErrorHandling() {
  console.log('⚠️ 运行错误处理测试...');
  
  try {
    throw new Error('测试错误');
  } catch (error) {
    assert.strictEqual(error.message, '测试错误', '错误处理测试失败');
  }
  
  console.log('✅ 错误处理测试通过');
}

// 环境变量测试
function testEnvironmentVariables() {
  console.log('🌍 运行环境变量测试...');
  
  // 检查 Node.js 版本
  const nodeVersion = process.version;
  console.log(`Node.js 版本: ${nodeVersion}`);
  
  // 检查环境
  const env = process.env.NODE_ENV || 'development';
  console.log(`运行环境: ${env}`);
  
  // 检查 CI 环境
  const isCI = process.env.CI === 'true';
  console.log(`CI 环境: ${isCI}`);
  
  console.log('✅ 环境变量测试通过');
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始 CI/CD 流程测试...');
  console.log('=' .repeat(50));
  
  try {
    testBasicFunctionality();
    await testAsyncOperations();
    testErrorHandling();
    testEnvironmentVariables();
    
    console.log('=' .repeat(50));
    console.log('🎉 所有测试通过！CI/CD 流程验证成功');
    console.log(`测试时间: ${new Date().toISOString()}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  runTests();
}

module.exports = {
  testBasicFunctionality,
  testAsyncOperations,
  testErrorHandling,
  testEnvironmentVariables,
  runTests
};