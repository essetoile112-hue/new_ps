import React, { createContext, useContext, useState, ReactNode } from 'react';

type TabsContextType = { value: string; setValue: (v: string) => void };
const TabsContext = createContext<TabsContextType | null>(null);

export const Tabs = ({ defaultValue, children }: { defaultValue?: string; children: ReactNode }) => {
  const [value, setValue] = useState(defaultValue || 'overview');
  return <TabsContext.Provider value={{ value, setValue }}>{children}</TabsContext.Provider>;
};

export const TabsList = ({ children }: { children: ReactNode }) => {
  return <div className="flex gap-2 flex-wrap">{children}</div>;
};

export const TabsTrigger = ({ value, children }: { value: string; children: ReactNode }) => {
  const ctx = useContext(TabsContext)!;
  const active = ctx.value === value;
  return (
    <button
      onClick={() => ctx.setValue(value)}
      className={`px-3 py-2 rounded-full font-medium ${active ? 'btn-emerald' : 'bg-white/10 text-white/90'} transition`}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, children }: { value: string; children: ReactNode }) => {
  const ctx = useContext(TabsContext)!;
  if (ctx.value !== value) return null;
  return <div className="mt-4">{children}</div>;
};

export default {};
