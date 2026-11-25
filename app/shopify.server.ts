import "./lib/env.server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import {
  ApiVersion,
  AppDistribution,
  BillingInterval,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";

import db from "./db.server";

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
  // Webhook subscriptions live in shopify.app.toml only (app-specific
  // subscriptions, applied by `shopify app deploy`). Registering the same
  // topics per shop in afterAuth as well would deliver each event twice.
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
export const sessionStorage = shopify.sessionStorage;
