import React from "react";
import { BrowserRouter } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NavMenu } from "@shopify/app-bridge-react";
import { AppProvider } from "@shopify/polaris";
import { Banner } from "@shopify/polaris";
import Routes from "./Routes";

import { QueryProvider, PolarisProvider } from "./components";

// Debug component to catch and display errors
function ErrorBoundary({ children }) {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const handleError = (error) => {
      console.error('React Error Caught:', error);
      setHasError(true);
      setError(error);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  if (hasError) {
    return (
      <div style={{ padding: '20px' }}>
        <Banner status="critical" title="Application Error">
          <p>An error occurred while loading the application:</p>
          <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px' }}>
            {error?.message || 'Unknown error'}
          </pre>
          <p style={{ marginTop: '10px' }}>
            Check the browser console for more details.
          </p>
        </Banner>
      </div>
    );
  }

  return children;
}

export default function App() {
  // Any .tsx or .jsx files in /pages will become a route
  // See documentation for <Routes /> for more info
  const pages = import.meta.glob("./pages/**/!(*.test.[jt]sx)*.([jt]sx)", {
    eager: true,
  });
  const { t } = useTranslation();

  // App Bridge configuration
  const config = {
    apiKey: import.meta.env.VITE_SHOPIFY_API_KEY,
    host: new URLSearchParams(location.search).get("host"),
    forceRedirect: true,
  };

  console.log('App Bridge Config:', config);

  return (
    <ErrorBoundary>
      <PolarisProvider>
        <BrowserRouter>
          <QueryProvider>
            <NavMenu>
              <a href="/" rel="home" />
              <a href="/pagename">{t("NavigationMenu.pageName")}</a>
            </NavMenu>
            <Routes pages={pages} />
          </QueryProvider>
        </BrowserRouter>
      </PolarisProvider>
    </ErrorBoundary>
  );
}
