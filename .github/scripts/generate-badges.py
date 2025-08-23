#!/usr/bin/env python3
"""
PhoenixCoder CI/CD 状态徽章生成脚本
生成各种项目状态徽章和 README 文档
"""

import os
import sys
import json
import yaml
import argparse
import requests
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
from jinja2 import Template, Environment, FileSystemLoader
import logging
import base64
import urllib.parse

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class BadgeGenerator:
    """状态徽章生成器"""
    
    def __init__(self, config_path: str = None):
        self.config_path = config_path or '.github/config/notifications.yml'
        self.templates_dir = '.github/templates'
        self.output_dir = '.github/badges'
        self.config = self._load_config()
        self.jinja_env = Environment(
            loader=FileSystemLoader(self.templates_dir),
            autoescape=True
        )
        
        # 创建输出目录
        Path(self.output_dir).mkdir(parents=True, exist_ok=True)
        
    def _load_config(self) -> Dict:
        """加载配置"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            logger.error(f"配置文件未找到: {self.config_path}")
            return {}
        except yaml.YAMLError as e:
            logger.error(f"配置文件解析错误: {e}")
            return {}
    
    def _get_shield_url(self, label: str, message: str, color: str, style: str = 'flat') -> str:
        """生成 shields.io 徽章 URL"""
        base_url = 'https://img.shields.io/badge'
        encoded_label = urllib.parse.quote(label)
        encoded_message = urllib.parse.quote(message)
        return f"{base_url}/{encoded_label}-{encoded_message}-{color}?style={style}"
    
    def _get_color_for_percentage(self, percentage: float) -> str:
        """根据百分比获取颜色"""
        if percentage >= 90:
            return 'brightgreen'
        elif percentage >= 80:
            return 'green'
        elif percentage >= 70:
            return 'yellowgreen'
        elif percentage >= 60:
            return 'yellow'
        elif percentage >= 50:
            return 'orange'
        else:
            return 'red'
    
    def _get_color_for_status(self, status: str) -> str:
        """根据状态获取颜色"""
        status_colors = {
            'passing': 'brightgreen',
            'success': 'brightgreen',
            'stable': 'brightgreen',
            'failing': 'red',
            'failed': 'red',
            'error': 'red',
            'unstable': 'orange',
            'warning': 'yellow',
            'pending': 'yellow',
            'unknown': 'lightgrey',
            'disabled': 'lightgrey'
        }
        return status_colors.get(status.lower(), 'lightgrey')
    
    def generate_build_status_badge(self, workflow_data: Dict) -> Dict[str, str]:
        """生成构建状态徽章"""
        total_runs = workflow_data.get('total_runs', 0)
        successful_runs = workflow_data.get('successful_runs', 0)
        
        if total_runs == 0:
            status = 'unknown'
            color = 'lightgrey'
        else:
            success_rate = (successful_runs / total_runs) * 100
            if success_rate >= 90:
                status = 'passing'
            elif success_rate >= 70:
                status = 'unstable'
            else:
                status = 'failing'
            color = self._get_color_for_status(status)
        
        url = self._get_shield_url('build', status, color)
        
        return {
            'name': 'build_status',
            'label': 'Build',
            'message': status,
            'color': color,
            'url': url,
            'markdown': f'![Build Status]({url})'
        }
    
    def generate_success_rate_badge(self, workflow_data: Dict) -> Dict[str, str]:
        """生成成功率徽章"""
        total_runs = workflow_data.get('total_runs', 0)
        successful_runs = workflow_data.get('successful_runs', 0)
        
        if total_runs == 0:
            success_rate = 0
        else:
            success_rate = (successful_runs / total_runs) * 100
        
        color = self._get_color_for_percentage(success_rate)
        message = f'{success_rate:.1f}%'
        
        url = self._get_shield_url('success rate', message, color)
        
        return {
            'name': 'success_rate',
            'label': 'Success Rate',
            'message': message,
            'color': color,
            'url': url,
            'markdown': f'![Success Rate]({url})'
        }
    
    def generate_test_coverage_badge(self, coverage_data: Dict) -> Dict[str, str]:
        """生成测试覆盖率徽章"""
        coverage = coverage_data.get('coverage', 0)
        color = self._get_color_for_percentage(coverage)
        message = f'{coverage:.1f}%'
        
        url = self._get_shield_url('coverage', message, color)
        
        return {
            'name': 'test_coverage',
            'label': 'Coverage',
            'message': message,
            'color': color,
            'url': url,
            'markdown': f'![Test Coverage]({url})'
        }
    
    def generate_code_quality_badge(self, quality_data: Dict) -> Dict[str, str]:
        """生成代码质量徽章"""
        quality_gate = quality_data.get('quality_gate', 'unknown')
        
        if quality_gate.lower() in ['passed', 'ok', 'success']:
            status = 'A'
            color = 'brightgreen'
        elif quality_gate.lower() in ['warning', 'minor_issues']:
            status = 'B'
            color = 'yellow'
        elif quality_gate.lower() in ['failed', 'error', 'major_issues']:
            status = 'C'
            color = 'red'
        else:
            status = 'unknown'
            color = 'lightgrey'
        
        url = self._get_shield_url('quality', status, color)
        
        return {
            'name': 'code_quality',
            'label': 'Quality',
            'message': status,
            'color': color,
            'url': url,
            'markdown': f'![Code Quality]({url})'
        }
    
    def generate_security_badge(self, security_data: Dict) -> Dict[str, str]:
        """生成安全扫描徽章"""
        vulnerabilities = security_data.get('vulnerabilities', 0)
        critical = security_data.get('critical', 0)
        high = security_data.get('high', 0)
        
        if critical > 0:
            status = 'critical'
            color = 'red'
        elif high > 0:
            status = 'high'
            color = 'orange'
        elif vulnerabilities > 0:
            status = 'medium'
            color = 'yellow'
        else:
            status = 'secure'
            color = 'brightgreen'
        
        url = self._get_shield_url('security', status, color)
        
        return {
            'name': 'security',
            'label': 'Security',
            'message': status,
            'color': color,
            'url': url,
            'markdown': f'![Security]({url})'
        }
    
    def generate_deployment_badge(self, deployment_data: Dict) -> Dict[str, str]:
        """生成部署状态徽章"""
        environments = deployment_data.get('environments', {})
        
        # 检查生产环境状态
        prod_status = environments.get('production', {}).get('status', 'unknown')
        
        if prod_status == 'deployed':
            status = 'deployed'
            color = 'brightgreen'
        elif prod_status == 'deploying':
            status = 'deploying'
            color = 'yellow'
        elif prod_status == 'failed':
            status = 'failed'
            color = 'red'
        else:
            status = 'unknown'
            color = 'lightgrey'
        
        url = self._get_shield_url('deployment', status, color)
        
        return {
            'name': 'deployment',
            'label': 'Deployment',
            'message': status,
            'color': color,
            'url': url,
            'markdown': f'![Deployment]({url})'
        }
    
    def generate_uptime_badge(self, uptime_data: Dict) -> Dict[str, str]:
        """生成正常运行时间徽章"""
        uptime = uptime_data.get('uptime', 0)
        color = self._get_color_for_percentage(uptime)
        message = f'{uptime:.2f}%'
        
        url = self._get_shield_url('uptime', message, color)
        
        return {
            'name': 'uptime',
            'label': 'Uptime',
            'message': message,
            'color': color,
            'url': url,
            'markdown': f'![Uptime]({url})'
        }
    
    def generate_version_badge(self, version_data: Dict) -> Dict[str, str]:
        """生成版本徽章"""
        version = version_data.get('version', 'unknown')
        color = 'blue'
        
        url = self._get_shield_url('version', version, color)
        
        return {
            'name': 'version',
            'label': 'Version',
            'message': version,
            'color': color,
            'url': url,
            'markdown': f'![Version]({url})'
        }
    
    def generate_license_badge(self, license_info: str = 'MIT') -> Dict[str, str]:
        """生成许可证徽章"""
        color = 'blue'
        url = self._get_shield_url('license', license_info, color)
        
        return {
            'name': 'license',
            'label': 'License',
            'message': license_info,
            'color': color,
            'url': url,
            'markdown': f'![License]({url})'
        }
    
    def generate_tech_stack_badges(self, tech_stack: Dict) -> List[Dict[str, str]]:
        """生成技术栈徽章"""
        badges = []
        
        tech_colors = {
            'node.js': '339933',
            'python': '3776AB',
            'typescript': '3178C6',
            'react': '61DAFB',
            'vue': '4FC08D',
            'docker': '2496ED',
            'kubernetes': '326CE5',
            'postgresql': '336791',
            'redis': 'DC382D',
            'nginx': '009639',
            'github actions': '2088FF'
        }
        
        for tech, version in tech_stack.items():
            tech_lower = tech.lower()
            color = tech_colors.get(tech_lower, 'lightgrey')
            
            if version:
                message = version
            else:
                message = 'latest'
            
            url = self._get_shield_url(tech, message, color)
            
            badges.append({
                'name': f'tech_{tech_lower.replace(".", "_").replace(" ", "_")}',
                'label': tech,
                'message': message,
                'color': color,
                'url': url,
                'markdown': f'![{tech}]({url})'
            })
        
        return badges
    
    def generate_last_updated_badge(self) -> Dict[str, str]:
        """生成最后更新时间徽章"""
        now = datetime.now()
        message = now.strftime('%Y-%m-%d')
        color = 'blue'
        
        url = self._get_shield_url('last updated', message, color)
        
        return {
            'name': 'last_updated',
            'label': 'Last Updated',
            'message': message,
            'color': color,
            'url': url,
            'markdown': f'![Last Updated]({url})'
        }
    
    def generate_all_badges(self, data: Dict) -> Dict[str, Any]:
        """生成所有徽章"""
        badges = {}
        
        # 基础状态徽章
        if 'workflow_stats' in data:
            badges['build_status'] = self.generate_build_status_badge(data['workflow_stats'])
            badges['success_rate'] = self.generate_success_rate_badge(data['workflow_stats'])
        
        # 测试覆盖率徽章
        if 'code_quality' in data:
            badges['test_coverage'] = self.generate_test_coverage_badge(data['code_quality'])
            badges['code_quality'] = self.generate_code_quality_badge(data['code_quality'])
        
        # 安全徽章
        if 'security_results' in data:
            badges['security'] = self.generate_security_badge(data['security_results'])
        
        # 部署状态徽章
        if 'deployment_stats' in data:
            badges['deployment'] = self.generate_deployment_badge(data['deployment_stats'])
        
        # 正常运行时间徽章
        if 'performance_metrics' in data:
            badges['uptime'] = self.generate_uptime_badge(data['performance_metrics'])
        
        # 版本徽章
        if 'version' in data:
            badges['version'] = self.generate_version_badge(data['version'])
        
        # 许可证徽章
        badges['license'] = self.generate_license_badge(data.get('license', 'MIT'))
        
        # 技术栈徽章
        if 'tech_stack' in data:
            tech_badges = self.generate_tech_stack_badges(data['tech_stack'])
            for badge in tech_badges:
                badges[badge['name']] = badge
        
        # 最后更新时间徽章
        badges['last_updated'] = self.generate_last_updated_badge()
        
        return badges
    
    def save_badges_json(self, badges: Dict[str, Any], filename: str = 'badges.json') -> str:
        """保存徽章数据为 JSON 文件"""
        output_path = Path(self.output_dir) / filename
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(badges, f, indent=2, ensure_ascii=False)
        
        logger.info(f"徽章数据已保存到: {output_path}")
        return str(output_path)
    
    def save_badges_markdown(self, badges: Dict[str, Any], filename: str = 'badges.md') -> str:
        """保存徽章为 Markdown 文件"""
        output_path = Path(self.output_dir) / filename
        
        markdown_content = "# PhoenixCoder 项目状态徽章\n\n"
        
        # 按类别组织徽章
        categories = {
            '构建状态': ['build_status', 'success_rate'],
            '代码质量': ['test_coverage', 'code_quality'],
            '安全': ['security'],
            '部署': ['deployment', 'uptime'],
            '项目信息': ['version', 'license', 'last_updated'],
            '技术栈': [name for name in badges.keys() if name.startswith('tech_')]
        }
        
        for category, badge_names in categories.items():
            if any(name in badges for name in badge_names):
                markdown_content += f"## {category}\n\n"
                
                for badge_name in badge_names:
                    if badge_name in badges:
                        badge = badges[badge_name]
                        markdown_content += f"{badge['markdown']} "
                
                markdown_content += "\n\n"
        
        # 添加使用说明
        markdown_content += """
## 使用说明

这些徽章可以直接复制到项目的 README.md 文件中：

```markdown
<!-- 项目状态 -->
"""
        
        # 添加主要徽章的示例
        main_badges = ['build_status', 'success_rate', 'test_coverage', 'code_quality', 'security']
        for badge_name in main_badges:
            if badge_name in badges:
                badge = badges[badge_name]
                markdown_content += f"{badge['markdown']} "
        
        markdown_content += "\n```\n"
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(markdown_content)
        
        logger.info(f"徽章 Markdown 已保存到: {output_path}")
        return str(output_path)
    
    def update_readme_badges(self, badges: Dict[str, Any], readme_path: str = 'README.md') -> bool:
        """更新 README 文件中的徽章"""
        if not Path(readme_path).exists():
            logger.warning(f"README 文件不存在: {readme_path}")
            return False
        
        try:
            with open(readme_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 查找徽章区域
            badge_start = '<!-- BADGES_START -->'
            badge_end = '<!-- BADGES_END -->'
            
            start_index = content.find(badge_start)
            end_index = content.find(badge_end)
            
            if start_index == -1 or end_index == -1:
                logger.warning("README 中未找到徽章标记区域")
                return False
            
            # 生成新的徽章内容
            new_badges_content = f"{badge_start}\n"
            
            # 添加主要徽章
            main_badges = ['build_status', 'success_rate', 'test_coverage', 'code_quality', 'security']
            for badge_name in main_badges:
                if badge_name in badges:
                    new_badges_content += f"{badges[badge_name]['markdown']} "
            
            new_badges_content += f"\n{badge_end}"
            
            # 替换内容
            new_content = (
                content[:start_index] + 
                new_badges_content + 
                content[end_index + len(badge_end):]
            )
            
            with open(readme_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            logger.info(f"README 徽章已更新: {readme_path}")
            return True
            
        except Exception as e:
            logger.error(f"更新 README 徽章失败: {e}")
            return False
    
    def generate_status_summary(self, badges: Dict[str, Any]) -> Dict[str, Any]:
        """生成状态摘要"""
        summary = {
            'generated_at': datetime.now().isoformat(),
            'total_badges': len(badges),
            'categories': {},
            'status_overview': {}
        }
        
        # 统计各类别徽章数量
        categories = {
            'build': [name for name in badges.keys() if 'build' in name or 'success' in name],
            'quality': [name for name in badges.keys() if 'coverage' in name or 'quality' in name],
            'security': [name for name in badges.keys() if 'security' in name],
            'deployment': [name for name in badges.keys() if 'deployment' in name or 'uptime' in name],
            'tech_stack': [name for name in badges.keys() if name.startswith('tech_')],
            'info': [name for name in badges.keys() if name in ['version', 'license', 'last_updated']]
        }
        
        for category, badge_names in categories.items():
            summary['categories'][category] = len(badge_names)
        
        # 生成状态概览
        if 'build_status' in badges:
            summary['status_overview']['build'] = badges['build_status']['message']
        
        if 'code_quality' in badges:
            summary['status_overview']['quality'] = badges['code_quality']['message']
        
        if 'security' in badges:
            summary['status_overview']['security'] = badges['security']['message']
        
        if 'deployment' in badges:
            summary['status_overview']['deployment'] = badges['deployment']['message']
        
        return summary

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='PhoenixCoder CI/CD 状态徽章生成器')
    parser.add_argument('--data', required=True, help='状态数据 JSON 文件路径')
    parser.add_argument('--config', help='配置文件路径')
    parser.add_argument('--output-dir', help='输出目录路径')
    parser.add_argument('--update-readme', help='更新 README 文件路径')
    
    args = parser.parse_args()
    
    # 加载状态数据
    try:
        with open(args.data, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        logger.error(f"加载状态数据失败: {e}")
        sys.exit(1)
    
    # 创建徽章生成器
    generator = BadgeGenerator(args.config)
    
    if args.output_dir:
        generator.output_dir = args.output_dir
        Path(generator.output_dir).mkdir(parents=True, exist_ok=True)
    
    # 生成所有徽章
    badges = generator.generate_all_badges(data)
    
    # 保存徽章数据
    json_path = generator.save_badges_json(badges)
    md_path = generator.save_badges_markdown(badges)
    
    # 生成状态摘要
    summary = generator.generate_status_summary(badges)
    summary_path = Path(generator.output_dir) / 'summary.json'
    with open(summary_path, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    
    # 更新 README（如果指定）
    if args.update_readme:
        generator.update_readme_badges(badges, args.update_readme)
    
    logger.info(f"徽章生成完成:")
    logger.info(f"  JSON: {json_path}")
    logger.info(f"  Markdown: {md_path}")
    logger.info(f"  Summary: {summary_path}")
    logger.info(f"  总计: {len(badges)} 个徽章")

if __name__ == '__main__':
    main()