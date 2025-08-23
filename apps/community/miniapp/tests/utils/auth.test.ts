import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AuthService from '@/utils/auth';
import Taro from '@tarojs/taro';

// 获取 mocked Taro
const mockTaro = vi.mocked(Taro);

// 模拟用户信息数据
const mockUserInfo = {
    id: '123',
    username: 'testuser',
    email: 'test@example.com',
    token: 'mock-token-123',
    isVerified: true,
    avatar: 'https://example.com/avatar.jpg',
    skills: ['JavaScript', 'React'],
    level: 'intermediate',
};

const mockUnverifiedUserInfo = {
    ...mockUserInfo,
    isVerified: false,
};

const userInfoWithoutToken = {
    ...mockUserInfo,
    token: null,
};

describe('AuthService 认证工具类测试', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockTaro.clearStorageSync();
    });

    describe('isLoggedIn', () => {
        it('应该在用户已登录时返回 true', () => {
            // 模拟已登录状态
            mockTaro.getStorageSync.mockReturnValue(mockUserInfo);

            const result = AuthService.isLoggedIn();

            expect(result).toBe(true);
            expect(mockTaro.getStorageSync).toHaveBeenCalledWith('userInfo');
        });

        it('应该在用户未登录时返回 false', () => {
            // 模拟未登录状态
            mockTaro.getStorageSync.mockReturnValue(null);

            const result = AuthService.isLoggedIn();

            expect(result).toBe(false);
        });

        it('应该在用户信息不完整时返回 false', () => {
            // 模拟用户信息不完整
            mockTaro.getStorageSync.mockReturnValue(userInfoWithoutToken);

            const result = AuthService.isLoggedIn();

            expect(result).toBe(false);
        });
    });

    describe('getUserInfo', () => {
        it('应该返回存储的用户信息', () => {
            mockTaro.getStorageSync.mockReturnValue(mockUserInfo);

            const result = AuthService.getUserInfo();

            expect(result).toEqual(mockUserInfo);
        });

        it('应该在没有用户信息时返回 null', () => {
            mockTaro.getStorageSync.mockReturnValue(null);

            const result = AuthService.getUserInfo();

            expect(result).toBeNull();
        });
    });

    describe('isIdentityVerified', () => {
        it('应该在用户已认证时返回 true', () => {
            mockTaro.getStorageSync.mockReturnValue(mockUserInfo);

            const result = AuthService.isIdentityVerified();

            expect(result).toBe(true);
        });

        it('应该在用户未认证时返回 false', () => {
            mockTaro.getStorageSync.mockReturnValue(mockUnverifiedUserInfo);

            const result = AuthService.isIdentityVerified();

            expect(result).toBe(false);
        });

        it('应该在没有用户信息时返回 false', () => {
            mockTaro.getStorageSync.mockReturnValue(null);

            const result = AuthService.isIdentityVerified();

            expect(result).toBe(false);
        });
    });

    describe('redirectToLogin', () => {
        it('应该显示登录提示并跳转到登录页', () => {
            mockTaro.showModal.mockImplementation((options) => {
                options.success?.({ confirm: true, cancel: false });
                return Promise.resolve({ confirm: true, cancel: false });
            });

            AuthService.redirectToLogin();

            expect(mockTaro.showModal).toHaveBeenCalledWith({
                title: '登录提示',
                content: '请先登录以继续操作',
                confirmText: '去登录',
                success: expect.any(Function),
            });
            expect(mockTaro.navigateTo).toHaveBeenCalledWith({
                url: '/pages/login/index',
            });
        });

        it('应该在用户取消时不跳转', () => {
            mockTaro.showModal.mockImplementation((options) => {
                options.success?.({ confirm: false, cancel: true });
                return Promise.resolve({ confirm: false, cancel: true });
            });

            AuthService.redirectToLogin();

            expect(mockTaro.showModal).toHaveBeenCalled();
            expect(mockTaro.navigateTo).not.toHaveBeenCalled();
        });
    });

    describe('redirectToVerification', () => {
        it('应该显示认证提示并跳转到认证页', () => {
            mockTaro.showModal.mockImplementation((options) => {
                options.success?.({ confirm: true, cancel: false });
                return Promise.resolve({ confirm: true, cancel: false });
            });

            AuthService.redirectToVerification();

            expect(mockTaro.showModal).toHaveBeenCalledWith({
                title: '认证提示',
                content: '请先完成身份技能认证以继续操作',
                confirmText: '去认证',
                success: expect.any(Function),
            });
            expect(mockTaro.navigateTo).toHaveBeenCalledWith({
                url: '/pages/profile/verification',
            });
        });
    });

    describe('redirectToSurvey', () => {
        it('应该显示调研提示并跳转到调研页', () => {
            mockTaro.showModal.mockImplementation((options) => {
                options.success?.({ confirm: true, cancel: false });
                return Promise.resolve({ confirm: true, cancel: false });
            });

            AuthService.redirectToSurvey();

            expect(mockTaro.showModal).toHaveBeenCalledWith({
                title: '个性化推荐',
                content: '完成问卷调查，获取更精准的学习推荐',
                confirmText: '去填写',
                success: expect.any(Function),
            });
            expect(mockTaro.navigateTo).toHaveBeenCalledWith({
                url: '/pages/knowledge-helper/survey',
            });
        });
    });

    describe('checkLoginAndDo', () => {
        it('应该在用户已登录时执行回调', () => {
            mockTaro.getStorageSync.mockReturnValue(mockUserInfo);
            const callback = vi.fn();

            AuthService.checkLoginAndDo(callback);

            expect(callback).toHaveBeenCalled();
        });

        it('应该在用户未登录时跳转到登录页', () => {
            mockTaro.getStorageSync.mockReturnValue(null);
            mockTaro.showModal.mockImplementation((options) => {
                options.success?.({ confirm: true, cancel: false });
                return Promise.resolve({ confirm: true, cancel: false });
            });
            const callback = vi.fn();

            AuthService.checkLoginAndDo(callback);

            expect(callback).not.toHaveBeenCalled();
            expect(mockTaro.showModal).toHaveBeenCalled();
        });
    });

    describe('checkVerificationAndDo', () => {
        it('应该在用户已认证时执行回调', () => {
            mockTaro.getStorageSync.mockReturnValue(mockUserInfo);
            const callback = vi.fn();

            AuthService.checkVerificationAndDo(callback);

            expect(callback).toHaveBeenCalled();
        });

        it('应该在用户未登录时跳转到登录页', () => {
            mockTaro.getStorageSync.mockReturnValue(null);
            mockTaro.showModal.mockImplementation((options) => {
                options.success?.({ confirm: true, cancel: false });
                return Promise.resolve({ confirm: true, cancel: false });
            });
            const callback = vi.fn();

            AuthService.checkVerificationAndDo(callback);

            expect(callback).not.toHaveBeenCalled();
        });

        it('应该在用户未认证时跳转到认证页', () => {
            mockTaro.getStorageSync.mockReturnValue(mockUnverifiedUserInfo);
            mockTaro.showModal.mockImplementation((options) => {
                options.success?.({ confirm: true, cancel: false });
                return Promise.resolve({ confirm: true, cancel: false });
            });
            const callback = vi.fn();

            AuthService.checkVerificationAndDo(callback);

            expect(callback).not.toHaveBeenCalled();
            expect(mockTaro.showModal).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: '请先完成身份技能认证以继续操作',
                }),
            );
        });
    });
});
