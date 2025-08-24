#!/usr/bin/env node
/**
 * YAML 文件语法验证器
 * 用于检查 .github 目录下所有 YAML 文件的语法正确性
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class YAMLValidator {
    constructor(githubDir) {
        this.githubDir = githubDir;
        this.validationResults = {
            totalFiles: 0,
            validFiles: 0,
            invalidFiles: 0,
            errors: [],
            warnings: [],
            fileDetails: {}
        };
    }

    /**
     * 递归查找所有 YAML 文件
     */
    findYamlFiles(dir = this.githubDir) {
        const yamlFiles = [];
        
        const scanDirectory = (currentDir) => {
            try {
                const items = fs.readdirSync(currentDir);
                
                for (const item of items) {
                    const fullPath = path.join(currentDir, item);
                    const stat = fs.statSync(fullPath);
                    
                    if (stat.isDirectory()) {
                        scanDirectory(fullPath);
                    } else if (stat.isFile() && (item.endsWith('.yml') || item.endsWith('.yaml'))) {
                        yamlFiles.push(fullPath);
                    }
                }
            } catch (error) {
                console.error(`扫描目录 ${currentDir} 时出错:`, error.message);
            }
        };
        
        scanDirectory(dir);
        return yamlFiles.sort();
    }

    /**
     * 验证单个 YAML 文件的语法
     */
    validateYamlSyntax(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // 检查文件是否为空
            if (!content.trim()) {
                return { isValid: false, message: '文件为空', data: null };
            }
            
            // 解析 YAML
            const parsedData = yaml.load(content);
            
            // 检查解析结果
            if (parsedData === null || parsedData === undefined) {
                return { isValid: false, message: 'YAML 解析结果为空', data: null };
            }
            
            return { isValid: true, message: '语法正确', data: parsedData };
            
        } catch (error) {
            if (error instanceof yaml.YAMLException) {
                return { isValid: false, message: `YAML 语法错误: ${error.message}`, data: null };
            } else if (error.code === 'ENOENT') {
                return { isValid: false, message: '文件不存在', data: null };
            } else {
                return { isValid: false, message: `读取文件失败: ${error.message}`, data: null };
            }
        }
    }

    /**
     * 检查工作流文件的结构
     */
    checkWorkflowStructure(data, filePath) {
        const warnings = [];
        
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
            warnings.push('工作流文件应该是一个对象结构');
            return warnings;
        }
        
        // 检查必需的顶级键
        if (!data.on && !data.true) {
            warnings.push("缺少触发条件 'on' 或 'true'");
        }
        
        if (!data.jobs) {
            warnings.push("缺少 'jobs' 定义");
        }
        
        // 检查 jobs 结构
        if (data.jobs && typeof data.jobs === 'object') {
            for (const [jobName, jobConfig] of Object.entries(data.jobs)) {
                if (typeof jobConfig !== 'object' || jobConfig === null) {
                    warnings.push(`作业 '${jobName}' 配置应该是对象`);
                    continue;
                }
                
                if (!jobConfig['runs-on']) {
                    warnings.push(`作业 '${jobName}' 缺少 'runs-on' 配置`);
                }
                
                if (!jobConfig.steps) {
                    warnings.push(`作业 '${jobName}' 缺少 'steps' 配置`);
                } else if (Array.isArray(jobConfig.steps)) {
                    jobConfig.steps.forEach((step, index) => {
                        if (typeof step !== 'object' || step === null) {
                            warnings.push(`作业 '${jobName}' 的步骤 ${index + 1} 应该是对象`);
                        } else if (!step.name && !step.uses && !step.run) {
                            warnings.push(`作业 '${jobName}' 的步骤 ${index + 1} 缺少必要的操作`);
                        }
                    });
                }
            }
        }
        
        return warnings;
    }

    /**
     * 检查重复键
     */
    checkDuplicateKeys(filePath) {
        const warnings = [];
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            const levelKeys = new Map();
            
            lines.forEach((line, lineNum) => {
                const stripped = line.trim();
                if (stripped.includes(':') && !stripped.startsWith('#')) {
                    // 提取键名
                    const keyPart = stripped.split(':')[0].trim();
                    if (keyPart && !keyPart.startsWith('-')) {
                        // 计算缩进级别
                        const indentLevel = line.length - line.trimStart().length;
                        const levelKey = `${indentLevel}:${keyPart}`;
                        
                        if (levelKeys.has(levelKey)) {
                            warnings.push(`第 ${lineNum + 1} 行: 可能存在重复键 '${keyPart}'`);
                        } else {
                            levelKeys.set(levelKey, lineNum + 1);
                        }
                    }
                }
            });
        } catch (error) {
            warnings.push(`检查重复键时出错: ${error.message}`);
        }
        
        return warnings;
    }

    /**
     * 验证单个文件
     */
    validateFile(filePath) {
        const relativePath = path.relative(this.githubDir, filePath);
        
        // 验证语法
        const syntaxResult = this.validateYamlSyntax(filePath);
        
        const result = {
            path: relativePath,
            isValid: syntaxResult.isValid,
            message: syntaxResult.message,
            warnings: [],
            errors: []
        };
        
        if (!syntaxResult.isValid) {
            result.errors.push(syntaxResult.message);
            this.validationResults.errors.push({
                file: relativePath,
                error: syntaxResult.message
            });
        } else {
            // 如果是工作流文件，进行额外检查
            if (path.basename(path.dirname(filePath)) === 'workflows') {
                const workflowWarnings = this.checkWorkflowStructure(syntaxResult.data, filePath);
                result.warnings.push(...workflowWarnings);
                
                workflowWarnings.forEach(warning => {
                    this.validationResults.warnings.push({
                        file: relativePath,
                        warning: warning
                    });
                });
            }
            
            // 检查重复键
            const duplicateWarnings = this.checkDuplicateKeys(filePath);
            result.warnings.push(...duplicateWarnings);
            
            duplicateWarnings.forEach(warning => {
                this.validationResults.warnings.push({
                    file: relativePath,
                    warning: warning
                });
            });
        }
        
        return result;
    }

    /**
     * 验证所有 YAML 文件
     */
    validateAll() {
        const yamlFiles = this.findYamlFiles();
        this.validationResults.totalFiles = yamlFiles.length;
        
        console.log(`找到 ${yamlFiles.length} 个 YAML 文件`);
        
        yamlFiles.forEach(filePath => {
            const relativePath = path.relative(this.githubDir, filePath);
            console.log(`验证: ${relativePath}`);
            
            const result = this.validateFile(filePath);
            this.validationResults.fileDetails[relativePath] = result;
            
            if (result.isValid) {
                this.validationResults.validFiles++;
                console.log(`  ✅ ${result.message}`);
            } else {
                this.validationResults.invalidFiles++;
                console.log(`  ❌ ${result.message}`);
            }
            
            if (result.warnings.length > 0) {
                result.warnings.forEach(warning => {
                    console.log(`  ⚠️  ${warning}`);
                });
            }
        });
        
        return this.validationResults;
    }

    /**
     * 生成验证报告
     */
    generateReport() {
        const results = this.validationResults;
        const report = [];
        
        report.push('# YAML 文件验证报告');
        report.push('');
        report.push('## 总体统计');
        report.push(`- 总文件数: ${results.totalFiles}`);
        report.push(`- 有效文件: ${results.validFiles} ✅`);
        report.push(`- 无效文件: ${results.invalidFiles} ❌`);
        report.push(`- 警告数量: ${results.warnings.length} ⚠️`);
        report.push('');
        
        if (results.errors.length > 0) {
            report.push('## 错误详情');
            results.errors.forEach(error => {
                report.push(`- **${error.file}**: ${error.error}`);
            });
            report.push('');
        }
        
        if (results.warnings.length > 0) {
            report.push('## 警告详情');
            results.warnings.forEach(warning => {
                report.push(`- **${warning.file}**: ${warning.warning}`);
            });
            report.push('');
        }
        
        report.push('## 文件详情');
        Object.entries(results.fileDetails).forEach(([filePath, details]) => {
            const status = details.isValid ? '✅' : '❌';
            report.push(`### ${status} ${filePath}`);
            report.push(`- 状态: ${details.message}`);
            
            if (details.warnings.length > 0) {
                report.push('- 警告:');
                details.warnings.forEach(warning => {
                    report.push(`  - ${warning}`);
                });
            }
            
            if (details.errors.length > 0) {
                report.push('- 错误:');
                details.errors.forEach(error => {
                    report.push(`  - ${error}`);
                });
            }
            
            report.push('');
        });
        
        return report.join('\n');
    }

    /**
     * 保存验证结果到 JSON 文件
     */
    saveResults(outputFile = 'yaml-validation-results.json') {
        fs.writeFileSync(outputFile, JSON.stringify(this.validationResults, null, 2), 'utf8');
        console.log(`验证结果已保存到: ${outputFile}`);
    }
}

// 主函数
function main() {
    const githubDir = process.argv[2] || '.github';
    
    if (!fs.existsSync(githubDir)) {
        console.error(`错误: 目录 ${githubDir} 不存在`);
        process.exit(1);
    }
    
    console.log(`开始验证 ${githubDir} 目录下的 YAML 文件...`);
    console.log('='.repeat(50));
    
    const validator = new YAMLValidator(githubDir);
    const results = validator.validateAll();
    
    console.log('\n' + '='.repeat(50));
    console.log('验证完成!');
    console.log(`总计: ${results.totalFiles} 个文件`);
    console.log(`有效: ${results.validFiles} 个 ✅`);
    console.log(`无效: ${results.invalidFiles} 个 ❌`);
    console.log(`警告: ${results.warnings.length} 个 ⚠️`);
    
    // 保存结果
    validator.saveResults();
    
    // 生成报告
    const report = validator.generateReport();
    fs.writeFileSync('yaml-validation-report.md', report, 'utf8');
    console.log('验证报告已保存到: yaml-validation-report.md');
    
    // 如果有错误，返回非零退出码
    if (results.invalidFiles > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

// 检查是否直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = YAMLValidator;