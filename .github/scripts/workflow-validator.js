#!/usr/bin/env node
/**
 * GitHub Actions 工作流验证器 (Node.js版本)
 * 用于验证工作流配置和触发条件
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class WorkflowValidator {
    constructor(workflowsDir = '.github/workflows') {
        this.workflowsDir = workflowsDir;
        this.validationResults = {
            timestamp: new Date().toISOString(),
            workflows: {},
            summary: {
                totalWorkflows: 0,
                validWorkflows: 0,
                invalidWorkflows: 0,
                warnings: 0
            },
            globalIssues: [],
            recommendations: []
        };
    }

    loadWorkflowFile(filePath) {
        const errors = [];
        
        try {
            if (!fs.existsSync(filePath)) {
                errors.push('文件不存在');
                return { workflow: null, errors };
            }

            const content = fs.readFileSync(filePath, 'utf8');
            
            if (!content.trim()) {
                errors.push('工作流文件为空');
                return { workflow: null, errors };
            }

            try {
                const workflow = yaml.load(content);
                if (!workflow) {
                    errors.push('YAML解析结果为空');
                    return { workflow: null, errors };
                }
                
                return { workflow, errors };
                
            } catch (yamlError) {
                errors.push(`YAML语法错误: ${yamlError.message}`);
                return { workflow: null, errors };
            }
                
        } catch (error) {
            errors.push(`读取文件失败: ${error.message}`);
            return { workflow: null, errors };
        }
    }

    validateWorkflowStructure(workflow, filename) {
        const issues = [];
        
        // 检查必需字段
        const requiredFields = ['name', 'on', 'jobs'];
        for (const field of requiredFields) {
            if (!(field in workflow)) {
                issues.push({
                    type: 'error',
                    category: 'structure',
                    message: `缺少必需字段: ${field}`,
                    line: null
                });
            }
        }
        
        // 检查工作流名称
        if ('name' in workflow) {
            const name = workflow.name;
            if (typeof name !== 'string' || !name.trim()) {
                issues.push({
                    type: 'error',
                    category: 'structure',
                    message: '工作流名称不能为空',
                    line: null
                });
            } else if (name.length > 100) {
                issues.push({
                    type: 'warning',
                    category: 'structure',
                    message: '工作流名称过长 (>100字符)',
                    line: null
                });
            }
        }
        
        // 检查作业定义
        if ('jobs' in workflow) {
            const jobs = workflow.jobs;
            if (typeof jobs !== 'object' || !jobs || Array.isArray(jobs)) {
                issues.push({
                    type: 'error',
                    category: 'structure',
                    message: 'jobs字段必须是非空对象',
                    line: null
                });
            } else {
                // 检查每个作业
                for (const [jobName, jobConfig] of Object.entries(jobs)) {
                    if (typeof jobConfig !== 'object' || Array.isArray(jobConfig)) {
                        issues.push({
                            type: 'error',
                            category: 'structure',
                            message: `作业 '${jobName}' 配置必须是对象`,
                            line: null
                        });
                        continue;
                    }
                    
                    // 检查作业必需字段
                    if (!('runs-on' in jobConfig)) {
                        issues.push({
                            type: 'error',
                            category: 'structure',
                            message: `作业 '${jobName}' 缺少 runs-on 字段`,
                            line: null
                        });
                    }
                    
                    // 检查步骤定义
                    if ('steps' in jobConfig) {
                        const steps = jobConfig.steps;
                        if (!Array.isArray(steps)) {
                            issues.push({
                                type: 'error',
                                category: 'structure',
                                message: `作业 '${jobName}' 的 steps 必须是数组`,
                                line: null
                            });
                        } else if (steps.length === 0) {
                            issues.push({
                                type: 'warning',
                                category: 'structure',
                                message: `作业 '${jobName}' 没有定义步骤`,
                                line: null
                            });
                        }
                    }
                }
            }
        }
        
        return issues;
    }

    validateTriggers(workflow, filename) {
        const issues = [];
        
        if (!('on' in workflow)) {
            return issues;
        }
        
        let triggers = workflow.on;
        
        // 如果是字符串，转换为对象
        if (typeof triggers === 'string') {
            triggers = { [triggers]: {} };
        } else if (Array.isArray(triggers)) {
            const triggerObj = {};
            triggers.forEach(trigger => {
                triggerObj[trigger] = {};
            });
            triggers = triggerObj;
        }
        
        if (typeof triggers !== 'object' || Array.isArray(triggers)) {
            issues.push({
                type: 'error',
                category: 'triggers',
                message: '触发条件格式不正确',
                line: null
            });
            return issues;
        }
        
        // 检查常见触发事件
        const validEvents = [
            'push', 'pull_request', 'pull_request_target', 'schedule',
            'workflow_dispatch', 'repository_dispatch', 'release',
            'create', 'delete', 'fork', 'gollum', 'issue_comment',
            'issues', 'label', 'milestone', 'page_build', 'project',
            'project_card', 'project_column', 'public', 'pull_request_review',
            'pull_request_review_comment', 'registry_package', 'status',
            'watch', 'workflow_call', 'workflow_run'
        ];
        
        for (const [event, config] of Object.entries(triggers)) {
            if (!validEvents.includes(event)) {
                issues.push({
                    type: 'warning',
                    category: 'triggers',
                    message: `未知的触发事件: ${event}`,
                    line: null
                });
            }
            
            // 检查push和pull_request的分支配置
            if (['push', 'pull_request'].includes(event) && typeof config === 'object') {
                if ('branches' in config) {
                    const branches = config.branches;
                    if (Array.isArray(branches)) {
                        for (const branch of branches) {
                            if (typeof branch !== 'string') {
                                issues.push({
                                    type: 'error',
                                    category: 'triggers',
                                    message: `分支名称必须是字符串: ${branch}`,
                                    line: null
                                });
                            }
                        }
                    }
                }
                
                // 检查路径过滤
                if ('paths' in config) {
                    const paths = config.paths;
                    if (Array.isArray(paths)) {
                        for (const pathItem of paths) {
                            if (typeof pathItem !== 'string') {
                                issues.push({
                                    type: 'error',
                                    category: 'triggers',
                                    message: `路径必须是字符串: ${pathItem}`,
                                    line: null
                                });
                            }
                        }
                    }
                }
            }
            
            // 检查schedule配置
            if (event === 'schedule') {
                if (!Array.isArray(config)) {
                    issues.push({
                        type: 'error',
                        category: 'triggers',
                        message: 'schedule触发器必须是数组',
                        line: null
                    });
                } else {
                    for (const scheduleItem of config) {
                        if (typeof scheduleItem !== 'object' || !('cron' in scheduleItem)) {
                            issues.push({
                                type: 'error',
                                category: 'triggers',
                                message: 'schedule项目必须包含cron字段',
                                line: null
                            });
                        } else {
                            // 简单的cron表达式验证
                            const cron = scheduleItem.cron;
                            if (!this.validateCron(cron)) {
                                issues.push({
                                    type: 'error',
                                    category: 'triggers',
                                    message: `无效的cron表达式: ${cron}`,
                                    line: null
                                });
                            }
                        }
                    }
                }
            }
        }
        
        // 检查是否有合理的触发条件
        if (Object.keys(triggers).length === 0) {
            issues.push({
                type: 'warning',
                category: 'triggers',
                message: '没有定义触发条件',
                line: null
            });
        }
        
        return issues;
    }

    validateCron(cron) {
        if (typeof cron !== 'string') {
            return false;
        }
        
        const parts = cron.trim().split(/\s+/);
        if (parts.length !== 5) {
            return false;
        }
        
        // 简单验证每个部分
        for (const part of parts) {
            if (!/^[0-9*,/-]+$/.test(part)) {
                return false;
            }
        }
        
        return true;
    }

    validateActionsVersions(workflow, filename) {
        const issues = [];
        
        // 已知的过时Actions
        const deprecatedActions = {
            'actions/checkout@v1': 'actions/checkout@v4',
            'actions/checkout@v2': 'actions/checkout@v4',
            'actions/checkout@v3': 'actions/checkout@v4',
            'actions/setup-node@v1': 'actions/setup-node@v4',
            'actions/setup-node@v2': 'actions/setup-node@v4',
            'actions/setup-node@v3': 'actions/setup-node@v4',
            'actions/setup-python@v1': 'actions/setup-python@v5',
            'actions/setup-python@v2': 'actions/setup-python@v5',
            'actions/setup-python@v3': 'actions/setup-python@v5',
            'actions/setup-python@v4': 'actions/setup-python@v5',
            'actions/upload-artifact@v1': 'actions/upload-artifact@v4',
            'actions/upload-artifact@v2': 'actions/upload-artifact@v4',
            'actions/upload-artifact@v3': 'actions/upload-artifact@v4',
            'actions/download-artifact@v1': 'actions/download-artifact@v4',
            'actions/download-artifact@v2': 'actions/download-artifact@v4',
            'actions/download-artifact@v3': 'actions/download-artifact@v4'
        };
        
        const checkSteps = (steps, jobName = '') => {
            if (!Array.isArray(steps)) {
                return;
            }
            
            steps.forEach((step, index) => {
                if (typeof step !== 'object' || Array.isArray(step)) {
                    return;
                }
                
                if ('uses' in step) {
                    const action = step.uses;
                    if (action in deprecatedActions) {
                        issues.push({
                            type: 'warning',
                            category: 'actions',
                            message: `使用了过时的Action: ${action}，建议升级到 ${deprecatedActions[action]}`,
                            line: null,
                            job: jobName,
                            step: index + 1
                        });
                    }
                    
                    // 检查是否使用了SHA而不是标签
                    if (action.includes('@') && action.split('@')[1].length === 40) {
                        issues.push({
                            type: 'info',
                            category: 'actions',
                            message: `使用了SHA版本的Action: ${action}，考虑使用标签版本以提高可读性`,
                            line: null,
                            job: jobName,
                            step: index + 1
                        });
                    }
                    
                    // 检查是否使用了不安全的Action
                    if (!action.startsWith('actions/') && !action.startsWith('github/')) {
                        // 第三方Action，建议固定版本
                        if (!action.includes('@') || action.endsWith('@main') || action.endsWith('@master')) {
                            issues.push({
                                type: 'warning',
                                category: 'security',
                                message: `第三方Action未固定版本: ${action}，建议固定到特定版本`,
                                line: null,
                                job: jobName,
                                step: index + 1
                            });
                        }
                    }
                }
            });
        };
        
        if ('jobs' in workflow) {
            for (const [jobName, jobConfig] of Object.entries(workflow.jobs)) {
                if (typeof jobConfig === 'object' && 'steps' in jobConfig) {
                    checkSteps(jobConfig.steps, jobName);
                }
            }
        }
        
        return issues;
    }

    validateSecurity(workflow, filename) {
        const issues = [];
        
        // 检查权限配置
        if ('permissions' in workflow) {
            const permissions = workflow.permissions;
            if (typeof permissions === 'object') {
                // 检查是否有过度权限
                const dangerousPermissions = ['write-all', 'admin'];
                for (const [perm, value] of Object.entries(permissions)) {
                    if (dangerousPermissions.includes(value)) {
                        issues.push({
                            type: 'warning',
                            category: 'security',
                            message: `检测到高权限配置: ${perm}: ${value}`,
                            line: null
                        });
                    }
                }
            }
        }
        
        // 检查环境变量中的敏感信息
        const checkEnvVars = (envVars, context = '') => {
            if (typeof envVars !== 'object' || Array.isArray(envVars)) {
                return;
            }
            
            const sensitivePatterns = [
                /password/i, /secret/i, /key/i, /token/i, /credential/i
            ];
            
            for (const [varName, varValue] of Object.entries(envVars)) {
                if (typeof varValue === 'string') {
                    // 检查是否直接暴露敏感信息
                    for (const pattern of sensitivePatterns) {
                        if (pattern.test(varName) && !varValue.startsWith('${{')) {
                            issues.push({
                                type: 'error',
                                category: 'security',
                                message: `可能暴露敏感信息的环境变量: ${varName} ${context}`,
                                line: null
                            });
                        }
                    }
                }
            }
        };
        
        // 检查全局环境变量
        if ('env' in workflow) {
            checkEnvVars(workflow.env, '(全局)');
        }
        
        // 检查作业级别的环境变量
        if ('jobs' in workflow) {
            for (const [jobName, jobConfig] of Object.entries(workflow.jobs)) {
                if (typeof jobConfig === 'object') {
                    if ('env' in jobConfig) {
                        checkEnvVars(jobConfig.env, `(作业: ${jobName})`);
                    }
                    
                    // 检查步骤级别的环境变量
                    if ('steps' in jobConfig && Array.isArray(jobConfig.steps)) {
                        jobConfig.steps.forEach((step, index) => {
                            if (typeof step === 'object' && 'env' in step) {
                                checkEnvVars(step.env, `(作业: ${jobName}, 步骤: ${index + 1})`);
                            }
                        });
                    }
                }
            }
        }
        
        return issues;
    }

    validatePerformance(workflow, filename) {
        const issues = [];
        
        if (!('jobs' in workflow)) {
            return issues;
        }
        
        for (const [jobName, jobConfig] of Object.entries(workflow.jobs)) {
            if (typeof jobConfig !== 'object' || Array.isArray(jobConfig)) {
                continue;
            }
            
            // 检查超时配置
            if ('timeout-minutes' in jobConfig) {
                const timeout = jobConfig['timeout-minutes'];
                if (typeof timeout === 'number') {
                    if (timeout > 360) { // 6小时
                        issues.push({
                            type: 'warning',
                            category: 'performance',
                            message: `作业 '${jobName}' 超时时间过长: ${timeout}分钟`,
                            line: null
                        });
                    } else if (timeout < 5) {
                        issues.push({
                            type: 'warning',
                            category: 'performance',
                            message: `作业 '${jobName}' 超时时间过短: ${timeout}分钟`,
                            line: null
                        });
                    }
                }
            }
            
            // 检查并发配置
            if ('strategy' in jobConfig) {
                const strategy = jobConfig.strategy;
                if (typeof strategy === 'object' && 'matrix' in strategy) {
                    const matrix = strategy.matrix;
                    if (typeof matrix === 'object') {
                        // 计算矩阵大小
                        let matrixSize = 1;
                        for (const [key, values] of Object.entries(matrix)) {
                            if (Array.isArray(values)) {
                                matrixSize *= values.length;
                            }
                        }
                        
                        if (matrixSize > 20) {
                            issues.push({
                                type: 'warning',
                                category: 'performance',
                                message: `作业 '${jobName}' 矩阵过大: ${matrixSize} 个组合`,
                                line: null
                            });
                        }
                    }
                }
            }
            
            // 检查步骤数量
            if ('steps' in jobConfig && Array.isArray(jobConfig.steps)) {
                const stepCount = jobConfig.steps.length;
                if (stepCount > 50) {
                    issues.push({
                        type: 'warning',
                        category: 'performance',
                        message: `作业 '${jobName}' 步骤过多: ${stepCount} 个步骤`,
                        line: null
                    });
                }
            }
        }
        
        return issues;
    }

    validateWorkflowFile(filePath) {
        const filename = path.basename(filePath);
        const result = {
            filename,
            path: filePath,
            valid: true,
            issues: [],
            categories: {
                structure: 0,
                triggers: 0,
                actions: 0,
                security: 0,
                performance: 0
            },
            severity: {
                error: 0,
                warning: 0,
                info: 0
            }
        };
        
        // 加载工作流文件
        const { workflow, errors } = this.loadWorkflowFile(filePath);
        
        if (errors.length > 0) {
            errors.forEach(error => {
                result.issues.push({
                    type: 'error',
                    category: 'structure',
                    message: error,
                    line: null
                });
            });
            result.valid = false;
        }
        
        if (workflow) {
            // 运行各种验证
            const validators = [
                this.validateWorkflowStructure.bind(this),
                this.validateTriggers.bind(this),
                this.validateActionsVersions.bind(this),
                this.validateSecurity.bind(this),
                this.validatePerformance.bind(this)
            ];
            
            validators.forEach(validator => {
                const issues = validator(workflow, filename);
                result.issues.push(...issues);
            });
        }
        
        // 统计问题
        result.issues.forEach(issue => {
            const category = issue.category || 'other';
            const severity = issue.type || 'info';
            
            if (category in result.categories) {
                result.categories[category]++;
            }
            
            if (severity in result.severity) {
                result.severity[severity]++;
            }
            
            // 如果有错误，标记为无效
            if (severity === 'error') {
                result.valid = false;
            }
        });
        
        return result;
    }

    validateAllWorkflows() {
        console.log(`🔍 扫描工作流目录: ${this.workflowsDir}`);
        
        if (!fs.existsSync(this.workflowsDir)) {
            this.validationResults.globalIssues.push(
                `工作流目录不存在: ${this.workflowsDir}`
            );
            return this.validationResults;
        }
        
        // 查找所有YAML文件
        const files = fs.readdirSync(this.workflowsDir);
        const workflowFiles = files.filter(file => 
            file.endsWith('.yml') || file.endsWith('.yaml')
        ).map(file => path.join(this.workflowsDir, file));
        
        if (workflowFiles.length === 0) {
            this.validationResults.globalIssues.push(
                '没有找到工作流文件'
            );
            return this.validationResults;
        }
        
        console.log(`📋 找到 ${workflowFiles.length} 个工作流文件`);
        
        // 验证每个文件
        workflowFiles.forEach(filePath => {
            const filename = path.basename(filePath);
            console.log(`  🔧 验证: ${filename}`);
            const result = this.validateWorkflowFile(filePath);
            this.validationResults.workflows[filename] = result;
        });
        
        // 计算摘要
        const summary = this.validationResults.summary;
        summary.totalWorkflows = workflowFiles.length;
        
        Object.values(this.validationResults.workflows).forEach(workflowResult => {
            if (workflowResult.valid) {
                summary.validWorkflows++;
            } else {
                summary.invalidWorkflows++;
            }
            
            summary.warnings += workflowResult.severity.warning;
        });
        
        // 生成建议
        this.generateRecommendations();
        
        return this.validationResults;
    }

    generateRecommendations() {
        const recommendations = [];
        
        // 分析所有问题
        const allIssues = [];
        Object.values(this.validationResults.workflows).forEach(workflowResult => {
            allIssues.push(...workflowResult.issues);
        });
        
        // 统计问题类型
        const issueCounts = {};
        allIssues.forEach(issue => {
            const key = `${issue.category}:${issue.type}`;
            issueCounts[key] = (issueCounts[key] || 0) + 1;
        });
        
        // 生成针对性建议
        if ((issueCounts['actions:warning'] || 0) > 0) {
            recommendations.push('建议升级过时的GitHub Actions到最新版本');
        }
        
        if ((issueCounts['security:warning'] || 0) > 0) {
            recommendations.push('检查并修复安全配置问题');
        }
        
        if ((issueCounts['performance:warning'] || 0) > 0) {
            recommendations.push('优化工作流性能配置');
        }
        
        if ((issueCounts['structure:error'] || 0) > 0) {
            recommendations.push('修复工作流结构错误');
        }
        
        // 通用建议
        if (this.validationResults.summary.invalidWorkflows > 0) {
            recommendations.push('修复无效的工作流文件');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('所有工作流配置良好，无需改进');
        }
        
        this.validationResults.recommendations = recommendations;
    }

    generateReport() {
        const report = [];
        report.push('# 🔧 GitHub Actions 工作流验证报告\n');
        report.push(`**生成时间**: ${new Date().toLocaleString('zh-CN')}\n`);
        
        // 摘要
        const summary = this.validationResults.summary;
        report.push('## 📊 验证摘要\n');
        report.push(`- 总工作流数: ${summary.totalWorkflows}`);
        report.push(`- ✅ 有效工作流: ${summary.validWorkflows}`);
        report.push(`- ❌ 无效工作流: ${summary.invalidWorkflows}`);
        report.push(`- ⚠️ 警告数量: ${summary.warnings}\n`);
        
        // 全局问题
        if (this.validationResults.globalIssues.length > 0) {
            report.push('## 🚨 全局问题\n');
            this.validationResults.globalIssues.forEach(issue => {
                report.push(`- ${issue}`);
            });
            report.push('\n');
        }
        
        // 工作流详情
        if (Object.keys(this.validationResults.workflows).length > 0) {
            report.push('## 📋 工作流详情\n');
            report.push('| 文件名 | 状态 | 错误 | 警告 | 信息 | 主要问题 |');
            report.push('|--------|------|------|------|------|----------|');
            
            Object.entries(this.validationResults.workflows).forEach(([filename, result]) => {
                const status = result.valid ? '✅' : '❌';
                const errors = result.severity.error;
                const warnings = result.severity.warning;
                const infos = result.severity.info;
                
                // 获取主要问题
                const mainIssues = result.issues.slice(0, 3).map(issue => {
                    const message = issue.message;
                    return message.length > 50 ? message.substring(0, 50) + '...' : message;
                });
                
                const mainIssuesText = mainIssues.length > 0 ? mainIssues.join('; ') : '无';
                
                report.push(
                    `| ${filename} | ${status} | ${errors} | ${warnings} | ${infos} | ${mainIssuesText} |`
                );
            });
            
            report.push('\n');
        }
        
        // 建议
        if (this.validationResults.recommendations.length > 0) {
            report.push('## 💡 改进建议\n');
            this.validationResults.recommendations.forEach((rec, index) => {
                report.push(`${index + 1}. ${rec}`);
            });
            report.push('\n');
        }
        
        return report.join('\n');
    }

    saveReport(outputDir = 'validation-reports') {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // 保存JSON报告
        const jsonFile = path.join(outputDir, 'workflow-validation.json');
        fs.writeFileSync(jsonFile, JSON.stringify(this.validationResults, null, 2), 'utf8');
        
        // 保存Markdown报告
        const mdFile = path.join(outputDir, 'workflow-validation.md');
        const reportContent = this.generateReport();
        fs.writeFileSync(mdFile, reportContent, 'utf8');
        
        console.log(`\n📁 验证报告已保存到 ${outputDir}/`);
        console.log(`  - JSON报告: ${jsonFile}`);
        console.log(`  - Markdown报告: ${mdFile}`);
    }
}

// 主函数
function main() {
    const args = process.argv.slice(2);
    const workflowsDir = args.find(arg => arg.startsWith('--workflows-dir='))?.split('=')[1] || '.github/workflows';
    const outputDir = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || 'validation-reports';
    const quiet = args.includes('--quiet');
    
    // 创建验证器
    const validator = new WorkflowValidator(workflowsDir);
    
    try {
        // 运行验证
        if (!quiet) {
            console.log('🚀 开始工作流验证...\n');
        }
        
        const results = validator.validateAllWorkflows();
        
        // 保存报告
        validator.saveReport(outputDir);
        
        // 输出摘要
        const summary = results.summary;
        if (!quiet) {
            console.log('\n' + '='.repeat(50));
            console.log('📊 工作流验证摘要');
            console.log('='.repeat(50));
            console.log(`总工作流数: ${summary.totalWorkflows}`);
            console.log(`有效工作流: ${summary.validWorkflows} ✅`);
            console.log(`无效工作流: ${summary.invalidWorkflows} ❌`);
            console.log(`警告数量: ${summary.warnings} ⚠️`);
        }
        
        // 检查验证结果
        if (summary.invalidWorkflows > 0) {
            if (!quiet) {
                console.log('\n❌ 发现无效的工作流文件');
            }
            process.exit(1);
        } else if (summary.warnings > 5) {
            if (!quiet) {
                console.log('\n⚠️ 发现较多警告，建议检查');
            }
            process.exit(0);
        } else {
            if (!quiet) {
                console.log('\n✅ 所有工作流验证通过');
            }
            process.exit(0);
        }
            
    } catch (error) {
        console.error(`❌ 验证过程中发生错误: ${error.message}`);
        process.exit(1);
    }
}

// 检查是否直接运行
if (require.main === module) {
    main();
}

module.exports = WorkflowValidator;