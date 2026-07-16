import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Card, Layout, Page, Text } from "@shopify/polaris";

import { authenticate } from "~/shopify.server";

// Demonstrates a second embedded route reachable via App Bridge NavMenu.
// No data mutation; proves navigation and layout patterns only.
export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);

  return json({});
}

export default function AdditionalPage() {
  return (
    <Page title="Additional page">
      <Layout>
        <Layout.Section>
          <Card>
            <Text as="p">
              This route exists to demonstrate App Bridge navigation between two embedded pages. It
              holds no data of its own.
            </Text>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
