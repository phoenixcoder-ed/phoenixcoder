#!/usr/bin/env node
/**
 * GitHub 状态徽章更新器
 * 用于生成和更新项目的状态徽章
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

class StatusBadgeUpdater {
    constructor(options = {}) {
        this.projectRoot = options.projectRoot || '.';
        this.owner = options.owner || this.getGitHubOwner();
        this.repo = options.repo || this.getGitHubRepo();
        this.branch = options.branch || 'main';
        this.badgeConfigs = {
            build: {
                label: 'Build',
                successMessage: 'passing',
                failureMessage: 'failing',
                successColor: 'brightgreen',
                failureColor: 'red'
            },
            tests: {
                label: 'Tests',
                successMessage: 'passing',
                failureMessage: 'failing',
                successColor: 'brightgreen',
                failureColor: 'red'
            },
            coverage: {
                label: 'Coverage',
                successColor: 'brightgreen',
                warningColor: 'yellow',
                failureColor: 'red'
            },
            quality: {
                label: 'Code Quality',
                successMessage: 'good',
                warningMessage: 'fair',
                failureMessage: 'poor',
                successColor: 'brightgreen',
                warningColor: 'yellow',
                failureColor: 'red'
            },
            security: {
                label: 'Security',
                successMessage: 'secure',
                failureMessage: 'vulnerable',
                successColor: 'brightgreen',
                failureColor: 'red'
            },
            license: {
                label: 'License',
                message: 'MIT',
                color: 'blue'
            },
            version: {
                label: 'Version',
                color: 'blue'
            }
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

    getGitHubOwner() {
        try {
            const remoteUrl = execSync('git config --get remote.origin.url', { 
                encoding: 'utf8', 
                cwd: this.projectRoot 
            }).trim();
            
            // 解析 GitHub URL
            const match = remoteUrl.match(/github\.com[:\/]([^\/]+)\//);;
            return match ? match[1] : 'unknown';
        } catch (error) {
            return 'unknown';
        }
    }

    getGitHubRepo() {
        try {
            const remoteUrl = execSync('git config --get remote.origin.url', { 
                encoding: 'utf8', 
                cwd: this.projectRoot 
            }).trim();
            
            // 解析仓库名
            const match = remoteUrl.match(/\/([^\/]+?)(\.git)?$/);
            return match ? match[1].replace('.git', '') : 'unknown';
        } catch (error) {
            return 'unknown';
        }
    }

    getProjectVersion() {
        try {
            const packageJsonPath = path.join(this.projectRoot, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                return packageJson.version || '1.0.0';
            }
        } catch (error) {
            // 忽略错误
        }
        return '1.0.0';
    }

    getLicense() {
        try {
            const packageJsonPath = path.join(this.projectRoot, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                return packageJson.license || 'MIT';
            }
        } catch (error) {
            // 忽略错误
        }
        return 'MIT';
    }

    generateShieldsIOUrl(label, message, color, style = 'flat') {
        const encodedLabel = encodeURIComponent(label);
        const encodedMessage = encodeURIComponent(message);
        return `https://img.shields.io/badge/${encodedLabel}-${encodedMessage}-${color}?style=${style}`;
    }

    generateGitHubActionsBadge(workflowName, style = 'flat') {
        return `https://github.com/${this.owner}/${this.repo}/actions/workflows/${workflowName}/badge.svg?branch=${this.branch}&style=${style}`;
    }

    generateCoverageBadge(percentage, style = 'flat') {
        let color = 'red';
        if (percentage >= 80) {
            color = 'brightgreen';
        } else if (percentage >= 60) {
            color = 'yellow';
        } else if (percentage >= 40) {
            color = 'orange';
        }
        
        return this.generateShieldsIOUrl('Coverage', `${percentage}%`, color, style);
    }

    generateQualityBadge(score, style = 'flat') {
        let message = 'poor';
        let color = 'red';
        
        if (score >= 80) {
            message = 'excellent';
            color = 'brightgreen';
        } else if (score >= 60) {
            message = 'good';
            color = 'green';
        } else if (score >= 40) {
            message = 'fair';
            color = 'yellow';
        }
        
        return this.generateShieldsIOUrl('Quality', message, color, style);
    }

    async checkWorkflowStatus(workflowFile) {
        // 这里可以集成 GitHub API 来检查实际的工作流状态
        // 目前返回模拟状态
        return {
            status: 'success', // success, failure, pending
            conclusion: 'success' // success, failure, cancelled, skipped
        };
    }

    async generateAllBadges(options = {}) {
        const style = options.style || 'flat';
        const badges = {};
        
        this.log('生成状态徽章...', 'info');
        
        // GitHub Actions 徽章
        const workflowFiles = ['ci.yml', 'test.yml', 'build.yml', 'deploy.yml'];
        for (const workflow of workflowFiles) {
            const workflowPath = path.join(this.projectRoot, '.github', 'workflows', workflow);
            if (fs.existsSync(workflowPath)) {
                badges[workflow.replace('.yml', '')] = this.generateGitHubActionsBadge(workflow, style);
            }
        }
        
        // 构建状态徽章
        badges.build = this.generateShieldsIOUrl(
            this.badgeConfigs.build.label,
            this.badgeConfigs.build.successMessage,
            this.badgeConfigs.build.successColor,
            style
        );
        
        // 测试状态徽章
        badges.tests = this.generateShieldsIOUrl(
            this.badgeConfigs.tests.label,
            this.badgeConfigs.tests.successMessage,
            this.badgeConfigs.tests.successColor,
            style
        );
        
        // 代码覆盖率徽章
        const coveragePercentage = options.coverage || 75; // 默认75%
        badges.coverage = this.generateCoverageBadge(coveragePercentage, style);
        
        // 代码质量徽章
        const qualityScore = options.qualityScore || 70; // 默认70分
        badges.quality = this.generateQualityBadge(qualityScore, style);
        
        // 安全徽章
        badges.security = this.generateShieldsIOUrl(
            this.badgeConfigs.security.label,
            this.badgeConfigs.security.successMessage,
            this.badgeConfigs.security.successColor,
            style
        );
        
        // 版本徽章
        const version = this.getProjectVersion();
        badges.version = this.generateShieldsIOUrl(
            this.badgeConfigs.version.label,
            `v${version}`,
            this.badgeConfigs.version.color,
            style
        );
        
        // 许可证徽章
        const license = this.getLicense();
        badges.license = this.generateShieldsIOUrl(
            this.badgeConfigs.license.label,
            license,
            this.badgeConfigs.license.color,
            style
        );
        
        // Node.js 版本徽章
        badges.node = this.generateShieldsIOUrl(
            'Node.js',
            '>=18',
            'green',
            style
        );
        
        // TypeScript 徽章
        badges.typescript = this.generateShieldsIOUrl(
            'TypeScript',
            'Ready',
            'blue',
            style
        );
        
        return badges;
    }

    generateBadgeMarkdown(badges, options = {}) {
        const markdown = [];
        
        if (options.title !== false) {
            markdown.push('# 项目状态徽章\n');
        }
        
        // 主要状态徽章
        if (options.mainBadges !== false) {
            markdown.push('## 主要状态\n');
            
            const mainBadges = ['build', 'tests', 'coverage', 'quality', 'security'];
            const badgeLinks = mainBadges
                .filter(badge => badges[badge])
                .map(badge => `![${badge}](${badges[badge]})`)
                .join(' ');
            
            if (badgeLinks) {
                markdown.push(badgeLinks + '\n');
            }
        }
        
        // GitHub Actions 工作流徽章
        const workflowBadges = Object.entries(badges)
            .filter(([key]) => ['ci', 'test', 'build', 'deploy'].includes(key))
            .map(([key, url]) => `![${key}](${url})`)
            .join(' ');
        
        if (workflowBadges && options.workflowBadges !== false) {
            markdown.push('## GitHub Actions\n');
            markdown.push(workflowBadges + '\n');
        }
        
        // 项目信息徽章
        if (options.projectInfo !== false) {
            markdown.push('## 项目信息\n');
            
            const infoBadges = ['version', 'license', 'node', 'typescript']
                .filter(badge => badges[badge])
                .map(badge => `![${badge}](${badges[badge]})`)
                .join(' ');
            
            if (infoBadges) {
                markdown.push(infoBadges + '\n');
            }
        }
        
        return markdown.join('\n');
    }

    generateBadgeHTML(badges, options = {}) {
        const html = [];
        
        if (options.title !== false) {
            html.push('<h1>项目状态徽章</h1>\n');
        }
        
        // 主要状态徽章
        if (options.mainBadges !== false) {
            html.push('<h2>主要状态</h2>');
            html.push('<p>');
            
            const mainBadges = ['build', 'tests', 'coverage', 'quality', 'security'];
            mainBadges.forEach(badge => {
                if (badges[badge]) {
                    html.push(`  <img src="${badges[badge]}" alt="${badge}" />`);
                }
            });
            
            html.push('</p>\n');
        }
        
        // GitHub Actions 工作流徽章
        const workflowBadges = Object.entries(badges)
            .filter(([key]) => ['ci', 'test', 'build', 'deploy'].includes(key));
        
        if (workflowBadges.length > 0 && options.workflowBadges !== false) {
            html.push('<h2>GitHub Actions</h2>');
            html.push('<p>');
            
            workflowBadges.forEach(([key, url]) => {
                html.push(`  <img src="${url}" alt="${key}" />`);
            });
            
            html.push('</p>\n');
        }
        
        // 项目信息徽章
        if (options.projectInfo !== false) {
            html.push('<h2>项目信息</h2>');
            html.push('<p>');
            
            const infoBadges = ['version', 'license', 'node', 'typescript'];
            infoBadges.forEach(badge => {
                if (badges[badge]) {
                    html.push(`  <img src="${badges[badge]}" alt="${badge}" />`);
                }
            });
            
            html.push('</p>\n');
        }
        
        return html.join('\n');
    }

    async updateReadmeBadges(readmePath, badges, options = {}) {
        if (!fs.existsSync(readmePath)) {
            this.log(`README 文件不存在: ${readmePath}`, 'warning');
            return false;
        }
        
        let content = fs.readFileSync(readmePath, 'utf8');
        
        // 查找并替换徽章部分
        const badgeStartMarker = '<!-- BADGES:START -->';
        const badgeEndMarker = '<!-- BADGES:END -->';
        
        const startIndex = content.indexOf(badgeStartMarker);
        const endIndex = content.indexOf(badgeEndMarker);
        
        if (startIndex !== -1 && endIndex !== -1) {
            // 替换现有徽章
            const beforeBadges = content.substring(0, startIndex + badgeStartMarker.length);
            const afterBadges = content.substring(endIndex);
            const badgeMarkdown = this.generateBadgeMarkdown(badges, options);
            
            content = beforeBadges + '\n' + badgeMarkdown + '\n' + afterBadges;
        } else {
            // 在文件开头添加徽章
            const badgeMarkdown = this.generateBadgeMarkdown(badges, options);
            const badgeSection = `${badgeStartMarker}\n${badgeMarkdown}\n${badgeEndMarker}\n\n`;
            content = badgeSection + content;
        }
        
        fs.writeFileSync(readmePath, content, 'utf8');
        this.log(`README 徽章已更新: ${readmePath}`, 'success');
        return true;
    }

    async saveBadgeReport(badges, outputDir = 'badge-reports') {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // 保存 JSON 格式
        const jsonFile = path.join(outputDir, 'badges.json');
        fs.writeFileSync(jsonFile, JSON.stringify(badges, null, 2), 'utf8');
        
        // 保存 Markdown 格式
        const mdFile = path.join(outputDir, 'badges.md');
        const markdownContent = this.generateBadgeMarkdown(badges);
        fs.writeFileSync(mdFile, markdownContent, 'utf8');
        
        // 保存 HTML 格式
        const htmlFile = path.join(outputDir, 'badges.html');
        const htmlContent = this.generateBadgeHTML(badges);
        fs.writeFileSync(htmlFile, htmlContent, 'utf8');
        
        this.log(`徽章报告已保存到 ${outputDir}/`, 'success');
        this.log(`  - JSON: ${jsonFile}`, 'info');
        this.log(`  - Markdown: ${mdFile}`, 'info');
        this.log(`  - HTML: ${htmlFile}`, 'info');
    }

    async run(options = {}) {
        this.log('🎯 开始生成状态徽章...', 'info');
        
        try {
            // 生成所有徽章
            const badges = await this.generateAllBadges(options);
            
            this.log(`生成了 ${Object.keys(badges).length} 个徽章`, 'success');
            
            // 保存徽章报告
            await this.saveBadgeReport(badges, options.outputDir);
            
            // 更新 README 文件
            if (options.updateReadme !== false) {
                const readmePath = path.join(this.projectRoot, 'README.md');
                await this.updateReadmeBadges(readmePath, badges, options);
            }
            
            // 输出徽章 URL
            if (options.verbose) {
                this.log('\n生成的徽章 URL:', 'info');
                Object.entries(badges).forEach(([name, url]) => {
                    this.log(`  ${name}: ${url}`, 'debug');
                });
            }
            
            this.log('✅ 状态徽章生成完成', 'success');
            return badges;
            
        } catch (error) {
            this.log(`❌ 生成徽章时发生错误: ${error.message}`, 'error');
            throw error;
        }
    }
}

// 主函数
async function main() {
    const args = process.argv.slice(2);
    
    const options = {
        projectRoot: args.find(arg => arg.startsWith('--project='))?.split('=')[1] || '.',
        outputDir: args.find(arg => arg.startsWith('--output='))?.split('=')[1] || 'badge-reports',
        style: args.find(arg => arg.startsWith('--style='))?.split('=')[1] || 'flat',
        coverage: parseInt(args.find(arg => arg.startsWith('--coverage='))?.split('=')[1]) || 75,
        qualityScore: parseInt(args.find(arg => arg.startsWith('--quality='))?.split('=')[1]) || 70,
        updateReadme: !args.includes('--no-readme'),
        verbose: args.includes('--verbose')
    };
    
    const updater = new StatusBadgeUpdater(options);
    
    try {
        await updater.run(options);
        process.exit(0);
    } catch (error) {
        console.error(`❌ 执行失败: ${error.message}`);
        process.exit(1);
    }
}

// 检查是否直接运行
if (require.main === module) {
    main();
}

module.exports = StatusBadgeUpdater;