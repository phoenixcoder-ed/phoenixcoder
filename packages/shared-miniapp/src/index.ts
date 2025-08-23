// PhoenixCoder 小程序共享依赖包入口文件

// 导出共享类型
export * from '@phoenixcoder/shared-types';

// 导出共享工具函数
export * from '@phoenixcoder/shared-utils';

// 导出共享服务
export * from '@phoenixcoder/shared-services';

// 导出 Taro 相关
export { default as Taro } from '@tarojs/taro';
export * from '@tarojs/components';
export * from '@tarojs/react';

// 导出常用第三方库
export { default as axios } from 'axios';
export { default as moment } from 'moment';
export { default as _ } from 'lodash';
export { default as classNames } from 'classnames';

// 导出 React
export { default as React } from 'react';