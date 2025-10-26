import { Provider as ShopifyAppBridgeProvider } from '@shopify/app-bridge-react';

// Re-export the official App Bridge Provider
export function AppBridgeProvider({ children, config }) {
  return (
    <ShopifyAppBridgeProvider config={config}>
      {children}
    </ShopifyAppBridgeProvider>
  );
}

// Re-export the official useAppBridge hook
export { useAppBridge } from '@shopify/app-bridge-react';
