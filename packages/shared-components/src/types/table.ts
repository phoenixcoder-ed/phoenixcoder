import React from 'react';

// 表格列定义类型
export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  fixed?: 'left' | 'right';
}

// 表格数据类型
export interface TableData {
  [key: string]: unknown;
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
  filtering?: Record<string, unknown>;
  selection?: {
    type: 'checkbox' | 'radio';
    selectedRowKeys: string[];
    onChange: (selectedRowKeys: string[], selectedRows: TableData[]) => void;
  };
}