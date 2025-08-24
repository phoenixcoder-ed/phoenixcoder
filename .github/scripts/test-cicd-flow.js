#!/usr/bin/env node
/**
 * CI/CD 流程完整测试脚本 (Node.js版本)
 * 用于测试完整的 CI/CD 流程并生成验证结果
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const yaml = require('js-yaml');

class CICDFlowTester {
    constructor(projectRoot = '.') {
        this.projectRoot = path.resolve(projectRoot);
        this.testResults = {
            timestamp: new Date().toISOString(),
            projectRoot: this.projectRoot,
            overall: {
                healthy: false,
                score: 0,
                maxScore: 100
            },
            tests: {
                gitRepository: { passed: false, score: 0, maxScore: 10, details: [] },
                workflowFiles: { passed: false, score: 0, maxScore: 15, details: [] },
                dependencies: { passed: false, score: 0, maxScore: 15, details: [] },
                buildProcess: { passed: false, score: 0, maxScore: 20, details: [] },
                unitTests: { passed: false, score: 0, maxScore: 15, details: [] },
                linting: { passed: false, score: 0, maxScore: 10, details: [] },
                environmentConfig: { passed: false, score: 0, maxScore: 10, details: [] },
                securityScan: { passed: false, score: 0, maxScore: 5, details: [] }
            },
            recommendations: [],
            failedTests: []
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString('zh-CN');
        const prefix = {
            'info': '📋',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌',
            'debug': '🔍'
        }[type] || '📋';
        
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }

    async runCommand(command, options = {}) {
        return new Promise((resolve, reject) => {
            try {
                const result = execSync(command, {
                    cwd: this.projectRoot,
                    encoding: 'utf8',
                    timeout: options.timeout || 30000,
                    ...options
                });
                resolve({ success: true, output: result, error: null });
            } catch (error) {
                resolve({ 
                    success: false, 
                    output: error.stdout || '', 
                    error: error.stderr || error.message 
                });
            }
        });
    }

    async testGitRepository() {
        this.log('测试 Git 仓库状态...');
        const test = this.testResults.tests.gitRepository;
        
        try {
            // 检查是否是 Git 仓库
            const gitCheck = await this.runCommand('git rev-parse --git-dir');
            if (!gitCheck.success) {
                test.details.push('不是有效的 Git 仓库');
                return;
            }
            
            test.score += 3;
            test.details.push('✅ Git 仓库检查通过');
            
            // 检查远程仓库
            const remoteCheck = await this.runCommand('git remote -v');
            if (remoteCheck.success && remoteCheck.output.trim()) {
                test.score += 2;
                test.details.push('✅ 远程仓库配置正常');
            } else {
                test.details.push('⚠️ 未配置远程仓库');
            }
            
            // 检查工作目录状态
            const statusCheck = await this.runCommand('git status --porcelain');
            if (statusCheck.success) {
                const changes = statusCheck.output.trim().split('\n').filter(line => line.trim());
                if (changes.length === 0) {
                    test.score += 2;
                    test.details.push('✅ 工作目录干净');
                } else {
                    test.details.push(`⚠️ 工作目录有 ${changes.length} 个未提交的更改`);
                    
                    // 检查是否有敏感文件
                    const sensitiveFiles = changes.filter(change => {
                        const file = change.substring(3);
                        return file.includes('.env') || file.includes('secret') || 
                               file.includes('password') || file.includes('.key');
                    });
                    
                    if (sensitiveFiles.length > 0) {
                        test.details.push(`❌ 发现敏感文件: ${sensitiveFiles.map(f => f.substring(3)).join(', ')}`);
                        this.testResults.failedTests.push('发现被提交的敏感文件');
                    } else {
                        test.score += 1;
                    }
                }
            }
            
            // 检查最近提交
            const commitCheck = await this.runCommand('git log --oneline -5');
            if (commitCheck.success && commitCheck.output.trim()) {
                test.score += 2;
                test.details.push('✅ 有提交历史');
            }
            
            test.passed = test.score >= test.maxScore * 0.7;
            
        } catch (error) {
            test.details.push(`❌ Git 检查失败: ${error.message}`);
        }
    }

    async testWorkflowFiles() {
        this.log('测试工作流文件...');
        const test = this.testResults.tests.workflowFiles;
        
        try {
            const workflowDir = path.join(this.projectRoot, '.github', 'workflows');
            
            if (!fs.existsSync(workflowDir)) {
                test.details.push('❌ .github/workflows 目录不存在');
                return;
            }
            
            test.score += 3;
            test.details.push('✅ 工作流目录存在');
            
            // 检查工作流文件
            const files = fs.readdirSync(workflowDir).filter(file => 
                file.endsWith('.yml') || file.endsWith('.yaml')
            );
            
            if (files.length === 0) {
                test.details.push('❌ 没有找到工作流文件');
                return;
            }
            
            test.score += 3;
            test.details.push(`✅ 找到 ${files.length} 个工作流文件`);
            
            // 验证主要工作流文件
            const requiredWorkflows = ['ci.yml', 'test.yml'];
            const foundWorkflows = [];
            
            for (const required of requiredWorkflows) {
                if (files.includes(required)) {
                    foundWorkflows.push(required);
                    test.score += 2;
                }
            }
            
            if (foundWorkflows.length > 0) {
                test.details.push(`✅ 找到核心工作流: ${foundWorkflows.join(', ')}`);
            }
            
            // 验证工作流语法
            let validWorkflows = 0;
            for (const file of files) {
                try {
                    const filePath = path.join(workflowDir, file);
                    const content = fs.readFileSync(filePath, 'utf8');
                    yaml.load(content);
                    validWorkflows++;
                } catch (error) {
                    test.details.push(`❌ ${file} 语法错误: ${error.message}`);
                    this.testResults.failedTests.push(`工作流文件 ${file} 语法错误`);
                }
            }
            
            if (validWorkflows === files.length) {
                test.score += 4;
                test.details.push('✅ 所有工作流文件语法正确');
            } else {
                test.details.push(`⚠️ ${files.length - validWorkflows} 个工作流文件有语法错误`);
            }
            
            test.passed = test.score >= test.maxScore * 0.7;
            
        } catch (error) {
            test.details.push(`❌ 工作流检查失败: ${error.message}`);
        }
    }

    async testDependencies() {
        this.log('测试依赖安装...');
        const test = this.testResults.tests.dependencies;
        
        try {
            // 检查 package.json
            const packageJsonPath = path.join(this.projectRoot, 'package.json');
            if (!fs.existsSync(packageJsonPath)) {
                test.details.push('❌ package.json 不存在');
                return;
            }
            
            test.score += 3;
            test.details.push('✅ package.json 存在');
            
            // 检查 node_modules
            const nodeModulesPath = path.join(this.projectRoot, 'node_modules');
            if (fs.existsSync(nodeModulesPath)) {
                test.score += 3;
                test.details.push('✅ node_modules 目录存在');
            } else {
                test.details.push('⚠️ node_modules 目录不存在，尝试安装依赖...');
                
                // 尝试安装依赖
                const installResult = await this.runCommand('npm install', { timeout: 120000 });
                if (installResult.success) {
                    test.score += 2;
                    test.details.push('✅ 依赖安装成功');
                } else {
                    test.details.push(`❌ 依赖安装失败: ${installResult.error}`);
                    this.testResults.failedTests.push('依赖安装失败');
                }
            }
            
            // 检查关键依赖
            try {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                const allDeps = {
                    ...packageJson.dependencies || {},
                    ...packageJson.devDependencies || {}
                };
                
                const keyDeps = ['typescript', 'vite', 'eslint'];
                const foundKeyDeps = keyDeps.filter(dep => dep in allDeps);
                
                if (foundKeyDeps.length > 0) {
                    test.score += Math.min(6, foundKeyDeps.length * 2);
                    test.details.push(`✅ 找到关键依赖: ${foundKeyDeps.join(', ')}`);
                }
                
                // 检查脚本
                const scripts = packageJson.scripts || {};
                const keyScripts = ['build', 'test', 'lint'];
                const foundScripts = keyScripts.filter(script => script in scripts);
                
                if (foundScripts.length > 0) {
                    test.score += Math.min(3, foundScripts.length);
                    test.details.push(`✅ 找到关键脚本: ${foundScripts.join(', ')}`);
                }
                
            } catch (error) {
                test.details.push(`❌ package.json 解析失败: ${error.message}`);
            }
            
            test.passed = test.score >= test.maxScore * 0.6;
            
        } catch (error) {
            test.details.push(`❌ 依赖检查失败: ${error.message}`);
        }
    }

    async testBuildProcess() {
        this.log('测试构建过程...');
        const test = this.testResults.tests.buildProcess;
        
        try {
            // 检查构建脚本
            const packageJsonPath = path.join(this.projectRoot, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                const scripts = packageJson.scripts || {};
                
                if ('build' in scripts) {
                    test.score += 5;
                    test.details.push('✅ 构建脚本存在');
                    
                    // 尝试运行构建
                    this.log('运行构建命令...');
                    const buildResult = await this.runCommand('npm run build', { timeout: 180000 });
                    
                    if (buildResult.success) {
                        test.score += 10;
                        test.details.push('✅ 构建成功');
                        
                        // 检查构建输出
                        const distPath = path.join(this.projectRoot, 'dist');
                        if (fs.existsSync(distPath)) {
                            test.score += 5;
                            test.details.push('✅ 构建输出目录存在');
                        }
                    } else {
                        test.details.push(`❌ 构建失败: ${buildResult.error}`);
                        this.testResults.failedTests.push('构建过程失败');
                    }
                } else {
                    test.details.push('❌ 没有构建脚本');
                }
            }
            
            test.passed = test.score >= test.maxScore * 0.5;
            
        } catch (error) {
            test.details.push(`❌ 构建测试失败: ${error.message}`);
        }
    }

    async testUnitTests() {
        this.log('测试单元测试...');
        const test = this.testResults.tests.unitTests;
        
        try {
            const packageJsonPath = path.join(this.projectRoot, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                const scripts = packageJson.scripts || {};
                
                if ('test' in scripts) {
                    test.score += 5;
                    test.details.push('✅ 测试脚本存在');
                    
                    // 检查测试文件
                    const testDirs = ['tests', 'test', '__tests__', 'src/__tests__'];
                    let testFilesFound = false;
                    
                    for (const testDir of testDirs) {
                        const testPath = path.join(this.projectRoot, testDir);
                        if (fs.existsSync(testPath)) {
                            const files = this.findTestFiles(testPath);
                            if (files.length > 0) {
                                test.score += 3;
                                test.details.push(`✅ 找到 ${files.length} 个测试文件在 ${testDir}`);
                                testFilesFound = true;
                                break;
                            }
                        }
                    }
                    
                    if (!testFilesFound) {
                        test.details.push('⚠️ 没有找到测试文件');
                    }
                    
                    // 尝试运行测试
                    this.log('运行单元测试...');
                    const testResult = await this.runCommand('npm test', { timeout: 120000 });
                    
                    if (testResult.success) {
                        test.score += 7;
                        test.details.push('✅ 单元测试通过');
                    } else {
                        test.details.push(`❌ 单元测试失败: ${testResult.error}`);
                        this.testResults.failedTests.push('单元测试失败');
                    }
                } else {
                    test.details.push('❌ 没有测试脚本');
                }
            }
            
            test.passed = test.score >= test.maxScore * 0.4;
            
        } catch (error) {
            test.details.push(`❌ 单元测试检查失败: ${error.message}`);
        }
    }

    findTestFiles(dir) {
        const files = [];
        try {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    files.push(...this.findTestFiles(fullPath));
                } else if (item.includes('.test.') || item.includes('.spec.') || item.endsWith('_test.js')) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // 忽略读取错误
        }
        return files;
    }

    async testLinting() {
        this.log('测试代码检查...');
        const test = this.testResults.tests.linting;
        
        try {
            const packageJsonPath = path.join(this.projectRoot, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                const scripts = packageJson.scripts || {};
                
                // 检查 lint 脚本
                const lintScripts = Object.keys(scripts).filter(script => 
                    script.includes('lint') || script.includes('check')
                );
                
                if (lintScripts.length > 0) {
                    test.score += 3;
                    test.details.push(`✅ 找到代码检查脚本: ${lintScripts.join(', ')}`);
                    
                    // 尝试运行 lint
                    for (const lintScript of lintScripts.slice(0, 2)) { // 最多运行2个
                        this.log(`运行 ${lintScript}...`);
                        const lintResult = await this.runCommand(`npm run ${lintScript}`, { timeout: 60000 });
                        
                        if (lintResult.success) {
                            test.score += 3;
                            test.details.push(`✅ ${lintScript} 通过`);
                        } else {
                            test.details.push(`❌ ${lintScript} 失败: ${lintResult.error}`);
                            this.testResults.failedTests.push(`代码检查 (${lintScript}) 失败`);
                        }
                    }
                } else {
                    test.details.push('⚠️ 没有找到代码检查脚本');
                }
                
                // 检查配置文件
                const configFiles = ['.eslintrc.js', '.eslintrc.json', 'eslint.config.js', '.prettierrc'];
                const foundConfigs = configFiles.filter(config => 
                    fs.existsSync(path.join(this.projectRoot, config))
                );
                
                if (foundConfigs.length > 0) {
                    test.score += 2;
                    test.details.push(`✅ 找到配置文件: ${foundConfigs.join(', ')}`);
                }
            }
            
            test.passed = test.score >= test.maxScore * 0.5;
            
        } catch (error) {
            test.details.push(`❌ 代码检查测试失败: ${error.message}`);
        }
    }

    async testEnvironmentConfig() {
        this.log('测试环境配置...');
        const test = this.testResults.tests.environmentConfig;
        
        try {
            // 检查环境文件
            const envFiles = ['.env.example', '.env.template', '.env.local'];
            const foundEnvFiles = envFiles.filter(file => 
                fs.existsSync(path.join(this.projectRoot, file))
            );
            
            if (foundEnvFiles.length > 0) {
                test.score += 3;
                test.details.push(`✅ 找到环境配置文件: ${foundEnvFiles.join(', ')}`);
            }
            
            // 检查配置文件
            const configFiles = ['vite.config.ts', 'vite.config.js', 'tsconfig.json'];
            const foundConfigs = configFiles.filter(file => 
                fs.existsSync(path.join(this.projectRoot, file))
            );
            
            if (foundConfigs.length > 0) {
                test.score += 4;
                test.details.push(`✅ 找到配置文件: ${foundConfigs.join(', ')}`);
            }
            
            // 检查 .env 文件是否被忽略
            const gitignorePath = path.join(this.projectRoot, '.gitignore');
            if (fs.existsSync(gitignorePath)) {
                const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
                if (gitignoreContent.includes('.env')) {
                    test.score += 3;
                    test.details.push('✅ .env 文件已被 .gitignore 忽略');
                } else {
                    test.details.push('⚠️ .env 文件未被 .gitignore 忽略');
                }
            }
            
            test.passed = test.score >= test.maxScore * 0.6;
            
        } catch (error) {
            test.details.push(`❌ 环境配置检查失败: ${error.message}`);
        }
    }

    async testSecurityScan() {
        this.log('测试安全扫描...');
        const test = this.testResults.tests.securityScan;
        
        try {
            // 检查是否有 .env 文件被提交
            const envPath = path.join(this.projectRoot, '.env');
            if (fs.existsSync(envPath)) {
                const gitCheck = await this.runCommand('git ls-files .env');
                if (gitCheck.success && gitCheck.output.trim()) {
                    test.details.push('❌ .env 文件被提交到版本控制');
                    this.testResults.failedTests.push('发现被提交的敏感文件 .env');
                } else {
                    test.score += 2;
                    test.details.push('✅ .env 文件未被提交');
                }
            } else {
                test.score += 1;
                test.details.push('✅ 没有 .env 文件');
            }
            
            // 检查 package.json 中的安全依赖
            const packageJsonPath = path.join(this.projectRoot, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                const allDeps = {
                    ...packageJson.dependencies || {},
                    ...packageJson.devDependencies || {}
                };
                
                // 检查是否有安全相关的依赖
                const securityDeps = Object.keys(allDeps).filter(dep => 
                    dep.includes('security') || dep.includes('audit') || dep.includes('helmet')
                );
                
                if (securityDeps.length > 0) {
                    test.score += 2;
                    test.details.push(`✅ 找到安全相关依赖: ${securityDeps.join(', ')}`);
                }
            }
            
            test.passed = test.score >= test.maxScore * 0.4;
            
        } catch (error) {
            test.details.push(`❌ 安全扫描失败: ${error.message}`);
        }
    }

    calculateOverallScore() {
        let totalScore = 0;
        let maxTotalScore = 0;
        
        Object.values(this.testResults.tests).forEach(test => {
            totalScore += test.score;
            maxTotalScore += test.maxScore;
        });
        
        this.testResults.overall.score = totalScore;
        this.testResults.overall.maxScore = maxTotalScore;
        this.testResults.overall.healthy = (totalScore / maxTotalScore) >= 0.7;
    }

    generateRecommendations() {
        const recommendations = [];
        
        Object.entries(this.testResults.tests).forEach(([testName, test]) => {
            if (!test.passed) {
                const testNameCN = {
                    gitRepository: 'Git 仓库',
                    workflowFiles: '工作流文件',
                    dependencies: '依赖管理',
                    buildProcess: '构建过程',
                    unitTests: '单元测试',
                    linting: '代码检查',
                    environmentConfig: '环境配置',
                    securityScan: '安全扫描'
                }[testName] || testName;
                
                recommendations.push(`改进 ${testNameCN} (当前得分: ${test.score}/${test.maxScore})`);
            }
        });
        
        if (this.testResults.failedTests.length > 0) {
            recommendations.push('修复失败的测试项目');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('CI/CD 流程配置良好，继续保持');
        }
        
        this.testResults.recommendations = recommendations;
    }

    generateReport() {
        const report = [];
        report.push('# 🚀 CI/CD 流程测试报告\n');
        report.push(`**生成时间**: ${new Date().toLocaleString('zh-CN')}\n`);
        report.push(`**项目路径**: ${this.testResults.projectRoot}\n`);
        
        // 总体状态
        const overall = this.testResults.overall;
        const healthStatus = overall.healthy ? '✅ 健康' : '❌ 不健康';
        const scorePercent = Math.round((overall.score / overall.maxScore) * 100);
        
        report.push('## 📊 总体状态\n');
        report.push(`- **状态**: ${healthStatus}`);
        report.push(`- **得分**: ${overall.score}/${overall.maxScore} (${scorePercent}%)\n`);
        
        // 测试详情
        report.push('## 🧪 测试详情\n');
        report.push('| 测试项目 | 状态 | 得分 | 详情 |');
        report.push('|----------|------|------|------|');
        
        const testNameMap = {
            gitRepository: 'Git 仓库',
            workflowFiles: '工作流文件',
            dependencies: '依赖管理',
            buildProcess: '构建过程',
            unitTests: '单元测试',
            linting: '代码检查',
            environmentConfig: '环境配置',
            securityScan: '安全扫描'
        };
        
        Object.entries(this.testResults.tests).forEach(([testName, test]) => {
            const name = testNameMap[testName] || testName;
            const status = test.passed ? '✅' : '❌';
            const score = `${test.score}/${test.maxScore}`;
            const details = test.details.slice(0, 2).join('; ');
            
            report.push(`| ${name} | ${status} | ${score} | ${details} |`);
        });
        
        report.push('\n');
        
        // 失败的测试
        if (this.testResults.failedTests.length > 0) {
            report.push('## ❌ 失败的测试\n');
            this.testResults.failedTests.forEach((test, index) => {
                report.push(`${index + 1}. ${test}`);
            });
            report.push('\n');
        }
        
        // 建议
        if (this.testResults.recommendations.length > 0) {
            report.push('## 💡 改进建议\n');
            this.testResults.recommendations.forEach((rec, index) => {
                report.push(`${index + 1}. ${rec}`);
            });
            report.push('\n');
        }
        
        return report.join('\n');
    }

    async saveReport(outputDir = 'cicd-test-reports') {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // 保存 JSON 报告
        const jsonFile = path.join(outputDir, 'cicd-test-results.json');
        fs.writeFileSync(jsonFile, JSON.stringify(this.testResults, null, 2), 'utf8');
        
        // 保存 Markdown 报告
        const mdFile = path.join(outputDir, 'cicd-test-report.md');
        const reportContent = this.generateReport();
        fs.writeFileSync(mdFile, reportContent, 'utf8');
        
        this.log(`报告已保存到 ${outputDir}/`, 'success');
        this.log(`  - JSON报告: ${jsonFile}`, 'info');
        this.log(`  - Markdown报告: ${mdFile}`, 'info');
    }

    async runAllTests() {
        this.log('🚀 开始 CI/CD 流程完整测试...', 'info');
        
        const tests = [
            this.testGitRepository.bind(this),
            this.testWorkflowFiles.bind(this),
            this.testDependencies.bind(this),
            this.testBuildProcess.bind(this),
            this.testUnitTests.bind(this),
            this.testLinting.bind(this),
            this.testEnvironmentConfig.bind(this),
            this.testSecurityScan.bind(this)
        ];
        
        for (const test of tests) {
            try {
                await test();
            } catch (error) {
                this.log(`测试执行错误: ${error.message}`, 'error');
            }
        }
        
        // 计算总分和生成建议
        this.calculateOverallScore();
        this.generateRecommendations();
        
        // 输出摘要
        const overall = this.testResults.overall;
        const scorePercent = Math.round((overall.score / overall.maxScore) * 100);
        
        this.log('\n' + '='.repeat(60), 'info');
        this.log('📊 CI/CD 流程测试摘要', 'info');
        this.log('='.repeat(60), 'info');
        this.log(`总体状态: ${overall.healthy ? '✅ 健康' : '❌ 不健康'}`, overall.healthy ? 'success' : 'error');
        this.log(`总体得分: ${overall.score}/${overall.maxScore} (${scorePercent}%)`, 'info');
        this.log(`失败测试: ${this.testResults.failedTests.length} 项`, this.testResults.failedTests.length === 0 ? 'success' : 'warning');
        
        if (this.testResults.failedTests.length > 0) {
            this.log('\n失败的测试:', 'error');
            this.testResults.failedTests.forEach(test => {
                this.log(`  - ${test}`, 'error');
            });
        }
        
        return this.testResults;
    }
}

// 主函数
async function main() {
    const args = process.argv.slice(2);
    const projectRoot = args.find(arg => arg.startsWith('--project='))?.split('=')[1] || '.';
    const outputDir = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || 'cicd-test-reports';
    const quiet = args.includes('--quiet');
    
    const tester = new CICDFlowTester(projectRoot);
    
    try {
        const results = await tester.runAllTests();
        
        // 保存报告
        await tester.saveReport(outputDir);
        
        // 根据结果设置退出码
        if (!results.overall.healthy) {
            if (!quiet) {
                console.log('\n❌ CI/CD 流程不健康，存在失败的测试');
            }
            process.exit(1);
        } else {
            if (!quiet) {
                console.log('\n✅ CI/CD 流程健康');
            }
            process.exit(0);
        }
        
    } catch (error) {
        console.error(`❌ 测试过程中发生错误: ${error.message}`);
        process.exit(1);
    }
}

// 检查是否直接运行
if (require.main === module) {
    main();
}

module.exports = CICDFlowTester;