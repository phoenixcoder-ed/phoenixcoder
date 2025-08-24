#!/usr/bin/env python3

"""
徽章生成脚本
用于生成项目的各种状态徽章
"""

import os
import sys
import json
import yaml
import requests
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

# 颜色定义
class Colors:
    RESET = '\033[0m'
    RED = '\033[31m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    MAGENTA = '\033[35m'
    CYAN = '\033[36m'

# 日志函数
def log_info(msg: str) -> None:
    print(f"{Colors.BLUE}[INFO]{Colors.RESET} {msg}")

def log_success(msg: str) -> None:
    print(f"{Colors.GREEN}[SUCCESS]{Colors.RESET} {msg}")

def log_warning(msg: str) -> None:
    print(f"{Colors.YELLOW}[WARNING]{Colors.RESET} {msg}")

def log_error(msg: str) -> None:
    print(f"{Colors.RED}[ERROR]{Colors.RESET} {msg}")

def log_badge(msg: str) -> None:
    print(f"{Colors.MAGENTA}[BADGE]{Colors.RESET} {msg}")

# 徽章配置
BADGE_CONFIG = {
    'shields_io_base': 'https://img.shields.io',
    'colors': {
        'success': 'brightgreen',
        'warning': 'yellow',
        'error': 'red',
        'info': 'blue',
        'inactive': 'lightgrey'
    },
    'styles': {
        'flat': 'flat',
        'flat_square': 'flat-square',
        'plastic': 'plastic',
        'for_the_badge': 'for-the-badge'
    }
}

class BadgeGenerator:
    """徽章生成器"""
    
    def __init__(self, config_path: str = 'config/badges.yml'):
        self.config_path = config_path
        self.config = self.load_config()
        self.badges = []
        
    def load_config(self) -> Dict[str, Any]:
        """加载徽章配置"""
        try:
            config_file = Path(self.config_path)
            if config_file.exists():
                with open(config_file, 'r', encoding='utf-8') as f:
                    return yaml.safe_load(f)
            else:
                log_warning(f"配置文件不存在: {self.config_path}，使用默认配置")
                return self.get_default_config()
        except Exception as e:
            log_error(f"加载配置失败: {e}")
            return self.get_default_config()
    
    def get_default_config(self) -> Dict[str, Any]:
        """获取默认配置"""
        return {
            'badge_config': {
                'style': 'flat',
                'logo_height': 20
            },
            'technology_badges': {
                'python': {
                    'label': 'Python',
                    'logo': 'python',
                    'colors': {'background': '3776ab', 'text': 'white'}
                },
                'typescript': {
                    'label': 'TypeScript',
                    'logo': 'typescript',
                    'colors': {'background': '3178c6', 'text': 'white'}
                },
                'react': {
                    'label': 'React',
                    'logo': 'react',
                    'colors': {'background': '61dafb', 'text': 'black'}
                }
            },
            'project_badges': {
                'version': {
                    'label': 'Version',
                    'data_source': 'package.json',
                    'colors': {'background': 'blue', 'text': 'white'}
                },
                'license': {
                    'label': 'License',
                    'data_source': 'package.json',
                    'colors': {'background': 'green', 'text': 'white'}
                }
            }
        }
    
    def get_git_info(self) -> Dict[str, str]:
        """获取Git信息"""
        try:
            # 获取当前分支
            branch = subprocess.check_output(
                ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
                encoding='utf-8'
            ).strip()
            
            # 获取最新提交
            commit = subprocess.check_output(
                ['git', 'rev-parse', 'HEAD'],
                encoding='utf-8'
            ).strip()[:8]
            
            # 获取提交数量
            commit_count = subprocess.check_output(
                ['git', 'rev-list', '--count', 'HEAD'],
                encoding='utf-8'
            ).strip()
            
            return {
                'branch': branch,
                'commit': commit,
                'commit_count': commit_count
            }
        except Exception as e:
            log_warning(f"获取Git信息失败: {e}")
            return {
                'branch': 'unknown',
                'commit': 'unknown',
                'commit_count': '0'
            }
    
    def get_package_info(self) -> Dict[str, Any]:
        """获取包信息"""
        try:
            with open('package.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            log_warning(f"读取package.json失败: {e}")
            return {
                'name': 'unknown',
                'version': '0.0.0',
                'license': 'unknown'
            }
    
    def get_test_coverage(self) -> Optional[Dict[str, float]]:
        """获取测试覆盖率"""
        coverage_file = Path('coverage/coverage-summary.json')
        if coverage_file.exists():
            try:
                with open(coverage_file, 'r', encoding='utf-8') as f:
                    coverage_data = json.load(f)
                    if 'total' in coverage_data:
                        return {
                            'lines': coverage_data['total']['lines']['pct'],
                            'functions': coverage_data['total']['functions']['pct'],
                            'branches': coverage_data['total']['branches']['pct'],
                            'statements': coverage_data['total']['statements']['pct']
                        }
            except Exception as e:
                log_warning(f"读取覆盖率数据失败: {e}")
        return None
    
    def get_build_status(self) -> str:
        """获取构建状态"""
        # 检查是否存在构建产物
        if Path('dist').exists() or Path('build').exists():
            return 'passing'
        return 'unknown'
    
    def get_dependency_count(self) -> Dict[str, int]:
        """获取依赖数量"""
        package_info = self.get_package_info()
        return {
            'dependencies': len(package_info.get('dependencies', {})),
            'devDependencies': len(package_info.get('devDependencies', {}))
        }
    
    def create_shield_url(self, label: str, message: str, color: str, 
                         logo: Optional[str] = None, style: str = 'flat') -> str:
        """创建Shields.io徽章URL"""
        base_url = BADGE_CONFIG['shields_io_base']
        
        # URL编码标签和消息
        label = label.replace('-', '--').replace('_', '__').replace(' ', '_')
        message = str(message).replace('-', '--').replace('_', '__').replace(' ', '_')
        
        url = f"{base_url}/badge/{label}-{message}-{color}"
        
        params = []
        if style != 'flat':
            params.append(f"style={style}")
        if logo:
            params.append(f"logo={logo}")
        
        if params:
            url += '?' + '&'.join(params)
        
        return url
    
    def generate_technology_badges(self) -> List[Dict[str, str]]:
        """生成技术栈徽章"""
        badges = []
        tech_config = self.config.get('technology_badges', {})
        
        for tech, config in tech_config.items():
            label = config.get('label', tech.title())
            logo = config.get('logo', tech)
            colors = config.get('colors', {})
            color = colors.get('background', 'blue')
            
            url = self.create_shield_url(
                label=label,
                message='',
                color=color,
                logo=logo,
                style=self.config.get('badge_config', {}).get('style', 'flat')
            )
            
            badges.append({
                'name': f'{tech}_badge',
                'label': label,
                'url': url,
                'type': 'technology'
            })
        
        return badges
    
    def generate_project_badges(self) -> List[Dict[str, str]]:
        """生成项目信息徽章"""
        badges = []
        project_config = self.config.get('project_badges', {})
        package_info = self.get_package_info()
        git_info = self.get_git_info()
        
        # 版本徽章
        if 'version' in project_config:
            version = package_info.get('version', '0.0.0')
            url = self.create_shield_url('Version', version, 'blue')
            badges.append({
                'name': 'version_badge',
                'label': 'Version',
                'url': url,
                'type': 'project'
            })
        
        # 许可证徽章
        if 'license' in project_config:
            license_name = package_info.get('license', 'Unknown')
            url = self.create_shield_url('License', license_name, 'green')
            badges.append({
                'name': 'license_badge',
                'label': 'License',
                'url': url,
                'type': 'project'
            })
        
        # 提交数徽章
        commit_count = git_info.get('commit_count', '0')
        url = self.create_shield_url('Commits', commit_count, 'blue')
        badges.append({
            'name': 'commits_badge',
            'label': 'Commits',
            'url': url,
            'type': 'project'
        })
        
        return badges
    
    def generate_build_badges(self) -> List[Dict[str, str]]:
        """生成构建状态徽章"""
        badges = []
        
        # 构建状态
        build_status = self.get_build_status()
        color = 'brightgreen' if build_status == 'passing' else 'red'
        url = self.create_shield_url('Build', build_status, color)
        badges.append({
            'name': 'build_badge',
            'label': 'Build',
            'url': url,
            'type': 'build'
        })
        
        # 测试覆盖率
        coverage = self.get_test_coverage()
        if coverage:
            lines_coverage = coverage.get('lines', 0)
            if lines_coverage >= 80:
                color = 'brightgreen'
            elif lines_coverage >= 60:
                color = 'yellow'
            else:
                color = 'red'
            
            url = self.create_shield_url('Coverage', f"{lines_coverage}%", color)
            badges.append({
                'name': 'coverage_badge',
                'label': 'Coverage',
                'url': url,
                'type': 'build'
            })
        
        return badges
    
    def generate_dependency_badges(self) -> List[Dict[str, str]]:
        """生成依赖徽章"""
        badges = []
        deps = self.get_dependency_count()
        
        # 生产依赖
        dep_count = deps.get('dependencies', 0)
        url = self.create_shield_url('Dependencies', str(dep_count), 'blue')
        badges.append({
            'name': 'dependencies_badge',
            'label': 'Dependencies',
            'url': url,
            'type': 'dependency'
        })
        
        # 开发依赖
        dev_dep_count = deps.get('devDependencies', 0)
        url = self.create_shield_url('Dev Dependencies', str(dev_dep_count), 'lightgrey')
        badges.append({
            'name': 'dev_dependencies_badge',
            'label': 'Dev Dependencies',
            'url': url,
            'type': 'dependency'
        })
        
        return badges
    
    def generate_custom_badges(self) -> List[Dict[str, str]]:
        """生成自定义徽章"""
        badges = []
        custom_config = self.config.get('custom_badges', {})
        
        for badge_name, config in custom_config.items():
            label = config.get('label', badge_name.title())
            
            # 根据数据源获取值
            data_source = config.get('data_source')
            value = self.get_custom_badge_value(data_source, config)
            
            if value is not None:
                color = self.get_badge_color(value, config.get('thresholds', {}))
                url = self.create_shield_url(label, str(value), color)
                
                badges.append({
                    'name': f'{badge_name}_badge',
                    'label': label,
                    'url': url,
                    'type': 'custom'
                })
        
        return badges
    
    def get_custom_badge_value(self, data_source: str, config: Dict[str, Any]) -> Optional[str]:
        """获取自定义徽章值"""
        if data_source == 'file_count':
            # 统计代码行数
            try:
                result = subprocess.check_output(
                    ['find', '.', '-name', '*.py', '-o', '-name', '*.js', '-o', '-name', '*.ts', '|', 'wc', '-l'],
                    shell=True,
                    encoding='utf-8'
                ).strip()
                return result
            except:
                return None
        
        elif data_source == 'code_lines':
            # 统计代码行数
            try:
                result = subprocess.check_output(
                    ['find', '.', '-name', '*.py', '-o', '-name', '*.js', '-o', '-name', '*.ts', '-exec', 'wc', '-l', '{}', '+'],
                    shell=True,
                    encoding='utf-8'
                )
                lines = sum(int(line.split()[0]) for line in result.strip().split('\n') if line.strip())
                return str(lines)
            except:
                return None
        
        return None
    
    def get_badge_color(self, value: str, thresholds: Dict[str, Any]) -> str:
        """根据阈值获取徽章颜色"""
        try:
            num_value = float(value)
            
            if 'good' in thresholds and num_value >= thresholds['good']:
                return 'brightgreen'
            elif 'warning' in thresholds and num_value >= thresholds['warning']:
                return 'yellow'
            else:
                return 'red'
        except:
            return 'blue'
    
    def generate_all_badges(self) -> List[Dict[str, str]]:
        """生成所有徽章"""
        all_badges = []
        
        log_badge("生成技术栈徽章...")
        all_badges.extend(self.generate_technology_badges())
        
        log_badge("生成项目信息徽章...")
        all_badges.extend(self.generate_project_badges())
        
        log_badge("生成构建状态徽章...")
        all_badges.extend(self.generate_build_badges())
        
        log_badge("生成依赖徽章...")
        all_badges.extend(self.generate_dependency_badges())
        
        log_badge("生成自定义徽章...")
        all_badges.extend(self.generate_custom_badges())
        
        return all_badges
    
    def save_badges(self, badges: List[Dict[str, str]], output_file: str = 'badges.json') -> bool:
        """保存徽章数据"""
        try:
            output_path = Path(output_file)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            badge_data = {
                'generated_at': datetime.now().isoformat(),
                'total_badges': len(badges),
                'badges': badges
            }
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(badge_data, f, indent=2, ensure_ascii=False)
            
            return True
        except Exception as e:
            log_error(f"保存徽章数据失败: {e}")
            return False
    
    def generate_markdown_badges(self, badges: List[Dict[str, str]]) -> str:
        """生成Markdown格式的徽章"""
        markdown = "# 项目徽章\n\n"
        
        # 按类型分组
        badge_groups = {}
        for badge in badges:
            badge_type = badge.get('type', 'other')
            if badge_type not in badge_groups:
                badge_groups[badge_type] = []
            badge_groups[badge_type].append(badge)
        
        # 生成各组徽章
        type_names = {
            'technology': '🛠️ 技术栈',
            'project': '📋 项目信息',
            'build': '🚀 构建状态',
            'dependency': '📦 依赖',
            'custom': '🎯 自定义'
        }
        
        for badge_type, group_badges in badge_groups.items():
            type_name = type_names.get(badge_type, badge_type.title())
            markdown += f"## {type_name}\n\n"
            
            for badge in group_badges:
                markdown += f"![{badge['label']}]({badge['url']}) "
            
            markdown += "\n\n"
        
        return markdown
    
    def save_markdown_badges(self, badges: List[Dict[str, str]], output_file: str = 'BADGES.md') -> bool:
        """保存Markdown格式的徽章"""
        try:
            markdown = self.generate_markdown_badges(badges)
            
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(markdown)
            
            return True
        except Exception as e:
            log_error(f"保存Markdown徽章失败: {e}")
            return False

def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='生成项目徽章')
    parser.add_argument('--config', '-c', default='config/badges.yml', help='徽章配置文件路径')
    parser.add_argument('--output', '-o', default='badges.json', help='输出JSON文件路径')
    parser.add_argument('--markdown', '-m', default='BADGES.md', help='输出Markdown文件路径')
    parser.add_argument('--type', '-t', choices=['all', 'technology', 'project', 'build', 'dependency', 'custom'], 
                       default='all', help='生成特定类型的徽章')
    
    args = parser.parse_args()
    
    log_info("开始生成徽章...")
    
    # 创建徽章生成器
    generator = BadgeGenerator(args.config)
    
    # 生成徽章
    if args.type == 'all':
        badges = generator.generate_all_badges()
    elif args.type == 'technology':
        badges = generator.generate_technology_badges()
    elif args.type == 'project':
        badges = generator.generate_project_badges()
    elif args.type == 'build':
        badges = generator.generate_build_badges()
    elif args.type == 'dependency':
        badges = generator.generate_dependency_badges()
    elif args.type == 'custom':
        badges = generator.generate_custom_badges()
    else:
        badges = []
    
    if not badges:
        log_warning("未生成任何徽章")
        return
    
    # 保存结果
    success_count = 0
    
    if generator.save_badges(badges, args.output):
        log_success(f"徽章数据已保存到: {args.output}")
        success_count += 1
    
    if generator.save_markdown_badges(badges, args.markdown):
        log_success(f"Markdown徽章已保存到: {args.markdown}")
        success_count += 1
    
    # 输出摘要
    print(f"\n📊 徽章生成摘要:")
    print(f"  总计: {len(badges)} 个徽章")
    
    badge_types = {}
    for badge in badges:
        badge_type = badge.get('type', 'other')
        badge_types[badge_type] = badge_types.get(badge_type, 0) + 1
    
    for badge_type, count in badge_types.items():
        print(f"  {badge_type}: {count} 个")
    
    if success_count > 0:
        log_success(f"徽章生成完成! 共保存 {success_count} 个文件")
    else:
        log_error("徽章生成失败")
        sys.exit(1)

if __name__ == '__main__':
    main()
