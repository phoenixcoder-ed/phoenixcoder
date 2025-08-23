#!/usr/bin/env python3
"""
PhoenixCoder CI/CD 通知发送脚本
支持 Slack、邮件、Teams 等多种通知渠道
"""

import os
import sys
import json
import yaml
import argparse
import requests
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from pathlib import Path
from typing import Dict, List, Optional, Any
from jinja2 import Template, Environment, FileSystemLoader
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class NotificationSender:
    """通知发送器主类"""
    
    def __init__(self, config_path: str = None):
        self.config_path = config_path or '.github/config/notifications.yml'
        self.templates_dir = '.github/templates'
        self.config = self._load_config()
        self.jinja_env = Environment(
            loader=FileSystemLoader(self.templates_dir),
            autoescape=True
        )
        
    def _load_config(self) -> Dict:
        """加载通知配置"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            logger.error(f"配置文件未找到: {self.config_path}")
            return {}
        except yaml.YAMLError as e:
            logger.error(f"配置文件解析错误: {e}")
            return {}
    
    def _get_secret(self, secret_name: str) -> Optional[str]:
        """获取环境变量中的密钥"""
        value = os.getenv(secret_name)
        if not value:
            logger.warning(f"环境变量 {secret_name} 未设置")
        return value
    
    def _should_send_notification(self, notification_type: str, event: str) -> bool:
        """检查是否应该发送通知"""
        # 检查静默时间
        if self.config.get('filtering', {}).get('quiet_hours', {}).get('enabled', False):
            quiet_config = self.config['filtering']['quiet_hours']
            now = datetime.now()
            start_time = datetime.strptime(quiet_config['start'], '%H:%M').time()
            end_time = datetime.strptime(quiet_config['end'], '%H:%M').time()
            
            if start_time <= now.time() <= end_time:
                exceptions = quiet_config.get('exceptions', [])
                if event not in exceptions:
                    logger.info(f"静默时间内，跳过通知: {event}")
                    return False
        
        # 检查频率限制
        rate_limiting = self.config.get('filtering', {}).get('rate_limiting', {})
        if rate_limiting.get('enabled', False):
            # 这里应该实现频率限制逻辑
            # 为简化，暂时跳过
            pass
        
        return True
    
    def _render_template(self, template_name: str, context: Dict) -> str:
        """渲染模板"""
        try:
            template = self.jinja_env.get_template(template_name)
            return template.render(**context)
        except Exception as e:
            logger.error(f"模板渲染失败 {template_name}: {e}")
            return ""
    
    def send_slack_notification(self, notification_type: str, context: Dict) -> bool:
        """发送 Slack 通知"""
        slack_config = self.config.get('slack', {})
        if not slack_config.get('enabled', False):
            logger.info("Slack 通知已禁用")
            return False
        
        webhook_url = self._get_secret(slack_config.get('webhook_url_secret', 'SLACK_WEBHOOK_URL'))
        if not webhook_url:
            logger.error("Slack Webhook URL 未配置")
            return False
        
        # 选择合适的模板
        template_map = {
            'workflow_completion': 'slack-workflow-completion.json',
            'deployment': 'slack-deployment.json',
            'pull_request': 'slack-workflow-completion.json',
            'release': 'slack-deployment.json'
        }
        
        template_name = template_map.get(notification_type, 'slack-workflow-completion.json')
        
        try:
            # 渲染 Slack 消息模板
            message_content = self._render_template(template_name, context)
            if not message_content:
                return False
            
            # 解析 JSON 消息
            message_data = json.loads(message_content)
            
            # 发送到 Slack
            response = requests.post(
                webhook_url,
                json=message_data,
                timeout=30
            )
            
            if response.status_code == 200:
                logger.info(f"Slack 通知发送成功: {notification_type}")
                return True
            else:
                logger.error(f"Slack 通知发送失败: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Slack 通知发送异常: {e}")
            return False
    
    def send_email_notification(self, notification_type: str, context: Dict) -> bool:
        """发送邮件通知"""
        email_config = self.config.get('email', {})
        if not email_config.get('enabled', False):
            logger.info("邮件通知已禁用")
            return False
        
        # 获取 SMTP 配置
        smtp_host = self._get_secret(email_config['smtp']['host_secret'])
        smtp_port = int(self._get_secret(email_config['smtp']['port_secret']) or '587')
        smtp_username = self._get_secret(email_config['smtp']['username_secret'])
        smtp_password = self._get_secret(email_config['smtp']['password_secret'])
        from_email = self._get_secret(email_config['smtp']['from_secret'])
        
        if not all([smtp_host, smtp_username, smtp_password, from_email]):
            logger.error("邮件 SMTP 配置不完整")
            return False
        
        # 确定收件人
        recipients = self._get_email_recipients(notification_type)
        if not recipients:
            logger.warning(f"没有找到 {notification_type} 的收件人")
            return False
        
        try:
            # 创建邮件
            msg = MIMEMultipart('alternative')
            
            # 设置邮件头
            template_config = email_config.get('templates', {}).get(notification_type, {})
            subject_template = template_config.get('subject', f'[PhoenixCoder] {notification_type}')
            msg['Subject'] = Template(subject_template).render(**context)
            msg['From'] = from_email
            msg['To'] = ', '.join(recipients)
            
            # 渲染 HTML 内容
            html_template = f'email-{notification_type.replace("_", "-")}.html'
            html_content = self._render_template(html_template, context)
            
            if html_content:
                html_part = MIMEText(html_content, 'html', 'utf-8')
                msg.attach(html_part)
            
            # 创建纯文本版本
            text_content = self._create_text_version(context, notification_type)
            text_part = MIMEText(text_content, 'plain', 'utf-8')
            msg.attach(text_part)
            
            # 发送邮件
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                if email_config['smtp'].get('use_tls', True):
                    server.starttls()
                server.login(smtp_username, smtp_password)
                server.send_message(msg)
            
            logger.info(f"邮件通知发送成功: {notification_type} -> {recipients}")
            return True
            
        except Exception as e:
            logger.error(f"邮件通知发送异常: {e}")
            return False
    
    def _get_email_recipients(self, notification_type: str) -> List[str]:
        """获取邮件收件人列表"""
        email_config = self.config.get('email', {})
        recipients_config = email_config.get('recipients', {})
        
        all_recipients = []
        for group_name, group_config in recipients_config.items():
            if notification_type in group_config.get('events', []):
                all_recipients.extend(group_config.get('addresses', []))
        
        return list(set(all_recipients))  # 去重
    
    def _create_text_version(self, context: Dict, notification_type: str) -> str:
        """创建纯文本版本的邮件内容"""
        if notification_type == 'daily_summary':
            return f"""
PhoenixCoder CI/CD Daily Summary - {context.get('date', '')}

总览:
- 成功率: {context.get('workflow_stats', {}).get('success_rate', 'N/A')}%
- 总运行次数: {context.get('workflow_stats', {}).get('total_runs', 'N/A')}
- 成功次数: {context.get('workflow_stats', {}).get('successful_runs', 'N/A')}
- 失败次数: {context.get('workflow_stats', {}).get('failed_runs', 'N/A')}

工作流统计:
{self._format_workflows_text(context.get('workflows', []))}

性能指标:
{self._format_performance_text(context.get('performance_metrics', {}))}

代码质量:
{self._format_code_quality_text(context.get('code_quality', {}))}

---
此报告由 PhoenixCoder CI/CD 系统自动生成。
生成时间: {context.get('timestamp', '')}
仓库: {context.get('repository', '')}
"""
        elif notification_type == 'workflow_completion':
            status = "成功" if context.get('success') else "失败"
            return f"""
Workflow {status}: {context.get('workflow_name', '')}

详情:
- 分支: {context.get('branch', '')}
- 环境: {context.get('environment', '')}
- 作者: {context.get('author', '')}
- 持续时间: {context.get('duration', '')}
- 提交: {context.get('commit_sha', '')} - {context.get('commit_message', '')}

查看详情: {context.get('workflow_url', '')}
"""
        else:
            return f"PhoenixCoder 通知: {notification_type}\n\n{json.dumps(context, indent=2, ensure_ascii=False)}"
    
    def _format_workflows_text(self, workflows: List[Dict]) -> str:
        """格式化工作流文本"""
        if not workflows:
            return "无数据"
        
        lines = []
        for workflow in workflows:
            lines.append(f"- {workflow.get('name', '')}: {workflow.get('success', 0)} 成功, {workflow.get('failure', 0)} 失败 ({workflow.get('success_rate', 0)}%)")
        return "\n".join(lines)
    
    def _format_performance_text(self, metrics: Dict) -> str:
        """格式化性能指标文本"""
        if not metrics:
            return "无数据"
        
        return f"""
- 平均响应时间: {metrics.get('avg_response_time', 'N/A')}ms
- 吞吐量: {metrics.get('throughput', 'N/A')} req/s
- 错误率: {metrics.get('error_rate', 'N/A')}%
- 正常运行时间: {metrics.get('uptime', 'N/A')}%"""
    
    def _format_code_quality_text(self, quality: Dict) -> str:
        """格式化代码质量文本"""
        if not quality:
            return "无数据"
        
        return f"""
- 测试覆盖率: {quality.get('coverage', 'N/A')}%
- 质量门禁: {quality.get('quality_gate', 'N/A')}
- 重复代码: {quality.get('duplicated_lines', 'N/A')}%
- 技术债务: {quality.get('technical_debt', 'N/A')}"""
    
    def send_teams_notification(self, notification_type: str, context: Dict) -> bool:
        """发送 Teams 通知"""
        teams_config = self.config.get('teams', {})
        if not teams_config.get('enabled', False):
            logger.info("Teams 通知已禁用")
            return False
        
        webhook_url = self._get_secret(teams_config.get('webhook_url_secret', 'TEAMS_WEBHOOK_URL'))
        if not webhook_url:
            logger.error("Teams Webhook URL 未配置")
            return False
        
        try:
            # 创建 Teams 消息格式
            message = {
                "@type": "MessageCard",
                "@context": "http://schema.org/extensions",
                "themeColor": "0076D7" if context.get('success') else "FF0000",
                "summary": f"PhoenixCoder {notification_type}",
                "sections": [
                    {
                        "activityTitle": f"PhoenixCoder {notification_type}",
                        "activitySubtitle": context.get('workflow_name', ''),
                        "facts": self._create_teams_facts(context, notification_type),
                        "markdown": True
                    }
                ],
                "potentialAction": [
                    {
                        "@type": "OpenUri",
                        "name": "查看详情",
                        "targets": [
                            {
                                "os": "default",
                                "uri": context.get('workflow_url', '')
                            }
                        ]
                    }
                ]
            }
            
            response = requests.post(
                webhook_url,
                json=message,
                timeout=30
            )
            
            if response.status_code == 200:
                logger.info(f"Teams 通知发送成功: {notification_type}")
                return True
            else:
                logger.error(f"Teams 通知发送失败: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Teams 通知发送异常: {e}")
            return False
    
    def _create_teams_facts(self, context: Dict, notification_type: str) -> List[Dict]:
        """创建 Teams 消息的事实列表"""
        facts = []
        
        if notification_type == 'workflow_completion':
            facts.extend([
                {"name": "状态", "value": "✅ 成功" if context.get('success') else "❌ 失败"},
                {"name": "分支", "value": context.get('branch', '')},
                {"name": "环境", "value": context.get('environment', '')},
                {"name": "作者", "value": context.get('author', '')},
                {"name": "持续时间", "value": context.get('duration', '')}
            ])
        elif notification_type == 'deployment':
            facts.extend([
                {"name": "环境", "value": context.get('environment', '')},
                {"name": "版本", "value": context.get('version', '')},
                {"name": "状态", "value": "🚀 成功" if context.get('success') else "💥 失败"},
                {"name": "持续时间", "value": context.get('duration', '')}
            ])
        
        return facts
    
    def update_pr_status(self, pr_number: int, context: Dict) -> bool:
        """更新 PR 状态评论"""
        github_config = self.config.get('github', {})
        if not github_config.get('enabled', False) or not github_config.get('pr_comments', {}).get('enabled', False):
            logger.info("GitHub PR 评论已禁用")
            return False
        
        github_token = self._get_secret('GITHUB_TOKEN')
        if not github_token:
            logger.error("GitHub Token 未配置")
            return False
        
        repository = context.get('repository', '')
        if not repository:
            logger.error("仓库信息缺失")
            return False
        
        try:
            # 创建 PR 评论内容
            comment_body = self._create_pr_comment(context)
            
            # 发送 API 请求
            url = f"https://api.github.com/repos/{repository}/issues/{pr_number}/comments"
            headers = {
                'Authorization': f'token {github_token}',
                'Accept': 'application/vnd.github.v3+json'
            }
            
            response = requests.post(
                url,
                json={'body': comment_body},
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 201:
                logger.info(f"PR 评论添加成功: #{pr_number}")
                return True
            else:
                logger.error(f"PR 评论添加失败: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"PR 评论添加异常: {e}")
            return False
    
    def _create_pr_comment(self, context: Dict) -> str:
        """创建 PR 评论内容"""
        status_emoji = "✅" if context.get('success') else "❌"
        status_text = "成功" if context.get('success') else "失败"
        
        comment = f"""
## {status_emoji} CI/CD 工作流 {status_text}

**工作流:** {context.get('workflow_name', '')}
**分支:** `{context.get('branch', '')}`
**环境:** {context.get('environment', '')}
**持续时间:** {context.get('duration', '')}
**提交:** {context.get('commit_sha', '')} - {context.get('commit_message', '')}
"""
        
        # 添加测试结果
        if context.get('test_results'):
            test_results = context['test_results']
            comment += f"""

### 📊 测试结果
- **总测试数:** {test_results.get('total', 0)}
- **通过:** {test_results.get('passed', 0)}
- **失败:** {test_results.get('failed', 0)}
- **覆盖率:** {test_results.get('coverage', 0)}%
"""
        
        # 添加代码质量结果
        if context.get('quality_results'):
            quality = context['quality_results']
            comment += f"""

### 🔍 代码质量
- **质量门禁:** {quality.get('quality_gate', 'N/A')}
- **覆盖率:** {quality.get('coverage', 0)}%
- **重复代码:** {quality.get('duplicated_lines', 0)}%
- **安全热点:** {quality.get('security_hotspots', 0)}
"""
        
        # 添加安全扫描结果
        if context.get('security_results'):
            security = context['security_results']
            comment += f"""

### 🔒 安全扫描
- **漏洞总数:** {security.get('vulnerabilities', 0)}
- **严重:** {security.get('critical', 0)}
- **高危:** {security.get('high', 0)}
- **中危:** {security.get('medium', 0)}
- **低危:** {security.get('low', 0)}
"""
        
        # 添加链接
        comment += f"""

### 🔗 相关链接
- [查看工作流详情]({context.get('workflow_url', '')})
- [查看提交]({context.get('commit_url', '')})
"""
        
        if not context.get('success'):
            comment += f"- [查看日志]({context.get('logs_url', '')})"
        
        comment += f"""

---
*此评论由 PhoenixCoder CI/CD 系统自动生成 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*
"""
        
        return comment
    
    def send_notification(self, notification_type: str, context: Dict, channels: List[str] = None) -> Dict[str, bool]:
        """发送通知到指定渠道"""
        if not self._should_send_notification(notification_type, context.get('event', notification_type)):
            return {}
        
        results = {}
        
        # 如果没有指定渠道，使用配置中的默认渠道
        if not channels:
            channels = ['slack', 'email']
        
        # 发送到各个渠道
        if 'slack' in channels:
            results['slack'] = self.send_slack_notification(notification_type, context)
        
        if 'email' in channels:
            results['email'] = self.send_email_notification(notification_type, context)
        
        if 'teams' in channels:
            results['teams'] = self.send_teams_notification(notification_type, context)
        
        # 更新 PR 状态（如果适用）
        if context.get('pr_number') and notification_type in ['workflow_completion', 'code_quality_results']:
            results['pr_comment'] = self.update_pr_status(context['pr_number'], context)
        
        return results

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='PhoenixCoder CI/CD 通知发送器')
    parser.add_argument('--type', required=True, help='通知类型')
    parser.add_argument('--context', required=True, help='通知上下文 JSON 文件路径')
    parser.add_argument('--channels', nargs='+', help='通知渠道列表')
    parser.add_argument('--config', help='配置文件路径')
    
    args = parser.parse_args()
    
    # 加载上下文数据
    try:
        with open(args.context, 'r', encoding='utf-8') as f:
            context = json.load(f)
    except Exception as e:
        logger.error(f"加载上下文文件失败: {e}")
        sys.exit(1)
    
    # 创建通知发送器
    sender = NotificationSender(args.config)
    
    # 发送通知
    results = sender.send_notification(args.type, context, args.channels)
    
    # 输出结果
    success_count = sum(1 for success in results.values() if success)
    total_count = len(results)
    
    logger.info(f"通知发送完成: {success_count}/{total_count} 成功")
    
    for channel, success in results.items():
        status = "✅" if success else "❌"
        logger.info(f"  {channel}: {status}")
    
    # 如果所有通知都失败，退出码为 1
    if success_count == 0 and total_count > 0:
        sys.exit(1)

if __name__ == '__main__':
    main()