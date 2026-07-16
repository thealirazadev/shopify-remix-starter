import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import { actionForTopic } from "~/lib/webhook-topics";
import { authenticate } from "~/shopify.server";

// Single endpoint for every registered webhook topic. authenticate.webhook
// verifies the HMAC signature before this runs; an invalid signature never
// reaches the dispatch logic below (the package returns 401 itself).
export async function action({ request }: ActionFunctionArgs) {
  const { topic, shop } = await authenticate.webhook(request);

  try {
    switch (actionForTopic(topic)) {
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
