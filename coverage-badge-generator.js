#!/usr/bin/env node

/**
 * PhoenixCoder 覆盖率徽章生成器
 * 
 * 功能：
 * 1. 生成SVG格式的覆盖率徽章
 * 2. 支持多种样式和主题
 * 3. 自动颜色分级
 * 4. 支持自定义样式
 * 5. 集成到CI/CD流水线
 */

const fs = require('fs');
const path = require('path');

// 徽章样式配置
const BADGE_STYLES = {
  flat: {
    height: 20,
    borderRadius: 0,
    shadow: false
  },
  'flat-square': {
    height: 20,
    borderRadius: 0,
    shadow: false,
    square: true
  },
  'for-the-badge': {
    height: 28,
    borderRadius: 0,
    shadow: false,
    uppercase: true,
    bold: true
  },
  plastic: {
    height: 18,
    borderRadius: 4,
    shadow: true,
    gradient: true
  },
  social: {
    height: 20,
    borderRadius: 3,
    shadow: true,
    social: true
  }
};

// 颜色配置
const COLORS = {
  // 覆盖率颜色分级
  coverage: {
    excellent: '#4c1', // 90%+
    good: '#97ca00',    // 80-89%
    fair: '#dfb317',    // 70-79%
    poor: '#fe7d37',    // 60-69%
    critical: '#e05d44' // <60%
  },
  
  // 预定义颜色
  brightgreen: '#4c1',
  green: '#97ca00',
  yellowgreen: '#a4a61d',
  yellow: '#dfb317',
  orange: '#fe7d37',
  red: '#e05d44',
  lightgrey: '#9f9f9f',
  blue: '#007ec6',
  purple: '#663399',
  pink: '#ff69b4'
};

// 徽章生成器类
class BadgeGenerator {
  constructor(options = {}) {
    this.style = options.style || 'flat';
    this.theme = options.theme || 'default';
    this.customColors = options.colors || {};
  }
  
  // 生成覆盖率徽章
  generateCoverageBadge(coverage, options = {}) {
    const {
      label = 'coverage',
      style = this.style,
      format = 'svg',
      precision = 1
    } = options;
    
    const value = `${coverage.toFixed(precision)}%`;
    const color = this.getCoverageColor(coverage);
    
    return this.generateBadge({
      label,
      message: value,
      color,
      style,
      format
    });
  }
  
  // 生成通用徽章
  generateBadge(options) {
    const {
      label,
      message,
      color,
      style = this.style,
      format = 'svg',
      labelColor = '#555',
      logo = null,
      logoWidth = 14
    } = options;
    
    const styleConfig = BADGE_STYLES[style] || BADGE_STYLES.flat;
    const messageColor = this.resolveColor(color);
    const resolvedLabelColor = this.resolveColor(labelColor);
    
    switch (format) {
      case 'svg':
        return this.generateSVGBadge({
          label,
          message,
          labelColor: resolvedLabelColor,
          messageColor,
          style: styleConfig,
          logo,
          logoWidth
        });
      case 'json':
        return this.generateJSONBadge({
          label,
          message,
          color: messageColor,
          style
        });
      case 'markdown':
        return this.generateMarkdownBadge({
          label,
          message,
          color: messageColor
        });
      default:
        throw new Error(`不支持的格式: ${format}`);
    }
  }
  
  // 生成SVG徽章
  generateSVGBadge(options) {
    const {
      label,
      message,
      labelColor,
      messageColor,
      style,
      logo,
      logoWidth
    } = options;
    
    // 计算文本宽度
    const labelWidth = this.calculateTextWidth(label) + 10;
    const messageWidth = this.calculateTextWidth(message) + 10;
    const logoSpace = logo ? logoWidth + 3 : 0;
    
    const totalWidth = labelWidth + messageWidth + logoSpace;
    const height = style.height;
    
    // 生成SVG
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalWidth}" height="${height}" role="img" aria-label="${label}: ${message}">`;
    
    // 添加标题
    svg += `<title>${label}: ${message}</title>`;
    
    // 添加渐变定义（如果需要）
    if (style.gradient) {
      svg += this.generateGradientDefs(labelColor, messageColor);
    }
    
    // 添加阴影（如果需要）
    if (style.shadow) {
      svg += this.generateShadowDefs();
    }
    
    // 背景矩形
    const borderRadius = style.borderRadius || 0;
    
    // 标签背景
    svg += `<rect width="${labelWidth + logoSpace}" height="${height}" fill="${labelColor}"`;
    if (borderRadius > 0) {
      svg += ` rx="${borderRadius}"`;
    }
    if (style.shadow) {
      svg += ` filter="url(#shadow)"`;
    }
    svg += '/>';
    
    // 消息背景
    svg += `<rect x="${labelWidth + logoSpace}" width="${messageWidth}" height="${height}" fill="${messageColor}"`;
    if (borderRadius > 0) {
      svg += ` rx="${borderRadius}"`;
    }
    if (style.shadow) {
      svg += ` filter="url(#shadow)"`;
    }
    svg += '/>';
    
    // Logo（如果有）
    if (logo) {
      svg += `<image x="5" y="${(height - logoWidth) / 2}" width="${logoWidth}" height="${logoWidth}" xlink:href="${logo}"/>`;
    }
    
    // 标签文本
    const labelX = logoSpace + 5;
    const textY = height / 2 + 1;
    const fontSize = style.bold ? 11 : 10;
    const fontWeight = style.bold ? 'bold' : 'normal';
    const textTransform = style.uppercase ? 'uppercase' : 'none';
    
    svg += `<text x="${labelX}" y="${textY}" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="${fontSize}" font-weight="${fontWeight}" text-anchor="start" dominant-baseline="middle" fill="#fff" style="text-transform: ${textTransform}">${label}</text>`;
    
    // 消息文本
    const messageX = labelWidth + logoSpace + 5;
    svg += `<text x="${messageX}" y="${textY}" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="${fontSize}" font-weight="${fontWeight}" text-anchor="start" dominant-baseline="middle" fill="#fff" style="text-transform: ${textTransform}">${message}</text>`;
    
    svg += '</svg>';
    
    return svg;
  }
  
  // 生成JSON徽章数据
  generateJSONBadge(options) {
    return {
      schemaVersion: 1,
      label: options.label,
      message: options.message,
      color: options.color,
      style: options.style
    };
  }
  
  // 生成Markdown徽章
  generateMarkdownBadge(options) {
    const { label, message, color } = options;
    const encodedLabel = encodeURIComponent(label);
    const encodedMessage = encodeURIComponent(message);
    const encodedColor = encodeURIComponent(color.replace('#', ''));
    
    const badgeUrl = `https://img.shields.io/badge/${encodedLabel}-${encodedMessage}-${encodedColor}`;
    
    return {
      markdown: `![${label}](${badgeUrl})`,
      url: badgeUrl,
      html: `<img src="${badgeUrl}" alt="${label}" />`
    };
  }
  
  // 生成渐变定义
  generateGradientDefs(labelColor, messageColor) {
    return `
      <defs>
        <linearGradient id="labelGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${this.lightenColor(labelColor, 0.1)};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${labelColor};stop-opacity:1" />
        </linearGradient>
        <linearGradient id="messageGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${this.lightenColor(messageColor, 0.1)};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${messageColor};stop-opacity:1" />
        </linearGradient>
      </defs>
    `;
  }
  
  // 生成阴影定义
  generateShadowDefs() {
    return `
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#000" flood-opacity="0.3"/>
        </filter>
      </defs>
    `;
  }
  
  // 获取覆盖率颜色
  getCoverageColor(coverage) {
    if (coverage >= 90) return COLORS.coverage.excellent;
    if (coverage >= 80) return COLORS.coverage.good;
    if (coverage >= 70) return COLORS.coverage.fair;
    if (coverage >= 60) return COLORS.coverage.poor;
    return COLORS.coverage.critical;
  }
  
  // 解析颜色
  resolveColor(color) {
    // 如果是预定义颜色名称
    if (COLORS[color]) {
      return COLORS[color];
    }
    
    // 如果是自定义颜色
    if (this.customColors[color]) {
      return this.customColors[color];
    }
    
    // 如果是十六进制颜色
    if (color.startsWith('#')) {
      return color;
    }
    
    // 默认颜色
    return COLORS.lightgrey;
  }
  
  // 计算文本宽度（近似）
  calculateTextWidth(text) {
    // 简单的字符宽度估算
    const charWidths = {
      'i': 3, 'l': 3, 't': 4, 'f': 4, 'j': 4,
      'r': 4, 'I': 4, '1': 6, ' ': 4, '.': 3,
      ',': 3, ':': 3, ';': 3, '!': 3, '|': 3
    };
    
    let width = 0;
    for (const char of text) {
      width += charWidths[char] || 6; // 默认字符宽度
    }
    
    return width;
  }
  
  // 颜色变亮
  lightenColor(color, amount) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.min(255, Math.floor(r + (255 - r) * amount));
    const newG = Math.min(255, Math.floor(g + (255 - g) * amount));
    const newB = Math.min(255, Math.floor(b + (255 - b) * amount));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }
  
  // 保存徽章到文件
  saveBadge(badge, filePath, format = 'svg') {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    let content;
    switch (format) {
      case 'svg':
        content = badge;
        break;
      case 'json':
        content = JSON.stringify(badge, null, 2);
        break;
      case 'markdown':
        content = badge.markdown;
        break;
      default:
        throw new Error(`不支持的保存格式: ${format}`);
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
  }
  
  // 批量生成项目徽章
  generateProjectBadges(coverageData, outputDir = './coverage-reports/badges') {
    const badges = {};
    
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 为每个项目生成徽章
    Object.entries(coverageData.projects).forEach(([projectKey, project]) => {
      if (project.status === 'success' && project.coverage) {
        const coverage = project.coverage.lines;
        
        // 生成不同格式的徽章
        const svgBadge = this.generateCoverageBadge(coverage, {
          label: 'coverage',
          style: 'flat',
          format: 'svg'
        });
        
        const jsonBadge = this.generateCoverageBadge(coverage, {
          label: 'coverage',
          style: 'flat',
          format: 'json'
        });
        
        const markdownBadge = this.generateCoverageBadge(coverage, {
          label: 'coverage',
          style: 'flat',
          format: 'markdown'
        });
        
        // 保存徽章文件
        this.saveBadge(svgBadge, path.join(outputDir, `${projectKey}-coverage.svg`), 'svg');
        this.saveBadge(jsonBadge, path.join(outputDir, `${projectKey}-coverage.json`), 'json');
        this.saveBadge(markdownBadge.markdown, path.join(outputDir, `${projectKey}-coverage.md`), 'markdown');
        
        badges[projectKey] = {
          svg: svgBadge,
          json: jsonBadge,
          markdown: markdownBadge,
          coverage: coverage
        };
      }
    });
    
    // 生成总体徽章
    const avgCoverage = coverageData.summary.averageCoverage;
    const overallBadge = this.generateCoverageBadge(avgCoverage, {
      label: 'overall coverage',
      style: 'for-the-badge',
      format: 'svg'
    });
    
    this.saveBadge(overallBadge, path.join(outputDir, 'overall-coverage.svg'), 'svg');
    
    badges.overall = {
      svg: overallBadge,
      coverage: avgCoverage
    };
    
    return badges;
  }
  
  // 生成README徽章代码
  generateReadmeBadges(badges, options = {}) {
    const {
      baseUrl = './coverage-reports/badges',
      format = 'markdown'
    } = options;
    
    let content = '';
    
    if (format === 'markdown') {
      content += '## 📊 测试覆盖率\n\n';
      
      // 总体覆盖率
      if (badges.overall) {
        content += `![Overall Coverage](${baseUrl}/overall-coverage.svg)\n\n`;
      }
      
      // 各项目覆盖率
      content += '### 项目覆盖率\n\n';
      Object.entries(badges).forEach(([projectKey, badge]) => {
        if (projectKey !== 'overall') {
          content += `**${projectKey}**: ![Coverage](${baseUrl}/${projectKey}-coverage.svg)\n\n`;
        }
      });
    } else if (format === 'html') {
      content += '<h2>📊 测试覆盖率</h2>\n';
      
      // 总体覆盖率
      if (badges.overall) {
        content += `<p><img src="${baseUrl}/overall-coverage.svg" alt="Overall Coverage" /></p>\n`;
      }
      
      // 各项目覆盖率
      content += '<h3>项目覆盖率</h3>\n';
      Object.entries(badges).forEach(([projectKey, badge]) => {
        if (projectKey !== 'overall') {
          content += `<p><strong>${projectKey}</strong>: <img src="${baseUrl}/${projectKey}-coverage.svg" alt="Coverage" /></p>\n`;
        }
      });
    }
    
    return content;
  }
}

// 命令行接口
class BadgeCLI {
  static async run() {
    const args = process.argv.slice(2);
    const command = args[0] || 'generate';
    
    try {
      switch (command) {
        case 'generate':
          await BadgeCLI.generateCommand(args.slice(1));
          break;
        case 'single':
          await BadgeCLI.singleCommand(args.slice(1));
          break;
        case 'readme':
          await BadgeCLI.readmeCommand(args.slice(1));
          break;
        case 'help':
        case '--help':
        case '-h':
          BadgeCLI.showHelp();
          break;
        default:
          console.error(`未知命令: ${command}`);
          BadgeCLI.showHelp();
          process.exit(1);
      }
    } catch (error) {
      console.error(`执行失败: ${error.message}`);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }
  
  static async generateCommand(args) {
    const options = BadgeCLI.parseOptions(args);
    
    // 读取覆盖率数据
    const dataFile = options.input || './coverage-reports/coverage-report.json';
    if (!fs.existsSync(dataFile)) {
      throw new Error(`覆盖率数据文件不存在: ${dataFile}`);
    }
    
    const coverageData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    
    // 创建徽章生成器
    const generator = new BadgeGenerator({
      style: options.style,
      theme: options.theme
    });
    
    // 生成徽章
    const badges = generator.generateProjectBadges(coverageData, options.output);
    
    console.log(`✅ 成功生成 ${Object.keys(badges).length} 个项目的覆盖率徽章`);
    console.log(`📁 输出目录: ${options.output}`);
    
    // 生成README代码（如果需要）
    if (options.readme) {
      const readmeContent = generator.generateReadmeBadges(badges, {
        baseUrl: options.baseUrl,
        format: options.readmeFormat
      });
      
      fs.writeFileSync(options.readme, readmeContent, 'utf8');
      console.log(`📝 README徽章代码已生成: ${options.readme}`);
    }
  }
  
  static async singleCommand(args) {
    const options = BadgeCLI.parseOptions(args);
    
    if (!options.coverage) {
      throw new Error('请指定覆盖率值 (--coverage)');
    }
    
    const generator = new BadgeGenerator({
      style: options.style,
      theme: options.theme
    });
    
    const badge = generator.generateCoverageBadge(parseFloat(options.coverage), {
      label: options.label || 'coverage',
      style: options.style || 'flat',
      format: options.format || 'svg'
    });
    
    if (options.output) {
      generator.saveBadge(badge, options.output, options.format || 'svg');
      console.log(`✅ 徽章已保存: ${options.output}`);
    } else {
      console.log(badge);
    }
  }
  
  static async readmeCommand(args) {
    const options = BadgeCLI.parseOptions(args);
    
    // 读取徽章数据
    const badgesDir = options.input || './coverage-reports/badges';
    if (!fs.existsSync(badgesDir)) {
      throw new Error(`徽章目录不存在: ${badgesDir}`);
    }
    
    // 扫描徽章文件
    const badges = {};
    const files = fs.readdirSync(badgesDir);
    
    files.forEach(file => {
      if (file.endsWith('-coverage.svg')) {
        const projectKey = file.replace('-coverage.svg', '');
        badges[projectKey] = {
          svg: file
        };
      }
    });
    
    const generator = new BadgeGenerator();
    const readmeContent = generator.generateReadmeBadges(badges, {
      baseUrl: options.baseUrl || './coverage-reports/badges',
      format: options.format || 'markdown'
    });
    
    if (options.output) {
      fs.writeFileSync(options.output, readmeContent, 'utf8');
      console.log(`📝 README内容已生成: ${options.output}`);
    } else {
      console.log(readmeContent);
    }
  }
  
  static parseOptions(args) {
    const options = {
      style: 'flat',
      theme: 'default',
      format: 'svg',
      output: './coverage-reports/badges',
      readmeFormat: 'markdown'
    };
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--input':
        case '-i':
          options.input = args[++i];
          break;
        case '--output':
        case '-o':
          options.output = args[++i];
          break;
        case '--style':
        case '-s':
          options.style = args[++i];
          break;
        case '--theme':
        case '-t':
          options.theme = args[++i];
          break;
        case '--format':
        case '-f':
          options.format = args[++i];
          break;
        case '--coverage':
        case '-c':
          options.coverage = args[++i];
          break;
        case '--label':
        case '-l':
          options.label = args[++i];
          break;
        case '--readme':
          options.readme = args[++i];
          break;
        case '--readme-format':
          options.readmeFormat = args[++i];
          break;
        case '--base-url':
          options.baseUrl = args[++i];
          break;
      }
    }
    
    return options;
  }
  
  static showHelp() {
    console.log(`
🏷️  PhoenixCoder 覆盖率徽章生成器\n`);
    console.log('用法:');
    console.log('  node coverage-badge-generator.js <command> [options]\n');
    
    console.log('命令:');
    console.log('  generate  从覆盖率报告生成徽章 (默认)');
    console.log('  single    生成单个徽章');
    console.log('  readme    生成README徽章代码');
    console.log('  help      显示帮助信息\n');
    
    console.log('选项:');
    console.log('  --input, -i <file>       输入文件路径');
    console.log('  --output, -o <dir>       输出目录路径');
    console.log('  --style, -s <style>      徽章样式 (flat|flat-square|for-the-badge|plastic|social)');
    console.log('  --theme, -t <theme>      徽章主题');
    console.log('  --format, -f <format>    输出格式 (svg|json|markdown)');
    console.log('  --coverage, -c <num>     覆盖率值 (single命令)');
    console.log('  --label, -l <text>       徽章标签 (single命令)');
    console.log('  --readme <file>          生成README文件');
    console.log('  --readme-format <fmt>    README格式 (markdown|html)');
    console.log('  --base-url <url>         徽章基础URL\n');
    
    console.log('示例:');
    console.log('  node coverage-badge-generator.js generate');
    console.log('  node coverage-badge-generator.js single --coverage 85.5 --output badge.svg');
    console.log('  node coverage-badge-generator.js readme --output README-badges.md\n');
  }
}

// 如果直接运行此文件
if (require.main === module) {
  BadgeCLI.run();
}

module.exports = {
  BadgeGenerator,
  BadgeCLI,
  BADGE_STYLES,
  COLORS
};