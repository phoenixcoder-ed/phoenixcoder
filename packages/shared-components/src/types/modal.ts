import React from 'react';

// Modal 属性类型
export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: ModalSize;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  preventScroll?: boolean;
}

// Modal 大小类型
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

// Modal 上下文类型
export interface ModalContextType {
  modals: ModalState[];
  openModal: (modal: Omit<ModalState, 'id'>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
}

// Modal 状态类型
export interface ModalState {
  id: string;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
  size?: ModalSize;
}