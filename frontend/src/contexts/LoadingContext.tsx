import React, { createContext, useCallback, useContext, useState } from 'react';
import LoadingOverlay from '../components/ui/LoadingOverlay';

type LoadingContextValue = {
  show: (message?: string) => void;
  hide: () => void;
  visible: boolean;
};

const LoadingContext = createContext<LoadingContextValue | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);

  const show = useCallback((msg?: string) => {
    setMessage(msg);
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
    setMessage(undefined);
  }, []);

  return (
    <LoadingContext.Provider value={{ show, hide, visible }}>
      {children}
      <LoadingOverlay visible={visible} message={message} />
    </LoadingContext.Provider>
  );
};

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useLoading must be used within LoadingProvider');
  return ctx;
}
