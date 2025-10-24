import { BillingInterval, LATEST_API_VERSION } from "@shopify/shopify-api";
import { shopifyApp } from "@shopify/shopify-app-express";
import { SQLiteSessionStorage } from "@shopify/shopify-app-session-storage-sqlite";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-10";

const DB_PATH = `${process.cwd()}/database.sqlite`;

// Validate required environment variables
const requiredEnvVars = {
  SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET,
  SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL,
  HOST: process.env.HOST,
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please set the following environment variables:');
  missingVars.forEach(varName => {
    console.error(`  - ${varName}`);
  });
  process.exit(1);
}

// Extract host information from SHOPIFY_APP_URL
const appUrl = new URL(process.env.SHOPIFY_APP_URL);
const hostName = appUrl.hostname;
const hostScheme = appUrl.protocol.replace(':', '');

console.log('✅ Shopify App Configuration:');
console.log(`  - API Key: ${process.env.SHOPIFY_API_KEY}`);
console.log(`  - Host: ${hostName}`);
console.log(`  - Scheme: ${hostScheme}`);
console.log(`  - App URL: ${process.env.SHOPIFY_APP_URL}`);

// The transactions with Shopify will always be marked as test transactions, unless NODE_ENV is production.
// See the ensureBilling helper to learn more about billing in this template.
const billingConfig = {
  "Maldify Pro": {
    amount: 29.99,
    currencyCode: "USD",
    interval: BillingInterval.Every30Days,
  },
};

const shopify = shopifyApp({
  api: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes: process.env.SHOPIFY_SCOPES?.split(',') || ['read_orders', 'read_customers', 'read_products', 'write_products', 'write_checkouts'],
    hostName: hostName,
    hostScheme: hostScheme,
    apiVersion: LATEST_API_VERSION,
    restResources,
    future: {
      customerAddressDefaultFix: true,
      lineItemBilling: true,
      unstable_managedPricingSupport: true,
    },
    billing: billingConfig,
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  // This should be replaced with your preferred storage strategy
  sessionStorage: new SQLiteSessionStorage(DB_PATH),
});

export default shopify;
