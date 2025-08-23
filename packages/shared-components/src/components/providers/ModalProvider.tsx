import React from 'react';
import { Modal } from '../ui/Modal';

export interface ModalData {
  id: string;
  title?: string;
  content: React.ReactNode;
  footer?: React.ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

type ModalProviderState = {
  modals: ModalData[];
  openModal: (modal: Omit<ModalData, 'id'>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
};

const ModalProviderContext = React.createContext<ModalProviderState | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modals, setModals] = React.useState<ModalData[]>([]);

  const openModal = React.useCallback((modal: Omit<ModalData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newModal: ModalData = {
      ...modal,
      id,
      closeOnOverlayClick: modal.closeOnOverlayClick ?? true,
      closeOnEscape: modal.closeOnEscape ?? true,
      size: modal.size ?? 'md',
    };

    setModals((prev) => [...prev, newModal]);
    return id;
  }, []);

  const closeModal = React.useCallback((id: string) => {
    setModals((prev) => prev.filter((modal) => modal.id !== id));
  }, []);

  const closeAllModals = React.useCallback(() => {
    setModals([]);
  }, []);

  const value = {
    modals,
    openModal,
    closeModal,
    closeAllModals,
  };

  return (
    <ModalProviderContext.Provider value={value}>
      {children}
      {modals.map((modal) => (
        <Modal
          key={modal.id}
          isOpen={true}
          onClose={() => closeModal(modal.id)}
          closeOnOverlayClick={modal.closeOnOverlayClick}
          closeOnEscape={modal.closeOnEscape}
          size={modal.size}
        >
          {modal.title && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold">{modal.title}</h2>
            </div>
          )}
          <div className="mb-4">{modal.content}</div>
          {modal.footer && <div className="mt-4">{modal.footer}</div>}
        </Modal>
      ))}
    </ModalProviderContext.Provider>
  );
}

export const useModal = () => {
  const context = React.useContext(ModalProviderContext);

  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }

  return context;
};