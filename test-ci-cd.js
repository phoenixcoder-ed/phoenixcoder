/**
 * CI/CD 流程测试文件
 * 用于验证 GitHub Actions 工作流是否正常运行
 */

const assert = require('assert');
const { execSync } = require('child_process');

// 测试 Node.js 版本
function testNodeVersion() {
  console.log('🔍 测试 Node.js 版本...');
  const nodeVersion = process.version;
  console.log(`当前 Node.js 版本: ${nodeVersion}`);
  
  // 验证是否为 Node.js 24.x
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  assert(majorVersion >= 24, `Node.js 版本应该 >= 24，当前版本: ${nodeVersion}`);
  
  console.log('✅ Node.js 版本测试通过');
}

// 测试环境变量
function testEnvironmentVariables() {
  console.log('🔍 测试环境变量...');
  
  const requiredEnvs = ['NODE_ENV', 'CI'];
  const missingEnvs = [];
  
  requiredEnvs.forEach(env => {
    if (!process.env[env]) {
      missingEnvs.push(env);
    }
  });
  
  if (missingEnvs.length > 0) {
    console.log(`⚠️ 缺少环境变量: ${missingEnvs.join(', ')}`);
  } else {
    console.log('✅ 环境变量测试通过');
  }
}

// 测试基本功能
function testBasicFunctionality() {
  console.log('🔍 测试基本功能...');
  
  // 测试数组操作
  const testArray = [1, 2, 3, 4, 5];
  const doubled = testArray.map(x => x * 2);
  assert.deepEqual(doubled, [2, 4, 6, 8, 10], '数组映射功能测试失败');
  
  // 测试对象操作
  const testObj = { name: 'PhoenixCoder', version: '1.0.0' };
  assert(testObj.name === 'PhoenixCoder', '对象属性访问测试失败');
  
  // 测试异步操作
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('✅ 基本功能测试通过');
      resolve();
    }, 100);
  });
}

// 测试项目结构
function testProjectStructure() {
  console.log('🔍 测试项目结构...');
  
  const fs = require('fs');
  const path = require('path');
  
  const requiredFiles = [
    'package.json',
    'pnpm-workspace.yaml',
    '.github/workflows/ci.yml'
  ];
  
  const missingFiles = [];
  
  requiredFiles.forEach(file => {
    if (!fs.existsSync(path.join(process.cwd(), file))) {
      missingFiles.push(file);
    }
  });
  
  if (missingFiles.length > 0) {
    console.log(`❌ 缺少必要文件: ${missingFiles.join(', ')}`);
    throw new Error(`项目结构不完整: ${missingFiles.join(', ')}`);
  }
  
  console.log('✅ 项目结构测试通过');
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始 CI/CD 流程测试...');
  console.log('=' * 50);
  
  try {
    testNodeVersion();
    testEnvironmentVariables();
    testProjectStructure();
    await testBasicFunctionality();
    
    console.log('=' * 50);
    console.log('🎉 所有测试通过！CI/CD 流程正常工作');
    console.log(`测试时间: ${new Date().toISOString()}`);
    console.log(`测试环境: ${process.env.NODE_ENV || 'development'}`);
    
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
  testNodeVersion,
  testEnvironmentVariables,
  testBasicFunctionality,
  testProjectStructure,
  runTests
};