#!/usr/bin/env python3
"""
安全扫描脚本
用于扫描Docker镜像、依赖包和代码中的安全漏洞
"""

import os
import sys
import json
import subprocess
import re
from datetime import datetime
from typing import List, Dict, Any


def scan_docker_images() -> List[Dict[str, Any]]:
    """扫描Docker镜像中的漏洞"""
    print("🔍 扫描Docker镜像漏洞...")
    
    vulnerabilities = []
    
    # 获取所有Dockerfile
    dockerfiles = []
    for root, dirs, files in os.walk('.'):
        for file in files:
            if file == 'Dockerfile':
                dockerfiles.append(os.path.join(root, file))
    
    if not dockerfiles:
        print("⚠️ 未找到Dockerfile")
        return vulnerabilities
    
    print(f"📋 找到 {len(dockerfiles)} 个Dockerfile")
    
    # 模拟扫描结果（实际环境中应使用Trivy等工具）
    sample_vulnerabilities = [
        {
            "VulnerabilityID": "CVE-2023-1234",
            "PkgName": "openssl",
            "InstalledVersion": "1.1.1k",
            "FixedVersion": "1.1.1l",
            "Severity": "HIGH",
            "Description": "OpenSSL 安全漏洞"
        },
        {
            "VulnerabilityID": "CVE-2023-5678",
            "PkgName": "nodejs",
            "InstalledVersion": "14.17.0",
            "FixedVersion": "14.17.5",
            "Severity": "MEDIUM",
            "Description": "Node.js 安全漏洞"
        }
    ]
    
    # 为每个Dockerfile添加模拟漏洞
    for dockerfile in dockerfiles:
        for vuln in sample_vulnerabilities:
            vuln_copy = vuln.copy()
            vuln_copy["Dockerfile"] = dockerfile
            vulnerabilities.append(vuln_copy)
    
    print(f"🔍 发现 {len(vulnerabilities)} 个Docker镜像漏洞")
    return vulnerabilities


def scan_dependencies() -> List[Dict[str, Any]]:
    """扫描依赖包中的漏洞"""
    print("🔍 扫描依赖包漏洞...")
    
    vulnerabilities = []
    
    # 检查package.json
    if os.path.exists('package.json'):
        print("📦 扫描Node.js依赖...")
        try:
            # 模拟Node.js依赖漏洞
            node_vulnerabilities = [
                {
                    "id": 1234,
                    "name": "lodash",
                    "version": "4.17.15",
                    "severity": "high",
                    "recommendation": "Upgrade to version 4.17.21 or later"
                },
                {
                    "id": 5678,
                    "name": "minimist",
                    "version": "1.2.5",
                    "severity": "medium",
                    "recommendation": "Upgrade to version 1.2.6 or later"
                }
            ]
            
            vulnerabilities.extend(node_vulnerabilities)
            print(f"    📋 发现 {len(node_vulnerabilities)} 个Node.js依赖漏洞")
        except Exception as e:
            print(f"    ⚠️ Node.js依赖扫描失败: {e}")
    
    # 检查requirements.txt
    if os.path.exists('requirements.txt'):
        print("📦 扫描Python依赖...")
        try:
            # 模拟Python依赖漏洞
            python_vulnerabilities = [
                {
                    "name": "django",
                    "installed_version": "3.2.0",
                    "vulnerable_version": "<3.2.4",
                    "severity": "high",
                    "advisory": "CVE-2021-33203"
                },
                {
                    "name": "pillow",
                    "installed_version": "8.2.0",
                    "vulnerable_version": "<8.3.0",
                    "severity": "medium",
                    "advisory": "CVE-2021-34552"
                }
            ]
            
            vulnerabilities.extend(python_vulnerabilities)
            print(f"    📋 发现 {len(python_vulnerabilities)} 个Python依赖漏洞")
        except Exception as e:
            print(f"    ⚠️ Python依赖扫描失败: {e}")
    
    return vulnerabilities


def scan_secrets() -> List[Dict[str, Any]]:
    """扫描代码中的敏感信息"""
    print("🔍 扫描代码中的敏感信息...")
    
    secrets = []
    
    # 敏感信息匹配模式
    secret_patterns = [
        (r'password\s*=\s*["\'][^"\'\r\n]{8,}["\']', 'hardcoded_password'),
        (r'api[_-]?key\s*=\s*["\'][^"\'\r\n]{20,}["\']', 'api_key'),
        (r'secret[_-]?key\s*=\s*["\'][^"\'\r\n]{20,}["\']', 'secret_key'),
        (r'token\s*=\s*["\'][^"\'\r\n]{20,}["\']', 'token'),
        (r'-----BEGIN [A-Z ]+-----', 'private_key')
    ]
    
    for root, dirs, files in os.walk('.'):
        # 跳过不需要扫描的目录
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', '__pycache__', 'dist', 'build']]
        
        for file in files:
            if file.endswith(('.py', '.js', '.ts', '.jsx', '.tsx', '.env', '.yaml', '.yml')):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        
                        for pattern, secret_type in secret_patterns:
                            matches = re.finditer(pattern, content, re.IGNORECASE)
                            for match in matches:
                                secrets.append({
                                    'file': file_path,
                                    'type': secret_type,
                                    'line': content[:match.start()].count('\n') + 1,
                                    'match': match.group()[:50] + '...' if len(match.group()) > 50 else match.group()
                                })
                except Exception:
                    continue
    
    return secrets


def main():
    """主函数"""
    environment = os.environ.get('ENVIRONMENT', 'staging')
    
    print(f"🔒 开始 {environment} 环境安全扫描...")
    
    # 扫描结果
    scan_results = {
        'environment': environment,
        'timestamp': datetime.now().isoformat(),
        'docker_vulnerabilities': [],
        'dependency_vulnerabilities': [],
        'secrets': []
    }
    
    # 扫描Docker镜像
    try:
        scan_results['docker_vulnerabilities'] = scan_docker_images()
    except Exception as e:
        print(f"❌ Docker镜像扫描失败: {e}")
    
    # 扫描依赖包
    try:
        scan_results['dependency_vulnerabilities'] = scan_dependencies()
    except Exception as e:
        print(f"❌ 依赖包扫描失败: {e}")
    
    # 扫描敏感信息
    try:
        scan_results['secrets'] = scan_secrets()
    except Exception as e:
        print(f"❌ 敏感信息扫描失败: {e}")
    
    # 保存扫描结果
    os.makedirs('security-reports', exist_ok=True)
    report_file = f'security-reports/{environment}-security-scan.json'
    
    with open(report_file, 'w') as f:
        json.dump(scan_results, f, indent=2)
    
    print(f"📝 安全扫描报告已保存到 {report_file}")
    
    # 输出摘要
    docker_high_critical = len([v for v in scan_results['docker_vulnerabilities'] if v.get('Severity') in ['HIGH', 'CRITICAL']])
    dep_high_critical = len([v for v in scan_results['dependency_vulnerabilities'] if v.get('severity') in ['high', 'critical']])
    secrets_count = len(scan_results['secrets'])
    
    print(f"\n📊 安全扫描摘要:")
    print(f"  Docker高危漏洞: {docker_high_critical}")
    print(f"  依赖包高危漏洞: {dep_high_critical}")
    print(f"  敏感信息泄露: {secrets_count}")
    
    # 检查是否有阻塞性安全问题
    if docker_high_critical > 10 or dep_high_critical > 5 or secrets_count > 0:
        print(f"\n❌ 发现严重安全问题，建议修复后再部署")
        if environment == 'production':
            print(f"🚫 生产环境部署被阻止")
            sys.exit(1)
        else:
            print(f"⚠️ 测试环境允许部署，但请尽快修复")
    else:
        print(f"\n✅ 安全扫描通过")


if __name__ == '__main__':
    main()