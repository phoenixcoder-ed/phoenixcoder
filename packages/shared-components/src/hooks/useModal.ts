import { useState, useCallback } from 'react';

interface ModalState {
  isOpen: boolean;
  data?: unknown;
}

// 模态框管理 Hook
export function useModal(initialOpen: boolean = false) {
  const [state, setState] = useState<ModalState>({
    isOpen: initialOpen,
    data: undefined,
  });

  const open = useCallback((data?: unknown) => {
    setState({ isOpen: true, data });
  }, []);

  const close = useCallback(() => {
    setState({ isOpen: false, data: undefined });
  }, []);

  const toggle = useCallback((data?: unknown) => {
    setState(prev => ({
      isOpen: !prev.isOpen,
      data: !prev.isOpen ? data : undefined,
    }));
  }, []);

  const setData = useCallback((data: unknown) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  return {
    isOpen: state.isOpen,
    data: state.data,
    open,
    close,
    toggle,
    setData,
  };
}

// 多模态框管理 Hook
export function useMultiModal() {
  const [modals, setModals] = useState<Record<string, ModalState>>({});

  const openModal = useCallback((id: string, data?: unknown) => {
    setModals(prev => ({
      ...prev,
      [id]: { isOpen: true, data },
    }));
  }, []);

  const closeModal = useCallback((id: string) => {
    setModals(prev => ({
      ...prev,
      [id]: { isOpen: false, data: undefined },
    }));
  }, []);

  const toggleModal = useCallback((id: string, data?: unknown) => {
    setModals(prev => {
      const current = prev[id] || { isOpen: false, data: undefined };
      return {
        ...prev,
        [id]: {
          isOpen: !current.isOpen,
          data: !current.isOpen ? data : undefined,
        },
      };
    });
  }, []);

  const closeAllModals = useCallback(() => {
    setModals(prev => {
      const newModals: Record<string, ModalState> = {};
      Object.keys(prev).forEach(id => {
        newModals[id] = { isOpen: false, data: undefined };
      });
      return newModals;
    });
  }, []);

  const isModalOpen = useCallback((id: string) => {
    return modals[id]?.isOpen || false;
  }, [modals]);

  const getModalData = useCallback((id: string) => {
    return modals[id]?.data;
  }, [modals]);

  return {
    modals,
    openModal,
    closeModal,
    toggleModal,
    closeAllModals,
    isModalOpen,
    getModalData,
  };
}