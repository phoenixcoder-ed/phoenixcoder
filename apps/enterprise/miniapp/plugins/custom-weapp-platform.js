// 自定义微信小程序平台插件
const path = require('path');

module.exports = (ctx) => {
  console.log('自定义微信小程序平台插件已加载 (custom-weapp)');

  // 注册平台
  ctx.registerPlatform({
    name: 'custom-weapp',
    useConfigName: 'weapp', // 使用weapp配置而非mini
    async fn (args) {
      console.log('传入的参数:', args);
      // 从命令行参数中获取类型
      const type = ctx.runOpts.type || 'custom-weapp';
      console.log('编译类型:', type);
      console.log('构建配置:', args.config);

      // 确保类型正确
      if (type !== 'custom-weapp') {
        console.error('请传入正确的编译类型: custom-weapp');
        process.exit(1);
      }

      // 实现编译逻辑
      try {
        const viteRunner = require('@tarojs/vite-runner');
        // 使用当前工作目录作为appPath
        const appPath = process.cwd();
        console.log('appPath:', appPath);

        // 确保配置完整
        const config = {
          ...args.config,
          platform: 'custom-weapp',
          framework: 'react',
          // 添加可能缺失的配置项
          isSupportRecursive: false,
          // 明确指定compiler类型
          compiler: 'vite'
        };

        console.log('viteRunner配置:', JSON.stringify(config, null, 2));

        // 直接调用viteRunner
        await viteRunner(appPath, config);
        console.log('构建成功');
      } catch (error) {
        console.error('构建失败:', error);
        console.error('错误堆栈:', error.stack);
        process.exit(1);
      }
    }
  });

  // 返回插件配置
  return {
    platform: 'custom-weapp',
    framework: 'react'
  };
};