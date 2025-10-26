import React, { createContext, useContext } from 'react';
import { createApp } from '@shopify/app-bridge';

// Create App Bridge context
const AppBridgeContext = createContext(null);

export function AppBridgeProvider({ children, config }) {
  // Create App Bridge instance with error handling
  let app = null;
  try {
    if (config.apiKey && config.host) {
      app = createApp(config);
    } else {
      console.warn('App Bridge config is incomplete:', config);
    }
  } catch (error) {
    console.error('Failed to create App Bridge instance:', error);
  }
  
  return (
    <AppBridgeContext.Provider value={app}>
      {children}
    </AppBridgeContext.Provider>
  );
}

// Hook to use App Bridge
export function useAppBridge() {
  const app = useContext(AppBridgeContext);
  // Return null instead of throwing error to prevent app crashes
  // Components should check if app exists before using it
  return app;
}
