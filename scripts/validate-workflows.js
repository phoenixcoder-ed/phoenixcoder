#!/usr/bin/env node

/**
 * 工作流验证脚本
 * 快速验证 GitHub Actions 工作流文件的语法和配置
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class WorkflowValidator {
  constructor() {
    this.workflowsDir = '.github/workflows';
    this.errors = [];
    this.warnings = [];
  }

  /**
   * 验证所有工作流文件
   */
  validateAll() {
    console.log('🔍 开始验证 GitHub Actions 工作流文件...\n');
    
    if (!fs.existsSync(this.workflowsDir)) {
      this.addError('工作流目录不存在: .github/workflows');
      return false;
    }

    const workflowFiles = fs.readdirSync(this.workflowsDir)
      .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));

    if (workflowFiles.length === 0) {
      this.addWarning('未找到工作流文件');
      return true;
    }

    console.log(`📁 发现 ${workflowFiles.length} 个工作流文件`);

    let allValid = true;
    workflowFiles.forEach(file => {
      const isValid = this.validateWorkflowFile(file);
      if (!isValid) allValid = false;
    });

    return allValid;
  }

  /**
   * 验证单个工作流文件
   */
  validateWorkflowFile(filename) {
    const filePath = path.join(this.workflowsDir, filename);
    console.log(`\n📄 验证文件: ${filename}`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 检查 YAML 语法
      const yamlValid = this.validateYamlSyntax(content, filename);
      
      // 检查工作流结构
      const structureValid = this.validateWorkflowStructure(content, filename);
      
      // 检查常见问题
      this.checkCommonIssues(content, filename);
      
      const isValid = yamlValid && structureValid;
      console.log(`  ${isValid ? '✅' : '❌'} ${filename} ${isValid ? '验证通过' : '验证失败'}`);
      
      return isValid;
    } catch (error) {
      this.addError(`读取文件失败 ${filename}: ${error.message}`);
      return false;
    }
  }

  /**
   * 验证 YAML 语法
   */
  validateYamlSyntax(content, filename) {
    try {
      // 尝试使用 js-yaml 解析
      const yaml = require('js-yaml');
      yaml.load(content);
      console.log('    ✅ YAML 语法正确');
      return true;
    } catch (error) {
      this.addError(`${filename}: YAML 语法错误 - ${error.message}`);
      console.log('    ❌ YAML 语法错误');
      return false;
    }
  }

  /**
   * 验证工作流结构
   */
  validateWorkflowStructure(content, filename) {
    try {
      const yaml = require('js-yaml');
      const workflow = yaml.load(content);
      let isValid = true;

      // 检查必需字段
      if (!workflow.name) {
        this.addWarning(`${filename}: 建议添加工作流名称`);
      } else {
        console.log(`    ✅ 工作流名称: ${workflow.name}`);
      }

      if (!workflow.on) {
        this.addError(`${filename}: 缺少触发条件 (on)`);
        isValid = false;
      } else {
        console.log('    ✅ 触发条件已定义');
      }

      if (!workflow.jobs) {
        this.addError(`${filename}: 缺少作业定义 (jobs)`);
        isValid = false;
      } else {
        console.log(`    ✅ 作业定义: ${Object.keys(workflow.jobs).length} 个作业`);
        
        // 验证每个作业
        Object.keys(workflow.jobs).forEach(jobName => {
          const job = workflow.jobs[jobName];
          
          if (!job['runs-on']) {
            this.addError(`${filename}: 作业 ${jobName} 缺少 runs-on`);
            isValid = false;
          }
          
          if (!job.steps || !Array.isArray(job.steps)) {
            this.addError(`${filename}: 作业 ${jobName} 缺少步骤定义`);
            isValid = false;
          } else if (job.steps.length === 0) {
            this.addWarning(`${filename}: 作业 ${jobName} 没有定义任何步骤`);
          }
        });
      }

      return isValid;
    } catch (error) {
      this.addError(`${filename}: 结构验证失败 - ${error.message}`);
      return false;
    }
  }

  /**
   * 检查常见问题
   */
  checkCommonIssues(content, filename) {
    // 检查未转义的换行符
    if (content.includes('\\r') && !content.includes('\\\\r')) {
      this.addWarning(`${filename}: 可能存在未正确转义的换行符`);
    }

    // 检查过时的 actions 版本
    const outdatedActions = [
      'actions/checkout@v1',
      'actions/checkout@v2',
      'actions/setup-node@v1',
      'actions/setup-node@v2',
      'actions/setup-python@v1',
      'actions/setup-python@v2'
    ];

    outdatedActions.forEach(action => {
      if (content.includes(action)) {
        this.addWarning(`${filename}: 使用了过时的 action: ${action}`);
      }
    });

    // 检查硬编码的密钥
    const secretPatterns = [
      /password\s*[:=]\s*["'][^"'\n\r]{8,}["']/i,
      /api[_-]?key\s*[:=]\s*["'][^"'\n\r]{20,}["']/i,
      /secret[_-]?key\s*[:=]\s*["'][^"'\n\r]{20,}["']/i,
      /token\s*[:=]\s*["'][^"'\n\r]{20,}["']/i
    ];

    secretPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        this.addError(`${filename}: 可能包含硬编码的敏感信息`);
      }
    });

    // 检查长时间运行的作业
    if (content.includes('timeout-minutes')) {
      const timeoutMatch = content.match(/timeout-minutes:\s*(\d+)/);
      if (timeoutMatch && parseInt(timeoutMatch[1]) > 60) {
        this.addWarning(`${filename}: 作业超时时间较长 (${timeoutMatch[1]} 分钟)`);
      }
    }
  }

  /**
   * 添加错误
   */
  addError(message) {
    this.errors.push(message);
    console.log(`    ❌ ${message}`);
  }

  /**
   * 添加警告
   */
  addWarning(message) {
    this.warnings.push(message);
    console.log(`    ⚠️ ${message}`);
  }

  /**
   * 打印验证结果
   */
  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 工作流验证结果');
    console.log('='.repeat(60));

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('\n🎉 所有工作流文件验证通过！');
    } else {
      if (this.errors.length > 0) {
        console.log(`\n❌ 发现 ${this.errors.length} 个错误:`);
        this.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }

      if (this.warnings.length > 0) {
        console.log(`\n⚠️ 发现 ${this.warnings.length} 个警告:`);
        this.warnings.forEach((warning, index) => {
          console.log(`  ${index + 1}. ${warning}`);
        });
      }
    }

    console.log('\n' + '='.repeat(60));
    
    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  /**
   * 尝试修复常见问题
   */
  autoFix() {
    console.log('\n🔧 尝试自动修复常见问题...');
    
    const workflowFiles = fs.readdirSync(this.workflowsDir)
      .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));

    let fixedCount = 0;

    workflowFiles.forEach(file => {
      const filePath = path.join(this.workflowsDir, file);
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;

      // 修复过时的 actions 版本
      const actionUpdates = {
        'actions/checkout@v1': 'actions/checkout@v4',
        'actions/checkout@v2': 'actions/checkout@v4',
        'actions/checkout@v3': 'actions/checkout@v4',
        'actions/setup-node@v1': 'actions/setup-node@v4',
        'actions/setup-node@v2': 'actions/setup-node@v4',
        'actions/setup-node@v3': 'actions/setup-node@v4',
        'actions/setup-python@v1': 'actions/setup-python@v5',
        'actions/setup-python@v2': 'actions/setup-python@v5',
        'actions/setup-python@v3': 'actions/setup-python@v5',
        'actions/setup-python@v4': 'actions/setup-python@v5'
      };

      Object.keys(actionUpdates).forEach(oldAction => {
        if (content.includes(oldAction)) {
          content = content.replace(new RegExp(oldAction, 'g'), actionUpdates[oldAction]);
          modified = true;
          console.log(`  ✅ ${file}: 更新 ${oldAction} -> ${actionUpdates[oldAction]}`);
        }
      });

      if (modified) {
        fs.writeFileSync(filePath, content);
        fixedCount++;
      }
    });

    if (fixedCount > 0) {
      console.log(`\n🎉 已自动修复 ${fixedCount} 个文件`);
    } else {
      console.log('\n✅ 没有发现可自动修复的问题');
    }
  }
}

// 主函数
function main() {
  const validator = new WorkflowValidator();
  
  // 检查是否需要安装依赖
  try {
    require('js-yaml');
  } catch (error) {
    console.log('📦 安装必要的依赖...');
    try {
      execSync('npm install js-yaml', { stdio: 'inherit' });
    } catch (installError) {
      console.error('❌ 安装依赖失败，请手动运行: npm install js-yaml');
      process.exit(1);
    }
  }
  
  // 检查命令行参数
  const args = process.argv.slice(2);
  const shouldAutoFix = args.includes('--fix');
  
  // 执行验证
  const isValid = validator.validateAll();
  const results = validator.printResults();
  
  // 自动修复
  if (shouldAutoFix) {
    validator.autoFix();
    
    // 重新验证
    console.log('\n🔄 重新验证修复后的文件...');
    const newValidator = new WorkflowValidator();
    newValidator.validateAll();
    newValidator.printResults();
  }
  
  // 退出码
  process.exit(results.valid ? 0 : 1);
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = WorkflowValidator;