// 自定义微信小程序平台插件实现
const path = require('path');

module.exports = (ctx) => {
  // 插件实现代码
  console.log('Custom platform weapp plugin loaded');

  // 获取Taro的默认小程序平台配置
  const defaultWeappConfig = require('@tarojs/service/dist/config/platform/weapp').default;

  // 返回插件配置
  return {
    platform: 'weapp',
    // 继承默认微信小程序配置
    ...defaultWeappConfig,
    // 自定义配置
    framework: 'react',
    // 配置文件解析器
    resolver: path.resolve(__dirname, './resolver'),
    // 模板渲染器
    template: path.resolve(__dirname, './template')
  };
};

// 创建必要的目录结构
const fs = require('fs');
const resolverDir = path.resolve(__dirname, './resolver');
const templateDir = path.resolve(__dirname, './template');

if (!fs.existsSync(resolverDir)) {
  fs.mkdirSync(resolverDir, { recursive: true });
  fs.writeFileSync(path.resolve(resolverDir, 'index.js'), '//  resolver implementation will be added here');
}

if (!fs.existsSync(templateDir)) {
  fs.mkdirSync(templateDir, { recursive: true });
  fs.writeFileSync(path.resolve(templateDir, 'index.js'), '//  template implementation will be added here');
}