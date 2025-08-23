import React from 'react';
import { Spinner } from '../ui/Spinner';

type LoadingProviderState = {
  isLoading: boolean;
  loadingTasks: Set<string>;
  startLoading: (taskId?: string) => void;
  stopLoading: (taskId?: string) => void;
  setLoading: (loading: boolean) => void;
};

const LoadingProviderContext = React.createContext<LoadingProviderState | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loadingTasks, setLoadingTasks] = React.useState<Set<string>>(new Set());
  const [globalLoading, setGlobalLoading] = React.useState(false);

  const startLoading = React.useCallback((taskId?: string) => {
    if (taskId) {
      setLoadingTasks((prev) => new Set(prev).add(taskId));
    } else {
      setGlobalLoading(true);
    }
  }, []);

  const stopLoading = React.useCallback((taskId?: string) => {
    if (taskId) {
      setLoadingTasks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    } else {
      setGlobalLoading(false);
    }
  }, []);

  const setLoading = React.useCallback((loading: boolean) => {
    setGlobalLoading(loading);
    if (!loading) {
      setLoadingTasks(new Set());
    }
  }, []);

  const isLoading = globalLoading || loadingTasks.size > 0;

  const value = {
    isLoading,
    loadingTasks,
    startLoading,
    stopLoading,
    setLoading,
  };

  return (
    <LoadingProviderContext.Provider value={value}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-4">
            <Spinner size="lg" />
            <p className="text-sm text-muted-foreground">加载中...</p>
          </div>
        </div>
      )}
    </LoadingProviderContext.Provider>
  );
}

export const useLoading = () => {
  const context = React.useContext(LoadingProviderContext);

  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }

  return context;
};