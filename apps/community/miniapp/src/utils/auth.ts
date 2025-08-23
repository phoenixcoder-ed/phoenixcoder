import Taro from '@tarojs/taro';
import { UserInfo } from '@/redux/store/account/types';

// 认证工具类
class AuthService {
    // 检查用户是否登录
    static isLoggedIn(): boolean {
        const userInfo = Taro.getStorageSync('userInfo');
        return !!userInfo && !!userInfo.token;
    }

    // 获取当前登录用户信息
    static getUserInfo(): UserInfo | null {
        if (!this.isLoggedIn()) return null;
        return Taro.getStorageSync('userInfo') as UserInfo;
    }

    // 检查用户是否完成身份技能认证
    static isIdentityVerified(): boolean {
        const userInfo = this.getUserInfo();
        return !!userInfo && userInfo.isVerified === true;
    }

    // 引导用户登录
    static redirectToLogin(): void {
        Taro.showModal({
            title: '登录提示',
            content: '请先登录以继续操作',
            confirmText: '去登录',
            success: (res) => {
                if (res.confirm) {
                    Taro.navigateTo({
                        url: '/pages/login/index',
                    });
                }
            },
        });
    }

    // 引导用户进行身份技能认证
    static redirectToVerification(): void {
        Taro.showModal({
            title: '认证提示',
            content: '请先完成身份技能认证以继续操作',
            confirmText: '去认证',
            success: (res) => {
                if (res.confirm) {
                    Taro.navigateTo({
                        url: '/pages/profile/verification',
                    });
                }
            },
        });
    }

    // 引导用户填写问卷调查
    static redirectToSurvey(): void {
        Taro.showModal({
            title: '个性化推荐',
            content: '完成问卷调查，获取更精准的学习推荐',
            confirmText: '去填写',
            success: (res) => {
                if (res.confirm) {
                    Taro.navigateTo({
                        url: '/pages/knowledge-helper/survey',
                    });
                }
            },
        });
    }

    // 检查登录状态并执行操作
    // 返回true表示已登录，可以继续操作
    // 返回false表示未登录，已引导登录
    static checkLoginAndDo(action: () => void): boolean {
        if (this.isLoggedIn()) {
            action();
            return true;
        } else {
            this.redirectToLogin();
            return false;
        }
    }

    // 检查认证状态并执行操作
    // 返回true表示已认证，可以继续操作
    // 返回false表示未认证，已引导认证
    static checkVerificationAndDo(action: () => void): boolean {
        if (!this.checkLoginAndDo(() => {})) return false;

        if (this.isIdentityVerified()) {
            action();
            return true;
        } else {
            this.redirectToVerification();
            return false;
        }
    }
}

export default AuthService;
