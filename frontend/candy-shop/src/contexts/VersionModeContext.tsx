import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type VersionMode = 'pro' | 'normal';

interface VersionModeContextType {
  mode: VersionMode;
  setMode: (mode: VersionMode) => void;
  toggleMode: () => void;
}

const VersionModeContext = createContext<VersionModeContextType | undefined>(undefined);

export function VersionModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<VersionMode>(() => {
    const saved = localStorage.getItem('versionMode');
    return (saved === 'normal' || saved === 'pro') ? saved : 'pro';
  });

  useEffect(() => {
    localStorage.setItem('versionMode', mode);
    document.documentElement.setAttribute('data-version-mode', mode);
  }, [mode]);

  const setMode = (newMode: VersionMode) => {
    setModeState(newMode);
  };

  const toggleMode = () => {
    setModeState(prev => prev === 'pro' ? 'normal' : 'pro');
  };

  return (
    <VersionModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </VersionModeContext.Provider>
  );
}

export function useVersionMode() {
  const context = useContext(VersionModeContext);
  if (!context) {
    throw new Error('useVersionMode must be used within VersionModeProvider');
  }
  return context;
}
