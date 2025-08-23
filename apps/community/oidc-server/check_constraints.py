import psycopg2
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv(dotenv_path="../../../.env.community")
load_dotenv()
if os.path.exists('config.env'):
    load_dotenv('config.env', override=True)

try:
    conn = psycopg2.connect(
        host=os.getenv('POSTGRES_HOST', 'localhost'),
        port=os.getenv('POSTGRES_PORT', '5432'),
        dbname=os.getenv('POSTGRES_DB', 'phoenixcoder'),
        user=os.getenv('POSTGRES_USER', 'phoenixcoder'),
        password=os.getenv('POSTGRES_PASSWORD', 'password')
    )
    cur = conn.cursor()
    
    # 查看auth_codes表的外键约束
    cur.execute("""
        SELECT conname, conrelid::regclass, confrelid::regclass, pg_get_constraintdef(oid) 
        FROM pg_constraint 
        WHERE contype = 'f' AND conrelid = 'auth_codes'::regclass;
    """)
    
    print('Foreign key constraints for auth_codes table:')
    for row in cur.fetchall():
        print(f'Constraint: {row[0]}, Table: {row[1]}, References: {row[2]}, Definition: {row[3]}')
    
    # 查看users表的结构
    cur.execute("""
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND table_schema = 'public'
        ORDER BY ordinal_position;
    """)
    
    print('\nUsers table structure:')
    for row in cur.fetchall():
        print(f'Column: {row[0]}, Type: {row[1]}, Nullable: {row[2]}')
    
    # 查看auth_codes表的结构
    cur.execute("""
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'auth_codes' AND table_schema = 'public'
        ORDER BY ordinal_position;
    """)
    
    print('\nAuth_codes table structure:')
    for row in cur.fetchall():
        print(f'Column: {row[0]}, Type: {row[1]}, Nullable: {row[2]}')
    
    conn.close()
except Exception as e:
    print(f'Error: {e}')