import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Card, Layout, Page, Text } from "@shopify/polaris";

import { requireActiveSubscription } from "~/lib/billing.server";
import { authenticate } from "~/shopify.server";

// Demo gated route: reachable without a subscription while billing is
// disabled (default). Set BILLING_ENABLED=true to require the demo plan;
// shops without it are redirected to the managed confirmation URL.
export async function loader({ request }: LoaderFunctionArgs) {
  const { billing } = await authenticate.admin(request);
  await requireActiveSubscription(billing);

  return json({});
}

export default function BillingDemo() {
  return (
    <Page title="Billing demo">
      <Layout>
        <Layout.Section>
          <Card>
            <Text as="p">
              This route is gated by the billing helper in app/lib/billing.server.ts. It is
              reachable now because billing is disabled by default; set BILLING_ENABLED=true to
              require the demo subscription.
            </Text>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
