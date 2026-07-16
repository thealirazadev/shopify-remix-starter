import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { BlockStack, Card, Layout, Page, Text } from "@shopify/polaris";

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
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(SHOP_AND_PRODUCTS_QUERY, { variables: { first: 5 } });
  const body = (await response.json()) as ShopAndProductsResponse;

  if (!body.data) {
    throw new Error("Admin GraphQL returned no data");
  }

  return json({
    shopName: body.data.shop.name,
    products: body.data.products.edges.map((edge) => edge.node),
  });
}

export default function Index() {
  const data = useLoaderData<typeof loader>();

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
      </Layout>
    </Page>
  );
}
