import React from 'react';
import Header from './Header';

const Layout = ({ children, connectionStatus }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header connectionStatus={connectionStatus} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default Layout;