import React from 'react';
import { Provider } from '@shopify/app-bridge-react';

export function AppBridgeProvider({ children, config }) {
  return (
    <Provider config={config}>
      {children}
    </Provider>
  );
}
