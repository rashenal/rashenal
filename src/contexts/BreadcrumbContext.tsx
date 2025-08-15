import React, { createContext, useContext, useState, ReactNode } from 'react';

interface BreadcrumbItem {
  name: string;
  href: string;
  current: boolean;
}

interface BreadcrumbContextType {
  customBreadcrumbs: BreadcrumbItem[] | null;
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
  clearBreadcrumbs: () => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [customBreadcrumbs, setCustomBreadcrumbs] = useState<BreadcrumbItem[] | null>(null);

  const setBreadcrumbs = React.useCallback((items: BreadcrumbItem[]) => {
    setCustomBreadcrumbs(items);
  }, []);

  const clearBreadcrumbs = React.useCallback(() => {
    setCustomBreadcrumbs(null);
  }, []);

  return (
    <BreadcrumbContext.Provider value={{
      customBreadcrumbs,
      setBreadcrumbs,
      clearBreadcrumbs,
    }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbs() {
  const context = useContext(BreadcrumbContext);
  if (context === undefined) {
    throw new Error('useBreadcrumbs must be used within a BreadcrumbProvider');
  }
  return context;
}
