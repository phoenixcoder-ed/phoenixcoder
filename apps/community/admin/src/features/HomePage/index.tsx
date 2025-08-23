import React, { useState, useEffect } from 'react';

import './styles.css';
import { logger } from '@/shared/utils/logger';

const HomePage: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleNavigate = (path: string) => {
    logger.debug(`导航到: ${path}`);
  };

  const playDemoVideo = () => {
    logger.debug('播放演示视频');
  };

  return (
    <div
      className={`min-h-screen bg-base-100 relative overflow-hidden transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* 粒子背景动画 */}
      <div className="particle-background"></div>

      {/* 主要内容 */}
      <main className="flex-1">
        {/* Hero Section */}
        <section
          id="hero"
          className="hero min-h-screen relative overflow-hidden"
        >
          <div className="hero-overlay bg-base-100/90"></div>
          <div className="hero-content text-center z-10 relative">
            <div className="max-w-4xl">
              <h1 className="text-6xl font-heading font-bold mb-8 title-glow text-base-content">
                PhoenixCoder：重塑程序员价值
              </h1>
              <p className="text-xl mb-12 text-base-content/80 font-body max-w-3xl mx-auto leading-relaxed">
                AI驱动的智能匹配，释放你的技术IP，直达高价值任务
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <button
                  className="btn btn-lg btn-liquid-metal text-base-content font-semibold px-12 py-4"
                  onClick={() => handleNavigate('/register')}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15.59 14.37q.159.666.16 1.38a6 6 0 0 1-6 6v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.9 14.9 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.9 14.9 0 0 0-2.58 5.84m2.699 2.7q-.155.032-.311.06a15 15 0 0 1-2.448-2.448l.06-.312m-2.24 2.39a4.49 4.49 0 0 0-1.757 4.306q.341.054.696.054a4.5 4.5 0 0 0 3.61-1.812M16.5 9a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0"></path>
                  </svg>
                  立即注册
                </button>
                <button
                  className="btn btn-lg btn-outline border-accent text-accent hover:bg-accent hover:text-accent-content px-12 py-4"
                  onClick={() => handleNavigate('/login')}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"></path>
                  </svg>
                  登录
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition Section */}
        <section id="value-proposition" className="py-24 bg-base-200 relative">
          <div className="container mx-auto px-8 max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-heading font-bold mb-6 text-base-content">
                为什么选择PhoenixCoder？
              </h2>
              <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
                我们为程序员和商家提供前所未有的价值创造平台
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {/* AI智能匹配 */}
              <div className="card smart-glass shadow-quantum hover:shadow-xl transition-all duration-300">
                <div className="card-body text-center p-8">
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-quantum-gradient rounded-full flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-base-content"
                      >
                        <rect width="16" height="16" x="4" y="4" rx="2"></rect>
                        <rect width="6" height="6" x="9" y="9" rx="1"></rect>
                        <path d="m15 2 5 5"></path>
                        <path d="m9 22 5-5"></path>
                        <path d="m4 15 5-5"></path>
                        <path d="m20 9-5 5"></path>
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-2xl font-heading font-bold mb-4 text-base-content">
                    AI智能匹配
                  </h3>
                  <p className="text-base-content/70 leading-relaxed">
                    基于深度学习算法，精准匹配程序员技能与项目需求，提升匹配效率300%
                  </p>
                </div>
              </div>
              {/* 技术IP变现 */}
              <div className="card smart-glass shadow-quantum hover:shadow-xl transition-all duration-300">
                <div className="card-body text-center p-8">
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-quantum-gradient rounded-full flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-base-content"
                      >
                        <path d="M9 12l2 2 4-4"></path>
                        <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1"></path>
                        <path d="M3 12v6c0 .552.448 1 1 1h16c.552 0 1-.448 1-1v-6"></path>
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-2xl font-heading font-bold mb-4 text-base-content">
                    技术IP变现
                  </h3>
                  <p className="text-base-content/70 leading-relaxed">
                    将你的技术能力转化为可量化的IP资产，通过平台获得持续收益
                  </p>
                </div>
              </div>
              {/* 能力成长加速 */}
              <div className="card smart-glass shadow-quantum hover:shadow-xl transition-all duration-300">
                <div className="card-body text-center p-8">
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-quantum-gradient rounded-full flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-base-content"
                      >
                        <path d="M3 3v18h18"></path>
                        <path d="m19 9-5 5-4-4-3 3"></path>
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-2xl font-heading font-bold mb-4 text-base-content">
                    能力成长加速
                  </h3>
                  <p className="text-base-content/70 leading-relaxed">
                    通过挑战任务和技能图谱，可视化追踪成长轨迹，加速职业发展
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Geometric grid background */}
          <div className="geometric-grid"></div>
        </section>

        {/* Feature Overview Section */}
        <section id="feature-overview" className="py-24 bg-base-100 relative">
          <div className="container mx-auto px-8 max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-heading font-bold mb-6 text-base-content">
                功能总览与演示
              </h2>
              <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
                探索PhoenixCoder的强大功能，开启你的AI赋能开发者之旅
              </p>
            </div>

            {/* Video Demo Section */}
            <div className="mb-16">
              <div className="card smart-glass shadow-quantum max-w-4xl mx-auto">
                <div className="card-body p-8">
                  <div className="aspect-video bg-base-300 rounded-lg relative overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <div className="text-center">
                        <div className="mb-4">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="64"
                            height="64"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-base-content/50 mx-auto"
                          >
                            <polygon points="5,3 19,12 5,21"></polygon>
                          </svg>
                        </div>
                        <p className="text-base-content/50">平台演示视频</p>
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        className="btn btn-circle btn-lg bg-quantum-gradient border-0 hover:scale-110 transition-transform"
                        onClick={playDemoVideo}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-base-content"
                        >
                          <polygon points="5,3 19,12 5,21"></polygon>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="text-center mt-6">
                    <h3 className="text-xl font-heading font-semibold text-base-content mb-2">
                      平台功能演示
                    </h3>
                    <p className="text-base-content/70">
                      3分钟了解PhoenixCoder如何重塑程序员价值
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* 任务广场 */}
              <div
                className="card smart-glass shadow-quantum hover:shadow-xl transition-all duration-300 feature-card cursor-pointer"
                onClick={() => handleNavigate('/tasks')}
              >
                <div className="card-body p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-accent"
                      >
                        <rect width="7" height="7" x="3" y="3" rx="1"></rect>
                        <rect width="7" height="7" x="14" y="3" rx="1"></rect>
                        <rect width="7" height="7" x="14" y="14" rx="1"></rect>
                        <rect width="7" height="7" x="3" y="14" rx="1"></rect>
                      </svg>
                    </div>
                    <h3 className="text-lg font-heading font-semibold text-base-content">
                      任务广场
                    </h3>
                  </div>
                  <p className="text-base-content/70 mb-4">
                    浏览海量高质量项目，AI智能推荐最适合你的任务
                  </p>
                  <div className="flex items-center text-accent text-sm font-medium">
                    <span>探索任务</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-2"
                    >
                      <path d="M5 12h14"></path>
                      <path d="m12 5 7 7-7 7"></path>
                    </svg>
                  </div>
                </div>
              </div>

              {/* 技能图谱 */}
              <div
                className="card smart-glass shadow-quantum hover:shadow-xl transition-all duration-300 feature-card cursor-pointer"
                onClick={() => handleNavigate('/skills')}
              >
                <div className="card-body p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary"
                      >
                        <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"></polygon>
                        <line x1="12" y1="22" x2="12" y2="15.5"></line>
                        <polyline points="22,8.5 12,15.5 2,8.5"></polyline>
                      </svg>
                    </div>
                    <h3 className="text-lg font-heading font-semibold text-base-content">
                      技能图谱
                    </h3>
                  </div>
                  <p className="text-base-content/70 mb-4">
                    可视化技能成长路径，AI推荐个性化学习计划
                  </p>
                  <div className="flex items-center text-accent text-sm font-medium">
                    <span>查看技能</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-2"
                    >
                      <path d="M5 12h14"></path>
                      <path d="m12 5 7 7-7 7"></path>
                    </svg>
                  </div>
                </div>
              </div>

              {/* IP档案 */}
              <div
                className="card smart-glass shadow-quantum hover:shadow-xl transition-all duration-300 feature-card cursor-pointer"
                onClick={() => handleNavigate('/profile')}
              >
                <div className="card-body p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-secondary"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                    <h3 className="text-lg font-heading font-semibold text-base-content">
                      IP档案
                    </h3>
                  </div>
                  <p className="text-base-content/70 mb-4">
                    构建专业技术档案，展示你的核心竞争力
                  </p>
                  <div className="flex items-center text-accent text-sm font-medium">
                    <span>管理档案</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-2"
                    >
                      <path d="M5 12h14"></path>
                      <path d="m12 5 7 7-7 7"></path>
                    </svg>
                  </div>
                </div>
              </div>

              {/* 挑战任务 */}
              <div
                className="card smart-glass shadow-quantum hover:shadow-xl transition-all duration-300 feature-card cursor-pointer"
                onClick={() => handleNavigate('/challenges')}
              >
                <div className="card-body p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-warning/20 rounded-lg flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-warning"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-heading font-semibold text-base-content">
                      挑战任务
                    </h3>
                  </div>
                  <p className="text-base-content/70 mb-4">
                    通过编程挑战提升技能，获得认证和奖励
                  </p>
                  <div className="flex items-center text-accent text-sm font-medium">
                    <span>开始挑战</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-2"
                    >
                      <path d="M5 12h14"></path>
                      <path d="m12 5 7 7-7 7"></path>
                    </svg>
                  </div>
                </div>
              </div>

              {/* 知识分享 */}
              <div
                className="card smart-glass shadow-quantum hover:shadow-xl transition-all duration-300 feature-card cursor-pointer"
                onClick={() => handleNavigate('/community')}
              >
                <div className="card-body p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-info/20 rounded-lg flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-info"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14,2 14,8 20,8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10,9 9,9 8,9"></polyline>
                      </svg>
                    </div>
                    <h3 className="text-lg font-heading font-semibold text-base-content">
                      知识分享
                    </h3>
                  </div>
                  <p className="text-base-content/70 mb-4">
                    分享技术文章，建立个人品牌，扩大影响力
                  </p>
                  <div className="flex items-center text-accent text-sm font-medium">
                    <span>发布文章</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-2"
                    >
                      <path d="M5 12h14"></path>
                      <path d="m12 5 7 7-7 7"></path>
                    </svg>
                  </div>
                </div>
              </div>

              {/* 项目管理 */}
              <div
                className="card smart-glass shadow-quantum hover:shadow-xl transition-all duration-300 feature-card cursor-pointer"
                onClick={() => handleNavigate('/projects')}
              >
                <div className="card-body p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-success"
                      >
                        <rect
                          width="8"
                          height="4"
                          x="8"
                          y="2"
                          rx="1"
                          ry="1"
                        ></rect>
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                        <path d="m9 14 2 2 4-4"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-heading font-semibold text-base-content">
                      项目管理
                    </h3>
                  </div>
                  <p className="text-base-content/70 mb-4">
                    高效管理项目进度，协作工具助力团队成功
                  </p>
                  <div className="flex items-center text-accent text-sm font-medium">
                    <span>管理项目</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-2"
                    >
                      <path d="M5 12h14"></path>
                      <path d="m12 5 7 7-7 7"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Data flow animation */}
          <div className="data-streams"></div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
