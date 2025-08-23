#!/usr/bin/env python3

from models import User, UserType
from datetime import datetime, timezone

# 测试User对象创建
try:
    # 这是测试中使用的User对象
    callback_user = User(
        id="callback_user_123",
        sub="callback_user_123",
        name="回调用户",
        password="hashed_password_callback",
        user_type=UserType.PROGRAMMER,
        email="callback@example.com",
        avatar="http://example.com/callback_avatar.jpg",
        is_active=True
    )
    print("✅ User对象创建成功:")
    print(f"  ID: {callback_user.id}")
    print(f"  Email: {callback_user.email}")
    print(f"  User Type: {callback_user.user_type}")
    print(f"  Created At: {callback_user.created_at}")
except Exception as e:
    print(f"❌ User对象创建失败: {e}")
    print(f"错误类型: {type(e).__name__}")

# 测试没有email的User对象
try:
    user_no_email = User(
        id="user_no_email",
        sub="user_no_email",
        name="无邮箱用户",
        password="hashed_password",
        user_type=UserType.PROGRAMMER,
        avatar="http://example.com/avatar.jpg",
        is_active=True
    )
    print("\n✅ 无邮箱User对象创建成功")
except Exception as e:
    print(f"\n❌ 无邮箱User对象创建失败: {e}")
    print(f"错误类型: {type(e).__name__}")

# 测试有phone但无email的User对象
try:
    user_with_phone = User(
        id="user_with_phone",
        sub="user_with_phone",
        name="有手机号用户",
        password="hashed_password",
        user_type=UserType.PROGRAMMER,
        phone="13800138000",
        avatar="http://example.com/avatar.jpg",
        is_active=True
    )
    print("\n✅ 有手机号User对象创建成功")
except Exception as e:
    print(f"\n❌ 有手机号User对象创建失败: {e}")
    print(f"错误类型: {type(e).__name__}")