#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
读取和显示Excel项目管理模板的内容
检查各个工作表的数据是否正确填入
"""

import pandas as pd
import os
from pathlib import Path

def read_excel_template():
    """读取Excel模板文件并显示内容"""
    
    # Excel文件路径
    excel_file = "个人项目管理模板.xlsx"
    
    if not os.path.exists(excel_file):
        print(f"❌ 文件不存在: {excel_file}")
        return
    
    print(f"📊 正在读取Excel文件: {excel_file}")
    print("=" * 80)
    
    try:
        # 读取所有工作表名称
        excel_file_obj = pd.ExcelFile(excel_file)
        sheet_names = excel_file_obj.sheet_names
        
        print(f"📋 发现 {len(sheet_names)} 个工作表:")
        for i, sheet_name in enumerate(sheet_names, 1):
            print(f"  {i}. {sheet_name}")
        print()
        
        # 逐个读取并显示每个工作表的内容
        for sheet_name in sheet_names:
            print(f"📄 工作表: {sheet_name}")
            print("-" * 60)
            
            try:
                # 读取工作表数据
                df = pd.read_excel(excel_file, sheet_name=sheet_name)
                
                # 检查是否有数据
                if df.empty:
                    print("⚠️  工作表为空")
                else:
                    print(f"📊 数据行数: {len(df)}")
                    print(f"📊 数据列数: {len(df.columns)}")
                    print(f"📊 列名: {list(df.columns)}")
                    print()
                    
                    # 显示前10行数据
                    print("📋 前10行数据:")
                    pd.set_option('display.max_columns', None)
                    pd.set_option('display.width', None)
                    pd.set_option('display.max_colwidth', 50)
                    
                    display_df = df.head(10)
                    print(display_df.to_string(index=True))
                    
                    # 检查是否包含PhoenixCoder相关数据
                    has_phoenix_data = False
                    for col in df.columns:
                        if df[col].astype(str).str.contains('PhoenixCoder|phoenix|任务大厅|用户管理|技能认证', case=False, na=False).any():
                            has_phoenix_data = True
                            break
                    
                    if has_phoenix_data:
                        print("✅ 发现PhoenixCoder项目相关数据")
                    else:
                        print("⚠️  未发现PhoenixCoder项目相关数据，可能只包含模板数据")
                        
            except Exception as e:
                print(f"❌ 读取工作表 '{sheet_name}' 时出错: {str(e)}")
            
            print("\n" + "=" * 80 + "\n")
            
    except Exception as e:
        print(f"❌ 读取Excel文件时出错: {str(e)}")
        return
    
    print("📋 Excel文件内容检查完成")
    
    # 提供数据填充建议
    print("\n💡 数据填充建议:")
    print("如果发现数据为空或只有模板数据，建议填入以下PhoenixCoder项目真实数据:")
    print("- 项目名称: PhoenixCoder")
    print("- 项目类型: 技术社区平台")
    print("- 技术栈: Python FastAPI + React + PostgreSQL")
    print("- 核心功能: 任务大厅、用户管理、技能认证、成长体系、知识库")
    print("- 开发状态: 部分功能已实现，正在持续开发中")

def main():
    """主函数"""
    print("🚀 PhoenixCoder项目管理模板数据检查工具")
    print("=" * 80)
    read_excel_template()

if __name__ == "__main__":
    main()