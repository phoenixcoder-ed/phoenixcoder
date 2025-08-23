import React from 'react';

// 表格列定义类型
export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  fixed?: 'left' | 'right';
}

// 表格数据类型
export interface TableData {
  [key: string]: any;
}

// 表格配置类型
export interface TableConfig {
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    showSizeChanger?: boolean;
    showQuickJumper?: boolean;
  };
  sorting?: {
    field: string;
    order: 'asc' | 'desc';
  };
  filtering?: Record<string, any>;
  selection?: {
    type: 'checkbox' | 'radio';
    selectedRowKeys: string[];
    onChange: (selectedRowKeys: string[], selectedRows: any[]) => void;
  };
}