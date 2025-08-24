const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// 验证 YAML 文件的函数
function validateYamlFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 检查是否是多文档 YAML（包含 ---）
    if (content.includes('---')) {
      // 使用 loadAll 处理多文档 YAML
      yaml.loadAll(content);
    } else {
      // 使用 load 处理单文档 YAML
      yaml.load(content);
    }
    
    return { valid: true, error: null };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// 递归查找所有 YAML 文件
function findYamlFiles(dir) {
  const yamlFiles = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 跳过 node_modules 和其他不需要的目录
        if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
          traverse(fullPath);
        }
      } else if (stat.isFile() && (item.endsWith('.yml') || item.endsWith('.yaml'))) {
        yamlFiles.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return yamlFiles;
}

// 主函数
function main() {
  console.log('🔍 开始验证 YAML 文件语法...');
  
  const projectRoot = process.cwd();
  const yamlFiles = findYamlFiles(projectRoot);
  
  console.log(`📁 找到 ${yamlFiles.length} 个 YAML 文件`);
  
  const results = {
    total: yamlFiles.length,
    valid: 0,
    invalid: 0,
    errors: []
  };
  
  for (const filePath of yamlFiles) {
    const relativePath = path.relative(projectRoot, filePath);
    const result = validateYamlFile(filePath);
    
    if (result.valid) {
      console.log(`✅ ${relativePath}`);
      results.valid++;
    } else {
      console.log(`❌ ${relativePath}: ${result.error}`);
      results.invalid++;
      results.errors.push({
        file: relativePath,
        error: result.error
      });
    }
  }
  
  console.log('\n📊 验证结果汇总:');
  console.log(`总文件数: ${results.total}`);
  console.log(`有效文件: ${results.valid}`);
  console.log(`无效文件: ${results.invalid}`);
  
  if (results.invalid > 0) {
    console.log('\n❌ 发现的错误:');
    for (const error of results.errors) {
      console.log(`  - ${error.file}: ${error.error}`);
    }
    
    // 保存错误报告
    const reportPath = path.join(projectRoot, 'yaml-validation-errors.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 错误报告已保存到: ${reportPath}`);
    
    process.exit(1);
  } else {
    console.log('\n🎉 所有 YAML 文件语法正确!');
    process.exit(0);
  }
}

// 检查是否安装了 js-yaml
try {
  require('js-yaml');
  main();
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    console.log('❌ 缺少依赖: js-yaml');
    console.log('请运行: npm install js-yaml');
    process.exit(1);
  } else {
    throw error;
  }
}