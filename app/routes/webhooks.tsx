import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import db from "~/db.server";
import { actionForTopic } from "~/lib/webhook-topics";
import { authenticate } from "~/shopify.server";

// Single endpoint for every registered webhook topic. authenticate.webhook
// verifies the HMAC signature before this runs; an invalid signature never
// reaches the dispatch logic below (the package returns 401 itself).
export async function action({ request }: ActionFunctionArgs) {
  const { topic, shop, payload } = await authenticate.webhook(request);

  try {
    switch (actionForTopic(topic)) {
      case "delete-sessions": {
        await db.session.deleteMany({ where: { shop } });
        console.warn(
          JSON.stringify({ level: "info", msg: "deleted sessions after uninstall", shop, topic }),
        );
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
        console.warn(
          JSON.stringify({ level: "info", msg: "customer data request acknowledged", shop, topic }),
        );
        break;
      }

      case "acknowledge-customer-redact": {
        // No customer-linked data stored by this starter; acknowledge.
        console.warn(
          JSON.stringify({ level: "info", msg: "customer redact acknowledged", shop, topic }),
        );
        break;
      }

      case "delete-shop-data": {
        await db.shopSetting.deleteMany({ where: { shop } });
        await db.session.deleteMany({ where: { shop } });
        console.warn(
          JSON.stringify({ level: "info", msg: "deleted remaining shop data", shop, topic }),
        );
        break;
      }

      default: {
        console.warn(
          JSON.stringify({
            level: "warn",
            msg: "unhandled webhook topic acknowledged",
            shop,
            topic,
          }),
        );
      }
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        msg: "webhook processing failed",
        shop,
        topic,
        error: error instanceof Error ? error.message : String(error),
      }),
    );

    return json({ error: "processing failed" }, { status: 500 });
  }
}
