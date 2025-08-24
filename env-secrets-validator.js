#!/usr/bin/env node

/**
 * 环境变量和密钥配置验证器
 * 检查GitHub Actions工作流文件中的环境变量和密钥配置
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// 颜色定义
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// 日志函数
function logInfo(msg) {
    console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`);
}

function logSuccess(msg) {
    console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`);
}

function logWarning(msg) {
    console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`);
}

function logError(msg) {
    console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`);
}

function logCheck(msg) {
    console.log(`${colors.magenta}[CHECK]${colors.reset} ${msg}`);
}

// 常见的环境变量和密钥模式
const ENV_PATTERNS = {
    // GitHub相关
    github: [
        'GITHUB_TOKEN',
        'GITHUB_ACTOR',
        'GITHUB_REPOSITORY',
        'GITHUB_REF',
        'GITHUB_SHA',
        'GITHUB_WORKSPACE',
        'GITHUB_EVENT_NAME',
        'GITHUB_RUN_ID',
        'GITHUB_RUN_NUMBER'
    ],
    
    // 部署相关
    deployment: [
        'DEPLOY_KEY',
        'SSH_PRIVATE_KEY',
        'SSH_HOST',
        'SSH_USERNAME',
        'DEPLOY_HOST',
        'DEPLOY_USER',
        'DEPLOY_PATH'
    ],
    
    // 云服务相关
    cloud: [
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'AWS_REGION',
        'AZURE_CREDENTIALS',
        'GCP_SA_KEY',
        'DOCKER_USERNAME',
        'DOCKER_PASSWORD',
        'DOCKER_TOKEN'
    ],
    
    // 通知相关
    notification: [
        'SLACK_WEBHOOK',
        'SLACK_TOKEN',
        'DISCORD_WEBHOOK',
        'EMAIL_USERNAME',
        'EMAIL_PASSWORD',
        'TELEGRAM_TOKEN',
        'TELEGRAM_CHAT_ID'
    ],
    
    // 代码质量相关
    quality: [
        'SONAR_TOKEN',
        'CODECOV_TOKEN',
        'CODECLIMATE_REPO_TOKEN'
    ],
    
    // 数据库相关
    database: [
        'DATABASE_URL',
        'DB_HOST',
        'DB_USER',
        'DB_PASSWORD',
        'DB_NAME',
        'REDIS_URL',
        'MONGODB_URI'
    ]
};

// 敏感信息模式
const SENSITIVE_PATTERNS = [
    /password/i,
    /secret/i,
    /token/i,
    /key/i,
    /credential/i,
    /auth/i,
    /api[_-]?key/i,
    /private[_-]?key/i,
    /access[_-]?key/i
];

class EnvSecretsValidator {
    constructor() {
        this.workflowsDir = '.github/workflows';
        this.issues = [];
        this.envVars = new Set();
        this.secrets = new Set();
        this.recommendations = [];
    }
    
    /**
     * 获取所有工作流文件
     */
    getWorkflowFiles() {
        try {
            if (!fs.existsSync(this.workflowsDir)) {
                logError(`工作流目录不存在: ${this.workflowsDir}`);
                return [];
            }
            
            const files = fs.readdirSync(this.workflowsDir)
                .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
                .map(file => path.join(this.workflowsDir, file));
            
            logInfo(`找到 ${files.length} 个工作流文件`);
            return files;
        } catch (error) {
            logError(`读取工作流目录失败: ${error.message}`);
            return [];
        }
    }
    
    /**
     * 解析YAML文件
     */
    parseYamlFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return yaml.load(content);
        } catch (error) {
            this.issues.push({
                file: filePath,
                type: 'parse_error',
                message: `YAML解析失败: ${error.message}`,
                severity: 'error'
            });
            return null;
        }
    }
    
    /**
     * 提取环境变量和密钥引用
     */
    extractEnvAndSecrets(obj, filePath, path = '') {
        if (!obj || typeof obj !== 'object') {
            return;
        }
        
        if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
                this.extractEnvAndSecrets(item, filePath, `${path}[${index}]`);
            });
            return;
        }
        
        for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key;
            
            // 检查环境变量定义
            if (key === 'env' && typeof value === 'object') {
                this.checkEnvDefinitions(value, filePath, currentPath);
            }
            
            // 检查字符串值中的变量引用
            if (typeof value === 'string') {
                this.checkStringForReferences(value, filePath, currentPath);
            }
            
            // 递归检查嵌套对象
            if (typeof value === 'object') {
                this.extractEnvAndSecrets(value, filePath, currentPath);
            }
        }
    }
    
    /**
     * 检查环境变量定义
     */
    checkEnvDefinitions(envObj, filePath, path) {
        for (const [envName, envValue] of Object.entries(envObj)) {
            this.envVars.add(envName);
            
            // 检查是否为硬编码的敏感信息
            if (typeof envValue === 'string' && this.isSensitiveValue(envValue)) {
                this.issues.push({
                    file: filePath,
                    type: 'hardcoded_secret',
                    path: `${path}.${envName}`,
                    message: `可能包含硬编码的敏感信息: ${envName}`,
                    severity: 'error',
                    value: envValue
                });
            }
            
            // 检查敏感变量是否使用了secrets
            if (this.isSensitiveName(envName) && typeof envValue === 'string' && !envValue.includes('secrets.')) {
                this.issues.push({
                    file: filePath,
                    type: 'insecure_env',
                    path: `${path}.${envName}`,
                    message: `敏感环境变量应使用secrets: ${envName}`,
                    severity: 'warning',
                    recommendation: `使用 \${{ secrets.${envName} }} 替代直接赋值`
                });
            }
        }
    }
    
    /**
     * 检查字符串中的变量引用
     */
    checkStringForReferences(str, filePath, path) {
        // 检查secrets引用
        const secretMatches = str.match(/\$\{\{\s*secrets\.([A-Z_][A-Z0-9_]*)\s*\}\}/g);
        if (secretMatches) {
            secretMatches.forEach(match => {
                const secretName = match.match(/secrets\.([A-Z_][A-Z0-9_]*)/)[1];
                this.secrets.add(secretName);
            });
        }
        
        // 检查环境变量引用
        const envMatches = str.match(/\$\{\{\s*env\.([A-Z_][A-Z0-9_]*)\s*\}\}/g);
        if (envMatches) {
            envMatches.forEach(match => {
                const envName = match.match(/env\.([A-Z_][A-Z0-9_]*)/)[1];
                this.envVars.add(envName);
            });
        }
        
        // 检查可能的硬编码密钥
        if (this.containsHardcodedSecret(str)) {
            this.issues.push({
                file: filePath,
                type: 'potential_hardcoded_secret',
                path: path,
                message: '可能包含硬编码的密钥或令牌',
                severity: 'warning',
                value: str.length > 50 ? str.substring(0, 50) + '...' : str
            });
        }
    }
    
    /**
     * 检查是否为敏感变量名
     */
    isSensitiveName(name) {
        return SENSITIVE_PATTERNS.some(pattern => pattern.test(name));
    }
    
    /**
     * 检查是否为敏感值
     */
    isSensitiveValue(value) {
        if (typeof value !== 'string') return false;
        
        // 检查是否像API密钥或令牌
        const patterns = [
            /^[a-f0-9]{32,}$/i,  // 十六进制字符串
            /^[A-Za-z0-9+/]{20,}={0,2}$/,  // Base64编码
            /^sk-[a-zA-Z0-9]{20,}$/,  // OpenAI API密钥格式
            /^ghp_[a-zA-Z0-9]{36}$/,  // GitHub个人访问令牌
            /^ghs_[a-zA-Z0-9]{36}$/,  // GitHub服务器令牌
        ];
        
        return patterns.some(pattern => pattern.test(value));
    }
    
    /**
     * 检查是否包含硬编码密钥
     */
    containsHardcodedSecret(str) {
        // 检查常见的密钥格式
        const secretPatterns = [
            /-----BEGIN [A-Z ]+-----/,  // PEM格式密钥
            /['"]?[a-f0-9]{32,}['"]?/i,  // 长十六进制字符串
            /['"]?[A-Za-z0-9+/]{40,}={0,2}['"]?/,  // 长Base64字符串
        ];
        
        return secretPatterns.some(pattern => pattern.test(str));
    }
    
    /**
     * 检查缺失的环境变量
     */
    checkMissingEnvVars(workflow, filePath) {
        // 检查常见的必需环境变量
        const requiredEnvVars = {
            'ci.yml': ['NODE_VERSION'],
            'deploy.yml': ['DEPLOY_HOST', 'DEPLOY_USER'],
            'test.yml': ['NODE_VERSION'],
            'security.yml': ['SECURITY_SCAN_TOKEN']
        };
        
        const fileName = path.basename(filePath);
        const required = requiredEnvVars[fileName] || [];
        
        required.forEach(envVar => {
            if (!this.envVars.has(envVar) && !this.secrets.has(envVar)) {
                this.issues.push({
                    file: filePath,
                    type: 'missing_env_var',
                    message: `缺少必需的环境变量: ${envVar}`,
                    severity: 'warning',
                    recommendation: `添加环境变量 ${envVar} 到工作流配置中`
                });
            }
        });
    }
    
    /**
     * 检查权限配置
     */
    checkPermissions(workflow, filePath) {
        if (!workflow.permissions) {
            // 检查是否需要特殊权限
            const workflowStr = JSON.stringify(workflow);
            
            if (workflowStr.includes('secrets.GITHUB_TOKEN') || workflowStr.includes('github.token')) {
                this.issues.push({
                    file: filePath,
                    type: 'missing_permissions',
                    message: '使用GITHUB_TOKEN但未定义permissions',
                    severity: 'warning',
                    recommendation: '添加适当的permissions配置以遵循最小权限原则'
                });
            }
        } else {
            // 检查权限配置是否合理
            const permissions = workflow.permissions;
            
            if (permissions === 'write-all' || (typeof permissions === 'object' && Object.values(permissions).includes('write'))) {
                this.issues.push({
                    file: filePath,
                    type: 'excessive_permissions',
                    message: '权限配置过于宽泛',
                    severity: 'warning',
                    recommendation: '使用最小权限原则，只授予必要的权限'
                });
            }
        }
    }
    
    /**
     * 生成安全建议
     */
    generateSecurityRecommendations() {
        const recommendations = [];
        
        // 检查是否有未使用secrets的敏感变量
        const sensitiveEnvVars = Array.from(this.envVars).filter(env => this.isSensitiveName(env));
        if (sensitiveEnvVars.length > 0) {
            recommendations.push({
                type: 'security',
                title: '敏感环境变量安全建议',
                description: '以下环境变量可能包含敏感信息，建议使用GitHub Secrets',
                items: sensitiveEnvVars,
                action: '在GitHub仓库设置中添加这些变量到Secrets，并在工作流中使用${{ secrets.VARIABLE_NAME }}引用'
            });
        }
        
        // 检查常见的缺失密钥
        const commonSecrets = ['GITHUB_TOKEN', 'DEPLOY_KEY', 'API_KEY'];
        const missingSecrets = commonSecrets.filter(secret => !this.secrets.has(secret));
        if (missingSecrets.length > 0) {
            recommendations.push({
                type: 'configuration',
                title: '可能缺失的密钥配置',
                description: '以下是常见的密钥配置，请检查是否需要',
                items: missingSecrets,
                action: '根据项目需要在GitHub Secrets中配置相应的密钥'
            });
        }
        
        return recommendations;
    }
    
    /**
     * 验证所有工作流文件
     */
    validateAllWorkflows() {
        logCheck('开始验证环境变量和密钥配置...');
        
        const workflowFiles = this.getWorkflowFiles();
        
        if (workflowFiles.length === 0) {
            logWarning('未找到工作流文件');
            return;
        }
        
        workflowFiles.forEach(filePath => {
            logInfo(`检查文件: ${filePath}`);
            
            const workflow = this.parseYamlFile(filePath);
            if (!workflow) {
                return;
            }
            
            // 提取环境变量和密钥
            this.extractEnvAndSecrets(workflow, filePath);
            
            // 检查缺失的环境变量
            this.checkMissingEnvVars(workflow, filePath);
            
            // 检查权限配置
            this.checkPermissions(workflow, filePath);
        });
        
        // 生成建议
        this.recommendations = this.generateSecurityRecommendations();
    }
    
    /**
     * 生成报告
     */
    generateReport() {
        const report = {
            summary: {
                total_files: this.getWorkflowFiles().length,
                total_issues: this.issues.length,
                env_vars_found: this.envVars.size,
                secrets_found: this.secrets.size,
                error_count: this.issues.filter(issue => issue.severity === 'error').length,
                warning_count: this.issues.filter(issue => issue.severity === 'warning').length
            },
            env_vars: Array.from(this.envVars).sort(),
            secrets: Array.from(this.secrets).sort(),
            issues: this.issues,
            recommendations: this.recommendations,
            generated_at: new Date().toISOString()
        };
        
        return report;
    }
    
    /**
     * 保存报告
     */
    saveReport(report, outputFile = 'env-secrets-validation-report.json') {
        try {
            fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
            logSuccess(`验证报告已保存到: ${outputFile}`);
            return true;
        } catch (error) {
            logError(`保存报告失败: ${error.message}`);
            return false;
        }
    }
    
    /**
     * 输出摘要
     */
    printSummary(report) {
        console.log('\n📊 环境变量和密钥配置验证摘要:');
        console.log(`  检查文件: ${report.summary.total_files} 个`);
        console.log(`  发现问题: ${report.summary.total_issues} 个`);
        console.log(`  环境变量: ${report.summary.env_vars_found} 个`);
        console.log(`  密钥引用: ${report.summary.secrets_found} 个`);
        
        if (report.summary.error_count > 0) {
            logError(`严重问题: ${report.summary.error_count} 个`);
        }
        
        if (report.summary.warning_count > 0) {
            logWarning(`警告问题: ${report.summary.warning_count} 个`);
        }
        
        if (report.summary.total_issues === 0) {
            logSuccess('未发现配置问题!');
        }
        
        // 输出主要问题
        if (report.issues.length > 0) {
            console.log('\n🔍 主要问题:');
            report.issues.slice(0, 5).forEach(issue => {
                const severity = issue.severity === 'error' ? colors.red : colors.yellow;
                console.log(`  ${severity}[${issue.severity.toUpperCase()}]${colors.reset} ${issue.file}: ${issue.message}`);
            });
            
            if (report.issues.length > 5) {
                console.log(`  ... 还有 ${report.issues.length - 5} 个问题，详见报告文件`);
            }
        }
        
        // 输出建议
        if (report.recommendations.length > 0) {
            console.log('\n💡 安全建议:');
            report.recommendations.forEach(rec => {
                console.log(`  ${colors.cyan}${rec.title}${colors.reset}: ${rec.description}`);
            });
        }
    }
}

// 主函数
function main() {
    const validator = new EnvSecretsValidator();
    
    // 验证所有工作流
    validator.validateAllWorkflows();
    
    // 生成报告
    const report = validator.generateReport();
    
    // 保存报告
    validator.saveReport(report);
    
    // 输出摘要
    validator.printSummary(report);
    
    // 退出码
    const hasErrors = report.summary.error_count > 0;
    process.exit(hasErrors ? 1 : 0);
}

if (require.main === module) {
    main();
}

module.exports = EnvSecretsValidator;