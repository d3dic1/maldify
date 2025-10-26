import React, { createContext, useContext } from 'react';
import { createApp } from '@shopify/app-bridge';

// Create App Bridge context
const AppBridgeContext = createContext(null);

export function AppBridgeProvider({ children, config }) {
  const app = createApp(config);
  
  return (
    <AppBridgeContext.Provider value={app}>
      {children}
    </AppBridgeContext.Provider>
  );
}

// Hook to use App Bridge
export function useAppBridge() {
  const app = useContext(AppBridgeContext);
  if (!app) {
    throw new Error('useAppBridge must be used within AppBridgeProvider');
  }
  return app;
}
