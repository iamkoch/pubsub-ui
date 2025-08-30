import React from 'react';

const Header = ({ connectionStatus = 'connected' }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">PubSub UI</h1>
            <p className="text-sm text-gray-500">Message Publisher & Subscriber</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            connectionStatus === 'connected' 
              ? 'bg-success-500/10 text-success-500' 
              : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-1.5 ${
              connectionStatus === 'connected' ? 'bg-success-500' : 'bg-red-500'
            }`}></div>
            {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;