/**
 * OAuth 配置文件
 * 统一管理所有OAuth相关的URL和配置
 */

// OAuth 提供商的API端点配置
export const OAUTH_ENDPOINTS = {
  github: {
    authorize: 'https://github.com/login/oauth/authorize',
    token: 'https://github.com/login/oauth/access_token',
    userInfo: 'https://api.github.com/user',
    userEmails: 'https://api.github.com/user/emails',
  },
  wechat: {
    authorize: 'https://open.weixin.qq.com/connect/qrconnect',
    token: 'https://api.weixin.qq.com/sns/oauth2/access_token',
    userInfo: 'https://api.weixin.qq.com/sns/userinfo',
  },
  google: {
    authorize: 'https://accounts.google.com/oauth2/auth',
    token: 'https://oauth2.googleapis.com/token',
    userInfo: 'https://www.googleapis.com/oauth2/v2/userinfo',
  },
} as const;

// 默认头像生成服务配置
export const AVATAR_SERVICES = {
  dicebear: 'https://api.dicebear.com/7.x/avataaars/svg',
  uiAvatars: 'https://ui-avatars.com/api',
  placeholder: 'https://placehold.co',
} as const;

// 字体服务配置
export const FONT_SERVICES = {
  googleFonts: {
    css: 'https://fonts.googleapis.com/css2',
    static: 'https://fonts.gstatic.com',
  },
  inter:
    'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
  jetbrainsMono:
    'https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.woff2',
  orbitron:
    'https://fonts.gstatic.com/s/orbitron/v31/yMJMMIlzdpvBhQQL_SC3X9yhF25-T1nyGy6BoWgz.woff2',
} as const;

// 学习资源链接配置
export const LEARNING_RESOURCES = {
  es6: 'https://es6.ruanyifeng.com/',
  react: 'https://react.dev/',
} as const;
