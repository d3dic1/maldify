// @ts-nocheck
import 'dotenv/config'; // Load environment variables from .env file
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";

import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import PrivacyWebhookHandlers from "./privacy.js";

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

// Helper function to get app URL with fallback logic
const getAppUrl = () => {
  let appUrl = process.env.SHOPIFY_APP_URL;
  
  // If SHOPIFY_APP_URL is not set and we're in development mode, use HOST from Shopify CLI
  if (!appUrl && process.env.NODE_ENV === 'development') {
    const cliHost = process.env.HOST || process.env.SHOPIFY_CLI_HOST || process.env.CLOUDFLARE_TUNNEL_URL;
    if (cliHost) {
      appUrl = cliHost.startsWith('http') ? cliHost : `https://${cliHost}`;
      // Set the environment variable for consistency
      process.env.SHOPIFY_APP_URL = appUrl;
      console.log('ℹ️  Development mode: Using Shopify CLI HOST as SHOPIFY_APP_URL:', appUrl);
    } else {
      // Fallback to localhost for development
      appUrl = 'http://localhost:45841';
      process.env.SHOPIFY_APP_URL = appUrl;
      console.log('ℹ️  Development mode: Using localhost fallback as SHOPIFY_APP_URL:', appUrl);
    }
  } else if (!appUrl) {
    // Production fallback
    appUrl = 'https://example.com';
    console.log('ℹ️  Production mode: Using fallback URL as SHOPIFY_APP_URL:', appUrl);
  }
  
  return appUrl;
};

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());

app.get("/api/products/count", async (_req, res) => {
  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  const countData = await client.request(`
    query shopifyProductCount {
      productsCount {
        count
      }
    }
  `);

  res.status(200).send({ count: countData.data.productsCount.count });
});

app.post("/api/products", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});

// Mock functions for subscription and usage tracking
// In production, these would interact with your database
const getSubscriptionStatus = async (session) => {
  // Mock: Check if shop has active Pro subscription
  // In production, this would query your billing/subscription database
  const mockProStatus = Math.random() > 0.5; // Random for demo purposes
  return {
    is_pro_plan: mockProStatus,
    plan_name: mockProStatus ? "Maldify Pro" : "Maldify Free"
  };
};

const getCurrentUsage = async (session) => {
  // Mock: Get current monthly usage count
  // In production, this would query your usage tracking database
  const mockUsage = Math.floor(Math.random() * 60); // Random 0-59 for demo
  return mockUsage;
};

const updateUsageCounter = async (session) => {
  // Mock: Increment usage counter
  // In production, this would update your usage tracking database
  console.log(`Usage counter incremented for shop: ${session.shop}`);
  return true;
};

// Maldify Post-Purchase Offer API
app.post("/api/public/get-offer", async (req, res) => {
  try {
    const { cart_id, customer_id } = req.body;
    const session = res.locals.shopify.session;

    // Validate required parameters
    if (!cart_id || !customer_id) {
      return res.status(400).json({
        error: "Missing required parameters: cart_id and customer_id are required"
      });
    }

    // Check subscription status and usage limits
    const subscriptionStatus = await getSubscriptionStatus(session);
    const currentUsage = await getCurrentUsage(session);

    // Free Plan Usage Limit Check
    if (!subscriptionStatus.is_pro_plan) {
      if (currentUsage >= 50) {
        return res.status(403).json({
          error: "PLAN_LIMIT_REACHED",
          message: "Free plan usage exhausted for this month.",
          current_usage: currentUsage,
          limit: 50,
          upgrade_url: "/billing/setup"
        });
      }
      
      // Increment usage counter for Free plan
      await updateUsageCounter(session);
    }

    // Get Shopify GraphQL client
    const client = new shopify.api.clients.Graphql({
      session: res.locals.shopify.session,
    });

    // Fetch cart data to count items
    const cartQuery = `
      query getCart($id: ID!) {
        cart(id: $id) {
          id
          lines(first: 100) {
            edges {
              node {
                id
                quantity
              }
            }
          }
        }
      }
    `;

    const cartData = await client.request(cartQuery, {
      variables: { id: cart_id }
    });

    const cart = cartData.data.cart;
    if (!cart) {
      return res.status(404).json({
        error: "Cart not found"
      });
    }

    // Count total items in cart
    const totalItems = cart.lines.edges.reduce((total, edge) => {
      return total + edge.node.quantity;
    }, 0);

    // Mock product data - in production, these would be fetched from your database
    const premiumAccessory = {
      id: "111222333",
      basePrice: 99.99
    };

    const complementaryItem = {
      id: "444555666", 
      basePrice: 49.99
    };

    let offer;

    if (totalItems > 2) {
      // Premium offer for customers with more than 2 items
      offer = {
        offer_product_id: premiumAccessory.id,
        offer_price: premiumAccessory.basePrice * 0.5, // 50% discount
        discount_percent: 50
      };
    } else {
      // Standard complementary item at full price
      offer = {
        offer_product_id: complementaryItem.id,
        offer_price: complementaryItem.basePrice,
        discount_percent: null
      };
    }

    // Log the offer for analytics (optional)
    console.log(`Maldify offer generated for customer ${customer_id}:`, {
      cart_id,
      totalItems,
      offer,
      subscription_status: subscriptionStatus,
      usage_count: subscriptionStatus.is_pro_plan ? "unlimited" : currentUsage + 1
    });

    // Include subscription info in response for frontend
    res.status(200).json({
      ...offer,
      subscription_info: {
        plan: subscriptionStatus.plan_name,
        is_pro: subscriptionStatus.is_pro_plan,
        usage_count: subscriptionStatus.is_pro_plan ? null : currentUsage + 1,
        usage_limit: subscriptionStatus.is_pro_plan ? null : 50
      }
    });

  } catch (error) {
    console.error("Error generating Maldify offer:", error);
    res.status(500).json({
      error: "Internal server error while generating offer"
    });
  }
});

// Maldify Billing API Routes
app.post("/api/billing/setup", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    
    // Safely read and validate environment variables
    const planName = process.env.SHOP_PLAN_NAME || "Maldify Pro Subscription";
    const planPrice = "29.99";
    
    // Get app URL with fallback logic
    const appUrl = getAppUrl();
    
    const planId = process.env.SHOP_PLAN_ID || "gid://shopify/ProductListing/1234567890";

    // Validate session
    if (!session || !session.shop) {
      return res.status(401).json({
        error: "Invalid session. Please ensure you're properly authenticated."
      });
    }

    console.log(`Creating billing subscription for shop: ${session.shop}`);
    console.log(`Plan: ${planName} - $${planPrice}/month`);
    console.log(`Plan ID: ${planId}`);
    console.log(`Return URL: ${appUrl}/billing-redirect`);

    // Use the GraphQL client from the session
    const client = new shopify.api.clients.Graphql({ session });
    
    const mutation = `
      mutation appSubscriptionCreate($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!, $test: Boolean) {
        appSubscriptionCreate(
          name: $name
          lineItems: $lineItems
          returnUrl: $returnUrl
          test: $test
        ) {
          appSubscription {
            id
            name
            status
            createdAt
            currentPeriodEnd
          }
          confirmationUrl
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      name: planName,
      lineItems: [
        {
          plan: {
            appRecurringPricingDetails: {
              price: {
                amount: parseFloat(planPrice),
                currencyCode: "USD"
              },
              interval: "EVERY_30_DAYS"
            }
          }
        }
      ],
      returnUrl: `${appUrl}/billing-redirect`,
      test: process.env.NODE_ENV !== "production"
    };

    const response = await client.query({ 
      data: { 
        query: mutation, 
        variables 
      } 
    });

    if (!response.body) {
      throw new Error("No response body received from Shopify");
    }

    // Type assertion to avoid TypeScript errors
    const data = response.body.data || {};
    
    if (data.appSubscriptionCreate && data.appSubscriptionCreate.userErrors && data.appSubscriptionCreate.userErrors.length > 0) {
      console.error("GraphQL user errors:", data.appSubscriptionCreate.userErrors);
      return res.status(400).json({
        error: "Failed to create billing subscription",
        user_errors: data.appSubscriptionCreate.userErrors,
        details: "GraphQL validation errors occurred"
      });
    }

    const confirmationUrl = data.appSubscriptionCreate?.confirmationUrl;
    const subscription = data.appSubscriptionCreate?.appSubscription;

    if (!confirmationUrl) {
      console.error("No confirmation URL received from Shopify");
      return res.status(500).json({
        error: "Failed to get billing confirmation URL",
        details: "Shopify did not return a confirmation URL"
      });
    }

    console.log(`Billing subscription created successfully: ${subscription?.id}`);
    console.log(`Confirmation URL: ${confirmationUrl}`);

    // Return response with confirmationUrl as requested
    res.status(200).send({
      confirmationUrl: confirmationUrl,
      success: true,
      subscription_id: subscription?.id,
      plan_name: planName,
      plan_price: planPrice,
      plan_id: planId,
      currency: "USD",
      shop: session.shop,
      test_mode: process.env.NODE_ENV !== "production",
      status: subscription?.status
    });

  } catch (error) {
    console.error("Error setting up billing:", error);
    
    // Provide more specific error messages based on error type
    let errorMessage = "Failed to create billing subscription";
    let errorCode = "BILLING_SETUP_ERROR";
    
    if (error.message.includes("unauthorized") || error.message.includes("401")) {
      errorMessage = "Unauthorized: Check your API credentials";
      errorCode = "UNAUTHORIZED";
    } else if (error.message.includes("invalid") || error.message.includes("400")) {
      errorMessage = "Invalid billing configuration";
      errorCode = "INVALID_CONFIG";
    } else if (error.message.includes("plan") || error.message.includes("billing")) {
      errorMessage = "Billing plan configuration error";
      errorCode = "PLAN_ERROR";
    } else if (error.message.includes("network") || error.message.includes("timeout")) {
      errorMessage = "Network error: Unable to connect to Shopify";
      errorCode = "NETWORK_ERROR";
    }
    
    res.status(500).json({
      error: errorMessage,
      error_code: errorCode,
      details: error.message,
      timestamp: new Date().toISOString(),
      shop: res.locals.shopify?.session?.shop || "unknown"
    });
  }
});

app.get("/api/billing/check", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    
    // Validate session
    if (!session || !session.shop) {
      return res.status(401).json({
        error: "Invalid session. Please ensure you're properly authenticated."
      });
    }

    console.log(`Checking billing status for shop: ${session.shop}`);

    // Use the GraphQL client from the session
    const client = new shopify.api.clients.Graphql({ session });
    
    const query = `
      query getRecurringCharges {
        currentAppInstallation {
          activeSubscriptions {
            id
            name
            status
            lineItems {
              id
              plan {
                pricingDetails {
                  ... on AppRecurringPricing {
                    price {
                      amount
                      currencyCode
                    }
                    interval
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await client.query({ data: { query } });
    
    if (!response.body) {
      throw new Error("No response body received from Shopify");
    }

    // Type assertion to avoid TypeScript errors
    const data = response.body.data || {};

    const activeSubscriptions = data?.currentAppInstallation?.activeSubscriptions || [];
    const hasActiveSubscription = activeSubscriptions.length > 0;
    const activePlan = hasActiveSubscription ? activeSubscriptions[0] : null;

    console.log(`Found ${activeSubscriptions.length} active subscriptions`);

    res.status(200).json({
      has_subscription: hasActiveSubscription,
      subscription_id: activePlan?.id || null,
      plan_name: activePlan?.name || null,
      plan_price: activePlan?.lineItems?.[0]?.plan?.pricingDetails?.price?.amount || null,
      currency: activePlan?.lineItems?.[0]?.plan?.pricingDetails?.price?.currencyCode || "USD",
      status: activePlan?.status || "inactive",
      shop: session.shop
    });

  } catch (error) {
    console.error("Error checking billing status:", error);
    
    // Provide more specific error messages
    let errorMessage = "Failed to check billing status";
    if (error.message.includes("unauthorized")) {
      errorMessage = "Unauthorized: Check your API credentials";
    } else if (error.message.includes("network")) {
      errorMessage = "Network error: Unable to connect to Shopify";
    }
    
    res.status(500).json({
      error: errorMessage,
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get available subscription plans
app.get("/api/billing/plans", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    
    // Validate session
    if (!session || !session.shop) {
      return res.status(401).json({
        error: "Invalid session. Please ensure you're properly authenticated."
      });
    }

    console.log(`Fetching subscription plans for shop: ${session.shop}`);

    // Define the three subscription plans
    const plans = [
      {
        name: "Free Plan",
        price_monthly: 0,
        features: [
          "Basic AI recommendations",
          "Up to 10 post-purchase upsells per month",
          "Standard analytics",
          "Email support"
        ],
        limit: 10
      },
      {
        name: "Starter Plan",
        price_monthly: 4.99,
        features: [
          "Advanced AI recommendations",
          "Up to 100 post-purchase upsells per month",
          "Enhanced analytics dashboard",
          "Custom discount strategies",
          "Priority email support"
        ],
        limit: 100
      },
      {
        name: "Pro Plan",
        price_monthly: 19.99,
        features: [
          "Premium AI recommendations",
          "Unlimited post-purchase upsells",
          "Advanced analytics and insights",
          "Custom discount strategies",
          "A/B testing for upsells",
          "Priority customer support",
          "API access"
        ],
        limit: 0 // 0 means unlimited
      }
    ];

    res.status(200).json({
      plans: plans,
      shop: session.shop,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    
    res.status(500).json({
      error: "Failed to fetch subscription plans",
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get("/billing-redirect", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const chargeId = req.query.charge_id;

    console.log(`Billing redirect received for shop: ${session.shop}`);
    console.log(`Charge ID: ${chargeId}`);

    if (!chargeId) {
      console.error("Missing charge_id parameter in billing redirect");
      return res.redirect(`${getAppUrl()}/?billing=error&reason=missing_charge_id`);
    }

    // Use GraphQL to activate the subscription
    const client = new shopify.api.clients.Graphql({ session });
    
    const mutation = `
      mutation appSubscriptionActivate($id: ID!) {
        appSubscriptionActivate(id: $id) {
          appSubscription {
            id
            name
            status
            currentPeriodEnd
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await client.query({ 
      data: { 
        query: mutation, 
        variables: { id: chargeId } 
      } 
    });

    if (!response.body) {
      throw new Error("No response body received from Shopify");
    }

    // Type assertion to avoid TypeScript errors
    const data = response.body.data || {};
    
    if (data.appSubscriptionActivate.userErrors.length > 0) {
      console.error("GraphQL user errors:", data.appSubscriptionActivate.userErrors);
      return res.redirect(`${getAppUrl()}/?billing=error&reason=activation_failed`);
    }

    const subscription = data.appSubscriptionActivate.appSubscription;
    console.log(`Billing activated successfully for shop: ${session.shop}`);
    console.log(`Activated subscription: ${subscription.id}`);

    // Redirect to admin with success message
    res.redirect(`${getAppUrl()}/?billing=success&plan=${subscription.name}`);

  } catch (error) {
    console.error("Error confirming billing:", error);
    res.redirect(`${getAppUrl()}/?billing=error&reason=${encodeURIComponent(error.message)}`);
  }
});

// Pause subscription
app.post("/api/billing/pause", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const { subscription_id } = req.body;
    
    // Validate session
    if (!session || !session.shop) {
      return res.status(401).json({
        error: "Invalid session. Please ensure you're properly authenticated."
      });
    }

    // Validate subscription ID
    if (!subscription_id) {
      return res.status(400).json({
        error: "Subscription ID is required"
      });
    }

    console.log(`Pausing subscription ${subscription_id} for shop: ${session.shop}`);

    // Use GraphQL to pause the subscription
    const client = new shopify.api.clients.Graphql({ session });
    
    const mutation = `
      mutation appSubscriptionPause($id: ID!) {
        appSubscriptionPause(id: $id) {
          appSubscription {
            id
            name
            status
            currentPeriodEnd
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await client.query({ 
      data: { 
        query: mutation, 
        variables: { id: subscription_id } 
      } 
    });

    if (!response.body) {
      throw new Error("No response body received from Shopify");
    }

    const data = response.body.data || {};
    
    if (data.appSubscriptionPause.userErrors.length > 0) {
      console.error("GraphQL user errors:", data.appSubscriptionPause.userErrors);
      return res.status(400).json({
        error: "Failed to pause subscription",
        details: data.appSubscriptionPause.userErrors[0].message
      });
    }

    const subscription = data.appSubscriptionPause.appSubscription;
    console.log(`Subscription paused successfully: ${subscription.id}`);

    res.status(200).json({
      success: true,
      message: "Subscription paused successfully",
      subscription: {
        id: subscription.id,
        name: subscription.name,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd
      },
      shop: session.shop
    });

  } catch (error) {
    console.error("Error pausing subscription:", error);
    
    res.status(500).json({
      error: "Failed to pause subscription",
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Cancel subscription
app.post("/api/billing/cancel", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const { subscription_id } = req.body;
    
    // Validate session
    if (!session || !session.shop) {
      return res.status(401).json({
        error: "Invalid session. Please ensure you're properly authenticated."
      });
    }

    // Validate subscription ID
    if (!subscription_id) {
      return res.status(400).json({
        error: "Subscription ID is required"
      });
    }

    console.log(`Canceling subscription ${subscription_id} for shop: ${session.shop}`);

    // Use GraphQL to cancel the subscription
    const client = new shopify.api.clients.Graphql({ session });
    
    const mutation = `
      mutation appSubscriptionCancel($id: ID!) {
        appSubscriptionCancel(id: $id) {
          appSubscription {
            id
            name
            status
            currentPeriodEnd
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await client.query({ 
      data: { 
        query: mutation, 
        variables: { id: subscription_id } 
      } 
    });

    if (!response.body) {
      throw new Error("No response body received from Shopify");
    }

    const data = response.body.data || {};
    
    if (data.appSubscriptionCancel.userErrors.length > 0) {
      console.error("GraphQL user errors:", data.appSubscriptionCancel.userErrors);
      return res.status(400).json({
        error: "Failed to cancel subscription",
        details: data.appSubscriptionCancel.userErrors[0].message
      });
    }

    const subscription = data.appSubscriptionCancel.appSubscription;
    console.log(`Subscription canceled successfully: ${subscription.id}`);

    res.status(200).json({
      success: true,
      message: "Subscription canceled successfully",
      subscription: {
        id: subscription.id,
        name: subscription.name,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd
      },
      shop: session.shop
    });

  } catch (error) {
    console.error("Error canceling subscription:", error);
    
    res.status(500).json({
      error: "Failed to cancel subscription",
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get ROI analytics
app.get("/api/analytics/roi", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    
    // Validate session
    if (!session || !session.shop) {
      return res.status(401).json({
        error: "Invalid session. Please ensure you're properly authenticated."
      });
    }

    console.log(`Fetching ROI analytics for shop: ${session.shop}`);

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const createdAtMin = thirtyDaysAgo.toISOString();

    // Get orders from the last 30 days using REST API
    const orders = await shopify.api.rest.Order.all({
      session,
      created_at_min: createdAtMin,
      status: 'any',
      limit: 250 // Shopify's max limit per request
    });

    console.log(`Found ${orders.data.length} orders in the last 30 days`);

    // Filter orders that were influenced by our app
    // We'll look for orders with specific tags or other indicators
    const appInfluencedOrders = orders.data.filter(order => {
      // Check if order has tags that indicate our app's influence
      const tags = order.tags ? order.tags.split(',').map(tag => tag.trim().toLowerCase()) : [];
      
      // Look for our app's influence indicators
      const hasAppTag = tags.some(tag => 
        tag.includes('maldify') || 
        tag.includes('upsell') || 
        tag.includes('post-purchase') ||
        tag.includes('ai-recommendation')
      );
      
      // Also check if order has line items that might indicate our influence
      const hasAppLineItems = order.line_items && order.line_items.some(item => 
        item.name && (
          item.name.toLowerCase().includes('upsell') ||
          item.name.toLowerCase().includes('recommended') ||
          item.name.toLowerCase().includes('ai-suggested')
        )
      );
      
      return hasAppTag || hasAppLineItems;
    });

    console.log(`Found ${appInfluencedOrders.length} app-influenced orders`);

    // Calculate total revenue from app-influenced orders
    const totalRevenue = appInfluencedOrders.reduce((sum, order) => {
      // Convert total_price from string to number
      const orderTotal = parseFloat(order.total_price) || 0;
      return sum + orderTotal;
    }, 0);

    // Monthly subscription cost (Pro plan)
    const monthlyCost = 29.99;
    
    // Calculate ROI
    const roi = totalRevenue - monthlyCost;

    // Calculate additional metrics
    const orderCount = appInfluencedOrders.length;
    const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;
    const roiPercentage = monthlyCost > 0 ? (roi / monthlyCost) * 100 : 0;

    console.log(`ROI Calculation: Revenue: $${totalRevenue.toFixed(2)}, Cost: $${monthlyCost}, ROI: $${roi.toFixed(2)}`);

    res.status(200).json({
      revenue: parseFloat(totalRevenue.toFixed(2)),
      cost: monthlyCost,
      roi: parseFloat(roi.toFixed(2)),
      roi_percentage: parseFloat(roiPercentage.toFixed(2)),
      order_count: orderCount,
      average_order_value: parseFloat(averageOrderValue.toFixed(2)),
      period_days: 30,
      shop: session.shop,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error fetching ROI analytics:", error);
    
    res.status(500).json({
      error: "Failed to fetch ROI analytics",
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// AI Product Recommendation API
app.post("/api/checkout/recommendation", (req, res, next) => {
  req.startTime = Date.now();
  next();
}, async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    
    // Validate session
    if (!session || !session.shop) {
      return res.status(401).json({
        error: "Invalid session. Please ensure you're properly authenticated."
      });
    }

    const { product_ids } = req.body;
    
    // Validate input
    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({
        error: "product_ids array is required and must not be empty"
      });
    }

    console.log(`Generating AI recommendations for shop: ${session.shop}`);
    console.log(`Product IDs in cart: ${product_ids.join(', ')}`);

    // AI/ML Logic - Placeholder implementation
    const recommendations = [];
    
    for (const productId of product_ids) {
      // Simple AI logic: If product is 101 (Phone), recommend 202 (Case)
      if (productId === 101) {
        recommendations.push({
          product_id: 202,
          message: "Preporučujemo futrolu za ovaj telefon! Zaštitite svoj uređaj sa našom premium futrolom.",
          confidence: 0.95,
          category: "accessories",
          original_product_id: productId
        });
      }
      // If product is 301 (Laptop), recommend 302 (Mouse)
      else if (productId === 301) {
        recommendations.push({
          product_id: 302,
          message: "Dodajte wireless miš za bolje iskustvo rada na laptopu!",
          confidence: 0.88,
          category: "accessories",
          original_product_id: productId
        });
      }
      // If product is 401 (Headphones), recommend 402 (Charger)
      else if (productId === 401) {
        recommendations.push({
          product_id: 402,
          message: "Ne zaboravite dodatni punjač za slušalice! Uvijek imajte rezervni.",
          confidence: 0.92,
          category: "accessories",
          original_product_id: productId
        });
      }
      // Generic recommendation for other products
      else {
        recommendations.push({
          product_id: 999,
          message: "Preporučujemo proširenje garancije za ovaj proizvod za dodatnu zaštitu!",
          confidence: 0.75,
          category: "warranty",
          original_product_id: productId
        });
      }
    }

    // If no specific recommendations, provide a general one
    if (recommendations.length === 0) {
      recommendations.push({
        product_id: 888,
        message: "Hvala vam na kupovini! Preporučujemo da pogledate naše najnovije proizvode.",
        confidence: 0.60,
        category: "general",
        original_product_id: null
      });
    }

    console.log(`Generated ${recommendations.length} recommendations`);

    res.status(200).json({
      success: true,
      recommendations: recommendations,
      cart_product_ids: product_ids,
      shop: session.shop,
      timestamp: new Date().toISOString(),
      ai_model: "maldify-v1.0",
      processing_time_ms: Date.now() - req.startTime || 0
    });

  } catch (error) {
    console.error("Error generating AI recommendations:", error);
    
    res.status(500).json({
      error: "Failed to generate recommendations",
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// AI Churn Risk Analysis API
app.get("/api/analytics/churn_risk", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    
    // Validate session
    if (!session || !session.shop) {
      return res.status(401).json({
        error: "Invalid session. Please ensure you're properly authenticated."
      });
    }

    console.log(`Analyzing churn risk for shop: ${session.shop}`);

    // Calculate date 90 days ago
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const startDate = ninetyDaysAgo.toISOString().split('T')[0];

    // Fetch orders from the last 90 days
    const orders = await shopify.api.rest.Order.all({
      session,
      limit: 250,
      created_at_min: startDate,
      status: 'any'
    });

    console.log(`Found ${orders.data.length} orders in the last 90 days`);

    // Fetch refunds from the last 90 days
    const refunds = await shopify.api.rest.Refund.all({
      session,
      limit: 250,
      created_at_min: startDate
    });

    console.log(`Found ${refunds.data.length} refunds in the last 90 days`);

    // Process orders to get product sales data
    const productSales = new Map();
    const productRefunds = new Map();

    // Analyze orders for sales
    orders.data.forEach(order => {
      if (order.line_items) {
        order.line_items.forEach(item => {
          const productId = item.product_id;
          const quantity = item.quantity;
          const price = parseFloat(item.price);

          if (productSales.has(productId)) {
            const existing = productSales.get(productId);
            productSales.set(productId, {
              total_quantity: existing.total_quantity + quantity,
              total_revenue: existing.total_revenue + (quantity * price),
              orders_count: existing.orders_count + 1,
              product_title: item.title,
              product_handle: item.variant_title || item.title
            });
          } else {
            productSales.set(productId, {
              total_quantity: quantity,
              total_revenue: quantity * price,
              orders_count: 1,
              product_title: item.title,
              product_handle: item.variant_title || item.title
            });
          }
        });
      }
    });

    // Analyze refunds
    refunds.data.forEach(refund => {
      if (refund.refund_line_items) {
        refund.refund_line_items.forEach(item => {
          const productId = item.line_item.product_id;
          const quantity = item.quantity;
          const price = parseFloat(item.line_item.price);

          if (productRefunds.has(productId)) {
            const existing = productRefunds.get(productId);
            productRefunds.set(productId, {
              total_quantity: existing.total_quantity + quantity,
              total_amount: existing.total_amount + (quantity * price),
              refunds_count: existing.refunds_count + 1
            });
          } else {
            productRefunds.set(productId, {
              total_quantity: quantity,
              total_amount: quantity * price,
              refunds_count: 1
            });
          }
        });
      }
    });

    // Calculate churn risk for each product
    const churnRiskData = [];
    
    productSales.forEach((salesData, productId) => {
      const refundData = productRefunds.get(productId) || {
        total_quantity: 0,
        total_amount: 0,
        refunds_count: 0
      };

      // Calculate return rate
      const returnRate = salesData.total_quantity > 0 
        ? (refundData.total_quantity / salesData.total_quantity) * 100 
        : 0;

      // Calculate revenue loss rate
      const revenueLossRate = salesData.total_revenue > 0 
        ? (refundData.total_amount / salesData.total_revenue) * 100 
        : 0;

      // Calculate risk score (weighted combination)
      const riskScore = (returnRate * 0.7) + (revenueLossRate * 0.3);

      churnRiskData.push({
        product_id: productId,
        product_title: salesData.product_title,
        product_handle: salesData.product_handle,
        total_sales: salesData.total_quantity,
        total_revenue: salesData.total_revenue,
        total_refunds: refundData.total_quantity,
        refund_amount: refundData.total_amount,
        return_rate: Math.round(returnRate * 100) / 100,
        revenue_loss_rate: Math.round(revenueLossRate * 100) / 100,
        risk_score: Math.round(riskScore * 100) / 100,
        orders_count: salesData.orders_count,
        refunds_count: refundData.refunds_count,
        risk_level: riskScore > 20 ? 'HIGH' : riskScore > 10 ? 'MEDIUM' : 'LOW'
      });
    });

    // Sort by risk score (highest first) and get top 5
    const topRiskyProducts = churnRiskData
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, 5);

    // Calculate overall statistics
    const totalProducts = churnRiskData.length;
    const highRiskProducts = churnRiskData.filter(p => p.risk_level === 'HIGH').length;
    const mediumRiskProducts = churnRiskData.filter(p => p.risk_level === 'MEDIUM').length;
    const lowRiskProducts = churnRiskData.filter(p => p.risk_level === 'LOW').length;

    const overallReturnRate = churnRiskData.length > 0 
      ? churnRiskData.reduce((sum, p) => sum + p.return_rate, 0) / churnRiskData.length 
      : 0;

    console.log(`Churn risk analysis completed. Found ${totalProducts} products, ${highRiskProducts} high risk`);

    res.status(200).json({
      success: true,
      analysis_period: {
        start_date: startDate,
        end_date: new Date().toISOString().split('T')[0],
        days: 90
      },
      summary: {
        total_products_analyzed: totalProducts,
        high_risk_products: highRiskProducts,
        medium_risk_products: mediumRiskProducts,
        low_risk_products: lowRiskProducts,
        overall_return_rate: Math.round(overallReturnRate * 100) / 100
      },
      top_risky_products: topRiskyProducts,
      shop: session.shop,
      timestamp: new Date().toISOString(),
      ai_model: "maldify-churn-v1.0"
    });

  } catch (error) {
    console.error("Error analyzing churn risk:", error);
    
    res.status(500).json({
      error: "Failed to analyze churn risk",
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
        .toString()
        .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
    );
});

app.listen(PORT);
