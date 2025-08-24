#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * 分析 YAML 文件中的重复键问题
 */
class DuplicateKeyAnalyzer {
  constructor() {
    this.issues = [];
    this.suggestions = [];
  }

  /**
   * 分析 badges.yml 文件
   */
  analyzeBadgesFile(filePath) {
    console.log('🔍 分析 badges.yml 文件中的重复键问题...');
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = yaml.load(content);
      
      // 分析结构
      this.analyzeStructure(data, '', []);
      
      // 生成优化建议
      this.generateOptimizationSuggestions(data);
      
      return {
        issues: this.issues,
        suggestions: this.suggestions,
        isValid: this.issues.length === 0
      };
    } catch (error) {
      console.error('❌ 分析文件时出错:', error.message);
      return { issues: [error.message], suggestions: [], isValid: false };
    }
  }

  /**
   * 递归分析 YAML 结构
   */
  analyzeStructure(obj, path, parentKeys) {
    if (typeof obj !== 'object' || obj === null) {
      return;
    }

    const currentKeys = Object.keys(obj);
    
    // 检查当前层级的重复键
    const duplicates = this.findDuplicatesInArray(currentKeys);
    if (duplicates.length > 0) {
      this.issues.push({
        type: 'duplicate_keys_same_level',
        path: path,
        keys: duplicates,
        severity: 'error'
      });
    }

    // 检查与父级的键名冲突
    const conflicts = currentKeys.filter(key => parentKeys.includes(key));
    if (conflicts.length > 0) {
      this.issues.push({
        type: 'key_conflicts_with_parent',
        path: path,
        keys: conflicts,
        severity: 'warning'
      });
    }

    // 递归检查子对象
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        const newPath = path ? `${path}.${key}` : key;
        const newParentKeys = [...parentKeys, ...currentKeys];
        this.analyzeStructure(value, newPath, newParentKeys);
      }
    }
  }

  /**
   * 查找数组中的重复项
   */
  findDuplicatesInArray(arr) {
    const seen = new Set();
    const duplicates = new Set();
    
    for (const item of arr) {
      if (seen.has(item)) {
        duplicates.add(item);
      } else {
        seen.add(item);
      }
    }
    
    return Array.from(duplicates);
  }

  /**
   * 生成优化建议
   */
  generateOptimizationSuggestions(data) {
    // 分析常见的重复模式
    const commonKeys = this.findCommonKeyPatterns(data);
    
    if (commonKeys.label && commonKeys.label.length > 5) {
      this.suggestions.push({
        type: 'extract_common_config',
        description: '考虑将常用的 label 配置提取到公共配置中',
        keys: ['label'],
        benefit: '减少重复配置，提高维护性'
      });
    }

    if (commonKeys.colors && commonKeys.colors.length > 3) {
      this.suggestions.push({
        type: 'standardize_colors',
        description: '标准化颜色配置，使用统一的颜色主题',
        keys: ['colors'],
        benefit: '确保视觉一致性，简化配置'
      });
    }

    if (commonKeys.logo && commonKeys.logo.length > 5) {
      this.suggestions.push({
        type: 'centralize_logos',
        description: '集中管理 logo 配置',
        keys: ['logo'],
        benefit: '统一图标管理，便于更新'
      });
    }
  }

  /**
   * 查找常见的键模式
   */
  findCommonKeyPatterns(obj, patterns = {}) {
    if (typeof obj !== 'object' || obj === null) {
      return patterns;
    }

    for (const [key, value] of Object.entries(obj)) {
      if (!patterns[key]) {
        patterns[key] = [];
      }
      patterns[key].push(value);

      if (typeof value === 'object' && value !== null) {
        this.findCommonKeyPatterns(value, patterns);
      }
    }

    return patterns;
  }

  /**
   * 生成修复建议的 YAML 结构
   */
  generateOptimizedStructure(data) {
    const optimized = {
      // 公共配置
      common_config: {
        default_colors: {
          success: '#28a745',
          warning: '#ffc107',
          error: '#dc3545',
          info: '#17a2b8',
          primary: '#007bff',
          secondary: '#6c757d'
        },
        default_logos: {
          github: 'github',
          nodejs: 'node.js',
          python: 'python',
          typescript: 'typescript'
        },
        default_formats: {
          percentage: '{value}%',
          time: '{value}ms',
          count: '{value:,}'
        }
      },
      
      // 保持原有结构，但引用公共配置
      ...data
    };

    return optimized;
  }
}

/**
 * 主函数
 */
async function main() {
  const badgesFilePath = path.join(process.cwd(), '.github/config/badges.yml');
  
  if (!fs.existsSync(badgesFilePath)) {
    console.error('❌ badges.yml 文件不存在:', badgesFilePath);
    process.exit(1);
  }

  const analyzer = new DuplicateKeyAnalyzer();
  const result = analyzer.analyzeBadgesFile(badgesFilePath);

  console.log('\n📊 分析结果:');
  console.log('='.repeat(50));
  
  if (result.issues.length === 0) {
    console.log('✅ 未发现严重的重复键问题');
  } else {
    console.log(`⚠️  发现 ${result.issues.length} 个问题:`);
    result.issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.type}`);
      console.log(`   路径: ${issue.path || 'root'}`);
      console.log(`   键名: ${issue.keys.join(', ')}`);
      console.log(`   严重程度: ${issue.severity}`);
    });
  }

  if (result.suggestions.length > 0) {
    console.log('\n💡 优化建议:');
    console.log('='.repeat(50));
    result.suggestions.forEach((suggestion, index) => {
      console.log(`\n${index + 1}. ${suggestion.description}`);
      console.log(`   类型: ${suggestion.type}`);
      console.log(`   涉及键: ${suggestion.keys.join(', ')}`);
      console.log(`   好处: ${suggestion.benefit}`);
    });
  }

  // 保存分析结果
  const reportPath = path.join(process.cwd(), 'duplicate-key-analysis.json');
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
  console.log(`\n📄 详细报告已保存到: ${reportPath}`);

  // 生成优化后的结构示例
  if (result.suggestions.length > 0) {
    try {
      const originalData = yaml.load(fs.readFileSync(badgesFilePath, 'utf8'));
      const optimizedStructure = analyzer.generateOptimizedStructure(originalData);
      
      const optimizedPath = path.join(process.cwd(), 'badges-optimized-example.yml');
      fs.writeFileSync(optimizedPath, yaml.dump(optimizedStructure, {
        indent: 2,
        lineWidth: 120,
        noRefs: true
      }));
      console.log(`📄 优化结构示例已保存到: ${optimizedPath}`);
    } catch (error) {
      console.error('⚠️  生成优化示例时出错:', error.message);
    }
  }

  console.log('\n✅ 重复键分析完成!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DuplicateKeyAnalyzer;