import React from 'react';

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen p-8" style={{ background: 'linear-gradient(180deg,#0b6b57 0%, #064e3b 100%)' }}>
      <div className="dashboard-container p-6" style={{ paddingTop: 28 }}>{children}</div>
    </div>
  );
};

export default {};
