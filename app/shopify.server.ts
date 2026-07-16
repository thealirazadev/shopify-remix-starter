import "./lib/env.server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import {
  ApiVersion,
  AppDistribution,
  BillingInterval,
  DeliveryMethod,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";

import db from "./db.server";
import { logger } from "./lib/logger.server";

// Billing is config-toggleable so the starter installs without forcing a
// charge; see app/lib/billing.server.ts. Flip to true to require the demo
// plan on the gated demo route.
export const BILLING_ENABLED = process.env.BILLING_ENABLED === "true";

const DEMO_PLAN = "Demo Monthly";

const shopify = shopifyApp({
  // assertRequiredEnv() (imported above) has already thrown at startup if any
  // of these are missing, so the non-null assertions here are safe.
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL!,
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(db),
  distribution: AppDistribution.AppStore,
  // The plan is always declared so the config type is concrete; whether it
  // is ever checked is controlled entirely by BILLING_ENABLED in
  // app/lib/billing.server.ts, so the starter never forces a charge unless
  // that flag is turned on.
  billing: {
    [DEMO_PLAN]: {
      lineItems: [
        {
          amount: 5,
          currencyCode: "USD",
          interval: BillingInterval.Every30Days,
        },
      ],
    },
  },
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    APP_SCOPES_UPDATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    CUSTOMERS_DATA_REQUEST: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    CUSTOMERS_REDACT: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    SHOP_REDACT: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
  },
  hooks: {
    afterAuth: async ({ session }) => {
      try {
        await shopify.registerWebhooks({ session });
      } catch (error) {
        logger.error("failed to register webhooks after auth", {
          shop: session.shop,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  },
  future: {
    unstable_newEmbeddedAuthStrategy: true,
  },
});

export const DEMO_BILLING_PLAN = DEMO_PLAN;

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
