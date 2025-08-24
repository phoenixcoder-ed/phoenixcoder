#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * 验证工作流文件中引用的脚本是否存在
 */
class ScriptReferenceValidator {
  constructor() {
    this.issues = [];
    this.checkedFiles = new Set();
    this.scriptReferences = [];
  }

  /**
   * 验证所有工作流文件
   */
  async validateAllWorkflows() {
    console.log('🔍 验证工作流文件中的脚本引用...');
    
    const workflowsDir = path.join(process.cwd(), '.github/workflows');
    const scriptsDir = path.join(process.cwd(), '.github/scripts');
    
    if (!fs.existsSync(workflowsDir)) {
      this.issues.push({
        type: 'missing_directory',
        path: workflowsDir,
        severity: 'error',
        message: 'workflows 目录不存在'
      });
      return;
    }

    // 获取所有工作流文件
    const workflowFiles = fs.readdirSync(workflowsDir)
      .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
      .map(file => path.join(workflowsDir, file));

    console.log(`📁 找到 ${workflowFiles.length} 个工作流文件`);

    // 验证每个工作流文件
    for (const workflowFile of workflowFiles) {
      await this.validateWorkflowFile(workflowFile);
    }

    // 检查脚本目录
    if (fs.existsSync(scriptsDir)) {
      await this.validateScriptsDirectory(scriptsDir);
    }

    return {
      issues: this.issues,
      scriptReferences: this.scriptReferences,
      isValid: this.issues.filter(issue => issue.severity === 'error').length === 0
    };
  }

  /**
   * 验证单个工作流文件
   */
  async validateWorkflowFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const workflow = yaml.load(content);
      const fileName = path.basename(filePath);
      
      console.log(`📄 检查文件: ${fileName}`);
      
      // 检查工作流中的脚本引用
      this.extractScriptReferences(workflow, fileName, '');
      
    } catch (error) {
      this.issues.push({
        type: 'parse_error',
        path: filePath,
        severity: 'error',
        message: `解析 YAML 文件失败: ${error.message}`
      });
    }
  }

  /**
   * 提取脚本引用
   */
  extractScriptReferences(obj, fileName, path) {
    if (typeof obj !== 'object' || obj === null) {
      return;
    }

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        this.extractScriptReferences(item, fileName, `${path}[${index}]`);
      });
      return;
    }

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      // 检查 run 命令中的脚本引用
      if (key === 'run' && typeof value === 'string') {
        this.analyzeRunCommand(value, fileName, currentPath);
      }
      
      // 检查 uses 中的本地 action 引用
      if (key === 'uses' && typeof value === 'string' && value.startsWith('./')) {
        this.validateLocalAction(value, fileName, currentPath);
      }
      
      // 检查 script 或 scripts 键
      if ((key === 'script' || key === 'scripts') && typeof value === 'string') {
        this.validateScriptPath(value, fileName, currentPath);
      }
      
      // 递归检查
      if (typeof value === 'object') {
        this.extractScriptReferences(value, fileName, currentPath);
      }
    }
  }

  /**
   * 分析 run 命令
   */
  analyzeRunCommand(command, fileName, path) {
    // 检查是否引用了脚本文件
    const scriptPatterns = [
      /python\s+([^\s]+\.py)/g,
      /node\s+([^\s]+\.js)/g,
      /bash\s+([^\s]+\.sh)/g,
      /sh\s+([^\s]+\.sh)/g,
      /\.\/([\.\w\/\-]+\.(py|js|sh|ts))/g,
      /\$\{\{\s*github\.workspace\s*\}\}\/([^\s]+\.(py|js|sh|ts))/g
    ];

    for (const pattern of scriptPatterns) {
      let match;
      while ((match = pattern.exec(command)) !== null) {
        const scriptPath = match[1];
        this.scriptReferences.push({
          file: fileName,
          path: path,
          scriptPath: scriptPath,
          command: command.trim()
        });
        
        this.validateScriptPath(scriptPath, fileName, path);
      }
    }
  }

  /**
   * 验证本地 Action 引用
   */
  validateLocalAction(actionPath, fileName, path) {
    const fullPath = path.resolve(process.cwd(), actionPath);
    
    if (!fs.existsSync(fullPath)) {
      this.issues.push({
        type: 'missing_local_action',
        path: actionPath,
        file: fileName,
        location: path,
        severity: 'error',
        message: `本地 Action 不存在: ${actionPath}`
      });
    } else {
      // 检查 action.yml 文件
      const actionYml = path.join(fullPath, 'action.yml');
      const actionYaml = path.join(fullPath, 'action.yaml');
      
      if (!fs.existsSync(actionYml) && !fs.existsSync(actionYaml)) {
        this.issues.push({
          type: 'missing_action_definition',
          path: actionPath,
          file: fileName,
          location: path,
          severity: 'error',
          message: `Action 定义文件不存在: ${actionPath}/action.yml`
        });
      }
    }
  }

  /**
   * 验证脚本路径
   */
  validateScriptPath(scriptPath, fileName, location) {
    // 处理相对路径
    let fullPath;
    if (scriptPath.startsWith('./')) {
      fullPath = path.resolve(process.cwd(), scriptPath);
    } else if (scriptPath.startsWith('/')) {
      fullPath = scriptPath;
    } else {
      // 假设是相对于项目根目录
      fullPath = path.resolve(process.cwd(), scriptPath);
    }

    if (!fs.existsSync(fullPath)) {
      this.issues.push({
        type: 'missing_script',
        path: scriptPath,
        fullPath: fullPath,
        file: fileName,
        location: location,
        severity: 'error',
        message: `脚本文件不存在: ${scriptPath}`
      });
    } else {
      // 检查文件是否可执行（对于 .sh 文件）
      if (scriptPath.endsWith('.sh')) {
        try {
          const stats = fs.statSync(fullPath);
          if (!(stats.mode & parseInt('111', 8))) {
            this.issues.push({
              type: 'script_not_executable',
              path: scriptPath,
              fullPath: fullPath,
              file: fileName,
              location: location,
              severity: 'warning',
              message: `脚本文件不可执行: ${scriptPath}`
            });
          }
        } catch (error) {
          this.issues.push({
            type: 'script_access_error',
            path: scriptPath,
            fullPath: fullPath,
            file: fileName,
            location: location,
            severity: 'warning',
            message: `无法检查脚本权限: ${error.message}`
          });
        }
      }
    }
  }

  /**
   * 验证脚本目录
   */
  async validateScriptsDirectory(scriptsDir) {
    console.log('📁 检查脚本目录...');
    
    const scriptFiles = fs.readdirSync(scriptsDir, { recursive: true })
      .filter(file => {
        const ext = path.extname(file);
        return ['.py', '.js', '.sh', '.ts'].includes(ext);
      });

    console.log(`📄 找到 ${scriptFiles.length} 个脚本文件`);

    for (const scriptFile of scriptFiles) {
      const fullPath = path.join(scriptsDir, scriptFile);
      const stats = fs.statSync(fullPath);
      
      // 检查 shell 脚本的可执行权限
      if (scriptFile.endsWith('.sh') && !(stats.mode & parseInt('111', 8))) {
        this.issues.push({
          type: 'script_not_executable',
          path: scriptFile,
          fullPath: fullPath,
          severity: 'warning',
          message: `脚本文件不可执行: ${scriptFile}`
        });
      }
    }
  }
}

/**
 * 主函数
 */
async function main() {
  const validator = new ScriptReferenceValidator();
  const result = await validator.validateAllWorkflows();

  console.log('\n📊 验证结果:');
  console.log('='.repeat(50));
  
  if (result.issues.length === 0) {
    console.log('✅ 所有脚本引用都有效');
  } else {
    const errors = result.issues.filter(issue => issue.severity === 'error');
    const warnings = result.issues.filter(issue => issue.severity === 'warning');
    
    console.log(`❌ 发现 ${errors.length} 个错误, ${warnings.length} 个警告`);
    
    if (errors.length > 0) {
      console.log('\n🚨 错误:');
      errors.forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.type}`);
        console.log(`   文件: ${issue.file || 'N/A'}`);
        console.log(`   路径: ${issue.path}`);
        console.log(`   位置: ${issue.location || 'N/A'}`);
        console.log(`   消息: ${issue.message}`);
      });
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️  警告:');
      warnings.forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.type}`);
        console.log(`   文件: ${issue.file || 'N/A'}`);
        console.log(`   路径: ${issue.path}`);
        console.log(`   位置: ${issue.location || 'N/A'}`);
        console.log(`   消息: ${issue.message}`);
      });
    }
  }

  if (result.scriptReferences.length > 0) {
    console.log('\n📋 发现的脚本引用:');
    console.log('='.repeat(50));
    result.scriptReferences.forEach((ref, index) => {
      console.log(`${index + 1}. ${ref.scriptPath}`);
      console.log(`   文件: ${ref.file}`);
      console.log(`   位置: ${ref.path}`);
      console.log(`   命令: ${ref.command}`);
      console.log('');
    });
  }

  // 保存验证结果
  const reportPath = path.join(process.cwd(), 'script-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
  console.log(`📄 详细报告已保存到: ${reportPath}`);

  console.log('\n✅ 脚本引用验证完成!');
  
  return result.isValid;
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ScriptReferenceValidator;