#!/usr/bin/env node
/**
 * GitHub Actions 工作流语法验证脚本
 * 验证 .github/workflows 目录下的所有 YAML 文件语法
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// 检查是否安装了 js-yaml
try {
  require('js-yaml');
} catch (error) {
  console.log('📦 安装 js-yaml 依赖...');
  const { execSync } = require('child_process');
  execSync('npm install js-yaml', { stdio: 'inherit' });
  console.log('✅ js-yaml 安装完成');
}

const workflowsDir = path.join(__dirname, '.github', 'workflows');

function validateWorkflowFile(filePath) {
  console.log(`🔍 验证工作流文件: ${path.basename(filePath)}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 检查基本的 YAML 语法
    const parsed = yaml.load(content);
    
    // 检查必要的字段
    if (!parsed.name) {
      throw new Error('缺少 name 字段');
    }
    
    if (!parsed.on) {
      throw new Error('缺少 on 字段（触发条件）');
    }
    
    if (!parsed.jobs) {
      throw new Error('缺少 jobs 字段');
    }
    
    // 检查 jobs 结构
    for (const [jobName, job] of Object.entries(parsed.jobs)) {
      if (!job['runs-on']) {
        throw new Error(`作业 ${jobName} 缺少 runs-on 字段`);
      }
      
      if (!job.steps || !Array.isArray(job.steps)) {
        throw new Error(`作业 ${jobName} 缺少 steps 字段或 steps 不是数组`);
      }
      
      // 检查每个步骤
      job.steps.forEach((step, index) => {
        if (!step.name && !step.uses && !step.run) {
          throw new Error(`作业 ${jobName} 的步骤 ${index + 1} 缺少 name、uses 或 run 字段`);
        }
      });
    }
    
    console.log(`  ✅ ${path.basename(filePath)} 语法正确`);
    return true;
    
  } catch (error) {
    console.error(`  ❌ ${path.basename(filePath)} 验证失败:`);
    console.error(`     ${error.message}`);
    return false;
  }
}

function validateAllWorkflows() {
  console.log('🚀 开始验证 GitHub Actions 工作流文件...');
  console.log('=' .repeat(60));
  
  if (!fs.existsSync(workflowsDir)) {
    console.error('❌ .github/workflows 目录不存在');
    process.exit(1);
  }
  
  const files = fs.readdirSync(workflowsDir)
    .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
    .map(file => path.join(workflowsDir, file));
  
  if (files.length === 0) {
    console.log('⚠️ 没有找到工作流文件');
    return;
  }
  
  console.log(`📁 找到 ${files.length} 个工作流文件`);
  console.log('');
  
  let validCount = 0;
  let invalidCount = 0;
  
  files.forEach(file => {
    if (validateWorkflowFile(file)) {
      validCount++;
    } else {
      invalidCount++;
    }
    console.log('');
  });
  
  console.log('=' .repeat(60));
  console.log('📊 验证结果摘要:');
  console.log(`  ✅ 有效文件: ${validCount}`);
  console.log(`  ❌ 无效文件: ${invalidCount}`);
  console.log(`  📁 总文件数: ${files.length}`);
  
  if (invalidCount > 0) {
    console.log('');
    console.log('❌ 发现语法错误，请修复后重试');
    process.exit(1);
  } else {
    console.log('');
    console.log('🎉 所有工作流文件语法正确！');
    console.log('✅ CI/CD 配置验证通过');
  }
}

// 运行验证
if (require.main === module) {
  validateAllWorkflows();
}

module.exports = {
  validateWorkflowFile,
  validateAllWorkflows
};