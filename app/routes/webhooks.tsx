import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import db from "~/db.server";
import { logger } from "~/lib/logger.server";
import { actionForTopic } from "~/lib/webhook-topics";
import { authenticate } from "~/shopify.server";

// Single endpoint for every registered webhook topic. authenticate.webhook
// verifies the HMAC signature before this runs; an invalid signature never
// reaches the dispatch logic below (the package returns 401 itself).
export async function action({ request }: ActionFunctionArgs) {
  const { topic, shop, payload } = await authenticate.webhook(request);

  logger.info("webhook received", { shop, topic });

  try {
    switch (actionForTopic(topic)) {
      case "delete-sessions": {
        await db.session.deleteMany({ where: { shop } });
        logger.info("deleted sessions after uninstall", { shop, topic });
        break;
      }

      case "update-scope": {
        const scopes = (payload as { current?: string[] }).current;

        if (scopes) {
          await db.session.updateMany({ where: { shop }, data: { scope: scopes.join(",") } });
        }

        break;
      }

      case "acknowledge-data-request": {
        // No PII stored by this starter beyond the Session/ShopSetting
        // tables; acknowledge the request.
        logger.info("customer data request acknowledged", { shop, topic });
        break;
      }

      case "acknowledge-customer-redact": {
        // No customer-linked data stored by this starter; acknowledge.
        logger.info("customer redact acknowledged", { shop, topic });
        break;
      }

      case "delete-shop-data": {
        await db.shopSetting.deleteMany({ where: { shop } });
        await db.session.deleteMany({ where: { shop } });
        logger.info("deleted remaining shop data", { shop, topic });
        break;
      }

      default: {
        logger.warn("unhandled webhook topic acknowledged", { shop, topic });
      }
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    logger.error("webhook processing failed", {
      shop,
      topic,
      error: error instanceof Error ? error.message : String(error),
    });

    return json({ error: "processing failed" }, { status: 500 });
  }
}
