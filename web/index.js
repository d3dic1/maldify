// @ts-check
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
    const appUrl = process.env.SHOPIFY_APP_URL;
    const planId = process.env.SHOP_PLAN_ID;
    
    // Validate required environment variables
    const missingVars = [];
    if (!appUrl) missingVars.push("SHOPIFY_APP_URL");
    if (!planId) missingVars.push("SHOP_PLAN_ID");
    
    if (missingVars.length > 0) {
      console.error(`Missing required environment variables: ${missingVars.join(", ")}`);
      return res.status(500).json({
        error: "Billing plan not configured. Please set the following environment variables:",
        missing_variables: missingVars,
        details: "Required: SHOPIFY_APP_URL, SHOP_PLAN_ID"
      });
    }

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

    // Use REST API to create a new recurring subscription
    const recurringCharge = new shopify.api.rest.RecurringApplicationCharge({ session });
    recurringCharge.name = planName;
    recurringCharge.price = planPrice;
    recurringCharge.currency = "USD";
    recurringCharge.return_url = `${appUrl}/billing-redirect`;
    recurringCharge.test = process.env.NODE_ENV !== "production";

    await recurringCharge.save({
      update: true,
    });

    console.log(`Billing subscription created successfully: ${recurringCharge.id}`);
    console.log(`Confirmation URL: ${recurringCharge.confirmation_url}`);

    // Ensure we have the confirmation URL
    const confirmationUrl = recurringCharge.confirmation_url;
    if (!confirmationUrl) {
      console.error("No confirmation URL received from Shopify");
      return res.status(500).json({
        error: "Failed to get billing confirmation URL",
        details: "Shopify did not return a confirmation URL"
      });
    }

    // Return comprehensive response with both billing_url and confirmationUrl for compatibility
    res.status(200).json({
      success: true,
      billing_url: confirmationUrl,
      confirmationUrl: confirmationUrl, // Add this for frontend compatibility
      subscription_id: recurringCharge.id,
      plan_name: planName,
      plan_price: planPrice,
      plan_id: planId,
      currency: "USD",
      shop: session.shop,
      test_mode: process.env.NODE_ENV !== "production",
      status: recurringCharge.status
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

    // Use REST API to check for active recurring charges
    const recurringCharges = await shopify.api.rest.RecurringApplicationCharge.all({
      session,
      status: "active"
    });

    const hasActiveSubscription = recurringCharges.data && recurringCharges.data.length > 0;
    const activePlan = hasActiveSubscription ? recurringCharges.data[0] : null;

    console.log(`Found ${recurringCharges.data?.length || 0} active subscriptions`);

    res.status(200).json({
      has_subscription: hasActiveSubscription,
      plan_name: activePlan?.name || null,
      plan_price: activePlan?.price || null,
      currency: "USD",
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

app.get("/billing-redirect", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const chargeId = req.query.charge_id;

    console.log(`Billing redirect received for shop: ${session.shop}`);
    console.log(`Charge ID: ${chargeId}`);

    if (!chargeId) {
      console.error("Missing charge_id parameter in billing redirect");
      return res.redirect(`${process.env.SHOPIFY_APP_URL}/?billing=error&reason=missing_charge_id`);
    }

    // Use REST API to activate the subscription
    const recurringCharge = new shopify.api.rest.RecurringApplicationCharge({ session });
    recurringCharge.id = chargeId;

    await recurringCharge.activate();

    console.log(`Billing activated successfully for shop: ${session.shop}`);
    console.log(`Activated subscription: ${recurringCharge.id}`);

    // Redirect to admin with success message
    res.redirect(`${process.env.SHOPIFY_APP_URL}/?billing=success&plan=${recurringCharge.name}`);

  } catch (error) {
    console.error("Error confirming billing:", error);
    res.redirect(`${process.env.SHOPIFY_APP_URL}/?billing=error&reason=${encodeURIComponent(error.message)}`);
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
