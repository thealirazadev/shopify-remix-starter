import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import {
  BlockStack,
  Button,
  Card,
  FormLayout,
  Layout,
  Page,
  Text,
  TextField,
} from "@shopify/polaris";
import { useState } from "react";

import db from "~/db.server";
import { LABEL_MAX_LENGTH, validateLabel } from "~/lib/validate-label";
import { authenticate } from "~/shopify.server";

const SHOP_AND_PRODUCTS_QUERY = `#graphql
  query ShopAndProducts($first: Int!) {
    shop {
      name
      myshopifyDomain
    }
    products(first: $first) {
      edges {
        node {
          id
          title
          status
        }
      }
    }
  }
`;

interface ShopAndProductsResponse {
  data?: {
    shop: { name: string; myshopifyDomain: string };
    products: { edges: { node: { id: string; title: string; status: string } }[] };
  };
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const response = await admin.graphql(SHOP_AND_PRODUCTS_QUERY, { variables: { first: 5 } });
  const body = (await response.json()) as ShopAndProductsResponse;

  if (!body.data) {
    throw new Error("Admin GraphQL returned no data");
  }

  const setting = await db.shopSetting.findUnique({ where: { shop: session.shop } });

  return json({
    shopName: body.data.shop.name,
    products: body.data.products.edges.map((edge) => edge.node),
    label: setting?.label ?? "",
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const rawLabel = String(formData.get("label") ?? "");
  const label = rawLabel.trim();
  const validation = validateLabel(rawLabel);

  if (!validation.valid) {
    return json({ ok: false as const, fieldError: validation.message }, { status: 400 });
  }

  await db.shopSetting.upsert({
    where: { shop: session.shop },
    update: { label },
    create: { shop: session.shop, label },
  });

  return json({ ok: true as const, label });
}

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [label, setLabel] = useState(data.label);
  const isSubmitting = navigation.state === "submitting";

  return (
    <Page title="Sample admin page">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                {data.shopName}
              </Text>

              <BlockStack gap="200">
                {data.products.map((product) => (
                  <Text as="p" key={product.id}>
                    {product.title} ({product.status})
                  </Text>
                ))}
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <Form method="post">
              <FormLayout>
                <TextField
                  label="Example label"
                  name="label"
                  autoComplete="off"
                  value={label}
                  onChange={setLabel}
                  maxLength={LABEL_MAX_LENGTH}
                  error={actionData && !actionData.ok ? actionData.fieldError : undefined}
                />
                <Button submit loading={isSubmitting} disabled={isSubmitting}>
                  Save
                </Button>
              </FormLayout>
            </Form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
