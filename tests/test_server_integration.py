import pytest
import sqlite3
import tempfile
import os
import json
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import sys
sys.path.append('/Users/zhuwencan/work/phoenixcoder/apps/community/server')

from main import app
from services.auth_service import AuthService
from services.password_service import PasswordService
from services.token_service import TokenService
from database.database import Database


@pytest.mark.integration
class TestServerIntegration:
    """Server集成测试"""
    
    @pytest.fixture(autouse=True)
    def setup_method(self):
        """每个测试方法前的设置"""
        # 创建临时数据库
        self.temp_db = tempfile.NamedTemporaryFile(delete=False, suffix='.db')
        self.temp_db.close()
        
        # 初始化服务
        self.database = Database(self.temp_db.name)
        self.password_service = PasswordService()
        self.token_service = TokenService()
        self.auth_service = AuthService(self.database, self.password_service, self.token_service)
        
        # 初始化数据库
        self.database.init_database()
        
        self.client = TestClient(app)
        
    def teardown_method(self):
        """每个测试方法后的清理"""
        # 关闭数据库连接
        if hasattr(self.database, 'connection'):
            self.database.connection.close()
        
        # 删除临时数据库
        if os.path.exists(self.temp_db.name):
            os.unlink(self.temp_db.name)
    
    def test_complete_user_registration_and_authentication_flow(self):
        """测试完整的用户注册和认证流程"""
        # 1. 用户注册
        registration_data = {
            "email": "integration@example.com",
            "password": "SecurePassword123!",
            "name": "Integration User",
            "role": "user"
        }
        
        register_response = self.client.post("/auth/register", json=registration_data)
        assert register_response.status_code == 201
        
        register_result = register_response.json()
        assert register_result["success"] is True
        assert "user_id" in register_result
        user_id = register_result["user_id"]
        
        # 2. 验证用户已存储在数据库中
        user = self.database.get_user_by_email("integration@example.com")
        assert user is not None
        assert user["name"] == "Integration User"
        assert user["email"] == "integration@example.com"
        assert user["role"] == "user"
        assert user["is_active"] is True
        
        # 3. 用户登录
        login_data = {
            "email": "integration@example.com",
            "password": "SecurePassword123!"
        }
        
        login_response = self.client.post("/auth/login", json=login_data)
        assert login_response.status_code == 200
        
        login_result = login_response.json()
        assert login_result["success"] is True
        assert "access_token" in login_result
        assert "refresh_token" in login_result
        assert login_result["user"]["id"] == user_id
        
        access_token = login_result["access_token"]
        refresh_token = login_result["refresh_token"]
        
        # 4. 使用访问令牌访问受保护的端点
        protected_response = self.client.get("/auth/profile", headers={
            "Authorization": f"Bearer {access_token}"
        })
        
        assert protected_response.status_code == 200
        profile_data = protected_response.json()
        assert profile_data["email"] == "integration@example.com"
        assert profile_data["name"] == "Integration User"
        
        # 5. 刷新令牌
        refresh_response = self.client.post("/auth/refresh", json={
            "refresh_token": refresh_token
        })
        
        assert refresh_response.status_code == 200
        refresh_result = refresh_response.json()
        assert "access_token" in refresh_result
        assert refresh_result["access_token"] != access_token  # 新令牌应该不同
        
        # 6. 使用新的访问令牌
        new_access_token = refresh_result["access_token"]
        new_protected_response = self.client.get("/auth/profile", headers={
            "Authorization": f"Bearer {new_access_token}"
        })
        
        assert new_protected_response.status_code == 200
    
    def test_password_change_flow(self):
        """测试密码修改流程"""
        # 1. 注册用户
        registration_data = {
            "email": "password_change@example.com",
            "password": "OldPassword123!",
            "name": "Password Change User"
        }
        
        register_response = self.client.post("/auth/register", json=registration_data)
        assert register_response.status_code == 201
        
        # 2. 登录获取令牌
        login_response = self.client.post("/auth/login", json={
            "email": "password_change@example.com",
            "password": "OldPassword123!"
        })
        
        access_token = login_response.json()["access_token"]
        
        # 3. 修改密码
        change_password_response = self.client.post("/auth/change-password", 
            json={
                "current_password": "OldPassword123!",
                "new_password": "NewPassword456!"
            },
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        assert change_password_response.status_code == 200
        
        # 4. 使用旧密码登录（应该失败）
        old_login_response = self.client.post("/auth/login", json={
            "email": "password_change@example.com",
            "password": "OldPassword123!"
        })
        
        assert old_login_response.status_code == 401
        
        # 5. 使用新密码登录（应该成功）
        new_login_response = self.client.post("/auth/login", json={
            "email": "password_change@example.com",
            "password": "NewPassword456!"
        })
        
        assert new_login_response.status_code == 200
    
    def test_user_role_and_permissions(self):
        """测试用户角色和权限"""
        # 1. 创建普通用户
        user_registration = {
            "email": "user@example.com",
            "password": "UserPassword123!",
            "name": "Regular User",
            "role": "user"
        }
        
        user_register_response = self.client.post("/auth/register", json=user_registration)
        assert user_register_response.status_code == 201
        
        # 2. 创建管理员用户
        admin_registration = {
            "email": "admin@example.com",
            "password": "AdminPassword123!",
            "name": "Admin User",
            "role": "admin"
        }
        
        admin_register_response = self.client.post("/auth/register", json=admin_registration)
        assert admin_register_response.status_code == 201
        
        # 3. 普通用户登录
        user_login_response = self.client.post("/auth/login", json={
            "email": "user@example.com",
            "password": "UserPassword123!"
        })
        
        user_token = user_login_response.json()["access_token"]
        
        # 4. 管理员登录
        admin_login_response = self.client.post("/auth/login", json={
            "email": "admin@example.com",
            "password": "AdminPassword123!"
        })
        
        admin_token = admin_login_response.json()["access_token"]
        
        # 5. 普通用户尝试访问管理员端点（应该失败）
        user_admin_response = self.client.get("/admin/users", headers={
            "Authorization": f"Bearer {user_token}"
        })
        
        assert user_admin_response.status_code == 403
        
        # 6. 管理员访问管理员端点（应该成功）
        admin_admin_response = self.client.get("/admin/users", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        
        assert admin_admin_response.status_code == 200
    
    def test_token_expiration_and_refresh(self):
        """测试令牌过期和刷新"""
        # 1. 注册和登录用户
        registration_data = {
            "email": "token_test@example.com",
            "password": "TokenPassword123!",
            "name": "Token Test User"
        }
        
        self.client.post("/auth/register", json=registration_data)
        
        login_response = self.client.post("/auth/login", json={
            "email": "token_test@example.com",
            "password": "TokenPassword123!"
        })
        
        tokens = login_response.json()
        access_token = tokens["access_token"]
        refresh_token = tokens["refresh_token"]
        
        # 2. 模拟令牌过期
        with patch('services.token_service.TokenService.verify_token') as mock_verify:
            mock_verify.return_value = None  # 模拟过期令牌
            
            # 3. 使用过期令牌访问受保护端点
            expired_response = self.client.get("/auth/profile", headers={
                "Authorization": f"Bearer {access_token}"
            })
            
            assert expired_response.status_code == 401
        
        # 4. 使用刷新令牌获取新的访问令牌
        refresh_response = self.client.post("/auth/refresh", json={
            "refresh_token": refresh_token
        })
        
        assert refresh_response.status_code == 200
        new_tokens = refresh_response.json()
        new_access_token = new_tokens["access_token"]
        
        # 5. 使用新令牌访问受保护端点
        new_protected_response = self.client.get("/auth/profile", headers={
            "Authorization": f"Bearer {new_access_token}"
        })
        
        assert new_protected_response.status_code == 200
    
    def test_concurrent_user_operations(self):
        """测试并发用户操作"""
        import threading
        import time
        
        results = []
        
        def register_user(user_id):
            """注册用户的线程函数"""
            try:
                response = self.client.post("/auth/register", json={
                    "email": f"concurrent{user_id}@example.com",
                    "password": "ConcurrentPassword123!",
                    "name": f"Concurrent User {user_id}"
                })
                results.append((user_id, response.status_code))
            except Exception as e:
                results.append((user_id, str(e)))
        
        # 创建多个线程同时注册用户
        threads = []
        for i in range(5):
            thread = threading.Thread(target=register_user, args=(i,))
            threads.append(thread)
            thread.start()
        
        # 等待所有线程完成
        for thread in threads:
            thread.join()
        
        # 验证所有注册都成功
        assert len(results) == 5
        for user_id, status_code in results:
            assert status_code == 201
        
        # 验证所有用户都已创建
        for i in range(5):
            user = self.database.get_user_by_email(f"concurrent{i}@example.com")
            assert user is not None
    
    def test_database_transaction_integrity(self):
        """测试数据库事务完整性"""
        # 1. 模拟注册过程中的数据库错误
        with patch.object(self.database, 'create_user') as mock_create_user:
            mock_create_user.side_effect = Exception("Database connection error")
            
            registration_response = self.client.post("/auth/register", json={
                "email": "transaction_test@example.com",
                "password": "TransactionPassword123!",
                "name": "Transaction Test User"
            })
            
            assert registration_response.status_code == 500
        
        # 2. 验证用户没有被部分创建
        user = self.database.get_user_by_email("transaction_test@example.com")
        assert user is None
        
        # 3. 验证数据库状态一致性
        all_users = self.database.get_all_users()
        # 应该没有残留的不完整用户数据
        for user in all_users:
            assert user["email"] is not None
            assert user["password_hash"] is not None
            assert user["name"] is not None
    
    def test_password_security_requirements(self):
        """测试密码安全要求"""
        weak_passwords = [
            "123456",
            "password",
            "abc123",
            "qwerty",
            "12345678"
        ]
        
        for weak_password in weak_passwords:
            response = self.client.post("/auth/register", json={
                "email": f"weak_{weak_password}@example.com",
                "password": weak_password,
                "name": "Weak Password User"
            })
            
            # 应该拒绝弱密码
            assert response.status_code == 400
            assert "password" in response.json()["detail"].lower()
    
    def test_email_validation_and_uniqueness(self):
        """测试邮箱验证和唯一性"""
        # 1. 测试无效邮箱格式
        invalid_emails = [
            "invalid-email",
            "@example.com",
            "user@",
            "user..name@example.com",
            "user@.com"
        ]
        
        for invalid_email in invalid_emails:
            response = self.client.post("/auth/register", json={
                "email": invalid_email,
                "password": "ValidPassword123!",
                "name": "Invalid Email User"
            })
            
            assert response.status_code == 400
        
        # 2. 测试邮箱唯一性
        # 首次注册
        first_response = self.client.post("/auth/register", json={
            "email": "unique@example.com",
            "password": "UniquePassword123!",
            "name": "First User"
        })
        
        assert first_response.status_code == 201
        
        # 重复注册相同邮箱
        second_response = self.client.post("/auth/register", json={
            "email": "unique@example.com",
            "password": "AnotherPassword123!",
            "name": "Second User"
        })
        
        assert second_response.status_code == 400
        assert "already exists" in second_response.json()["detail"]
    
    def test_user_profile_management(self):
        """测试用户资料管理"""
        # 1. 注册用户
        registration_data = {
            "email": "profile@example.com",
            "password": "ProfilePassword123!",
            "name": "Profile User"
        }
        
        register_response = self.client.post("/auth/register", json=registration_data)
        assert register_response.status_code == 201
        
        # 2. 登录获取令牌
        login_response = self.client.post("/auth/login", json={
            "email": "profile@example.com",
            "password": "ProfilePassword123!"
        })
        
        access_token = login_response.json()["access_token"]
        
        # 3. 获取用户资料
        profile_response = self.client.get("/auth/profile", headers={
            "Authorization": f"Bearer {access_token}"
        })
        
        assert profile_response.status_code == 200
        profile_data = profile_response.json()
        assert profile_data["email"] == "profile@example.com"
        assert profile_data["name"] == "Profile User"
        
        # 4. 更新用户资料
        update_response = self.client.put("/auth/profile", 
            json={
                "name": "Updated Profile User",
                "bio": "This is my bio"
            },
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        assert update_response.status_code == 200
        
        # 5. 验证更新后的资料
        updated_profile_response = self.client.get("/auth/profile", headers={
            "Authorization": f"Bearer {access_token}"
        })
        
        updated_profile_data = updated_profile_response.json()
        assert updated_profile_data["name"] == "Updated Profile User"
        assert updated_profile_data["bio"] == "This is my bio"
    
    def test_user_deactivation_and_reactivation(self):
        """测试用户停用和重新激活"""
        # 1. 注册用户
        registration_data = {
            "email": "deactivation@example.com",
            "password": "DeactivationPassword123!",
            "name": "Deactivation User"
        }
        
        register_response = self.client.post("/auth/register", json=registration_data)
        user_id = register_response.json()["user_id"]
        
        # 2. 登录获取管理员令牌（假设有管理员功能）
        admin_registration = {
            "email": "admin_deactivation@example.com",
            "password": "AdminPassword123!",
            "name": "Admin User",
            "role": "admin"
        }
        
        self.client.post("/auth/register", json=admin_registration)
        
        admin_login_response = self.client.post("/auth/login", json={
            "email": "admin_deactivation@example.com",
            "password": "AdminPassword123!"
        })
        
        admin_token = admin_login_response.json()["access_token"]
        
        # 3. 停用用户
        deactivate_response = self.client.post(f"/admin/users/{user_id}/deactivate", 
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert deactivate_response.status_code == 200
        
        # 4. 停用的用户尝试登录（应该失败）
        deactivated_login_response = self.client.post("/auth/login", json={
            "email": "deactivation@example.com",
            "password": "DeactivationPassword123!"
        })
        
        assert deactivated_login_response.status_code == 401
        assert "inactive" in deactivated_login_response.json()["detail"].lower()
        
        # 5. 重新激活用户
        reactivate_response = self.client.post(f"/admin/users/{user_id}/activate", 
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert reactivate_response.status_code == 200
        
        # 6. 重新激活的用户登录（应该成功）
        reactivated_login_response = self.client.post("/auth/login", json={
            "email": "deactivation@example.com",
            "password": "DeactivationPassword123!"
        })
        
        assert reactivated_login_response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])