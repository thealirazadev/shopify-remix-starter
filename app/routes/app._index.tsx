import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useActionData, useFetcher, useLoaderData, useNavigation } from "@remix-run/react";
import {
  Banner,
  BlockStack,
  Button,
  Card,
  EmptyState,
  FormLayout,
  Layout,
  Page,
  Text,
  TextField,
} from "@shopify/polaris";
import { useState } from "react";

import db from "~/db.server";
import { apiError, newRequestId } from "~/lib/errors";
import { logger } from "~/lib/logger.server";
import type { UpdateProductTitleResponse } from "~/lib/product-title";
import {
  PRODUCT_TITLE_MAX_LENGTH,
  parseProductTitleInput,
  productTitleOutcome,
} from "~/lib/product-title";
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

// The Admin write the sample page demonstrates. Needs the write_products scope.
const UPDATE_PRODUCT_TITLE_MUTATION = `#graphql
  mutation UpdateProductTitle($product: ProductUpdateInput!) {
    productUpdate(product: $product) {
      product {
        id
        title
      }
      userErrors {
        field
        message
      }
    }
  }
`;

type AdminContext = Awaited<ReturnType<typeof authenticate.admin>>;

interface ShopAndProductsResponse {
  data?: {
    shop: { name: string; myshopifyDomain: string };
    products: { edges: { node: { id: string; title: string; status: string } }[] };
  };
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const requestId = newRequestId();

  try {
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
      error: null as null | { code: string; message: string; requestId: string },
    });
  } catch (error) {
    logger.error("failed to load shop and products", {
      shop: session.shop,
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });

    return json({
      shopName: "",
      products: [],
      label: "",
      error: apiError("UPSTREAM_ERROR", "Could not load shop data. Try again.", requestId).error,
    });
  }
}

async function renameProduct(context: AdminContext, formData: FormData, requestId: string) {
  const { admin, session } = context;
  const input = parseProductTitleInput(
    String(formData.get("productId") ?? ""),
    String(formData.get("title") ?? ""),
  );

  if (!input.ok) {
    return json(
      { ok: false as const, intent: "renameProduct" as const, fieldError: input.message },
      { status: 400 },
    );
  }

  try {
    const response = await admin.graphql(UPDATE_PRODUCT_TITLE_MUTATION, {
      variables: { product: { id: input.id, title: input.title } },
    });
    const body = (await response.json()) as UpdateProductTitleResponse;
    const outcome = productTitleOutcome(body);

    if (!outcome.ok) {
      logger.error("product title update rejected", {
        shop: session.shop,
        requestId,
        code: outcome.code,
        userErrors: body.data?.productUpdate?.userErrors ?? [],
        errors: body.errors ?? [],
      });

      return json(
        { ok: false as const, intent: "renameProduct" as const, fieldError: outcome.message },
        { status: outcome.code === "INVALID_INPUT" ? 400 : 502 },
      );
    }

    return json({ ok: true as const, intent: "renameProduct" as const, product: outcome.product });
  } catch (error) {
    logger.error("failed to update product title", {
      shop: session.shop,
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });

    return json(
      {
        ok: false as const,
        intent: "renameProduct" as const,
        fieldError: "Could not update the product. Try again.",
      },
      { status: 502 },
    );
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const context = await authenticate.admin(request);
  const { session } = context;
  const requestId = newRequestId();
  const formData = await request.formData();

  if (formData.get("intent") === "renameProduct") {
    return renameProduct(context, formData, requestId);
  }

  const rawLabel = String(formData.get("label") ?? "");
  const label = rawLabel.trim();
  const validation = validateLabel(rawLabel);

  if (!validation.valid) {
    return json(
      { ok: false as const, intent: "saveLabel" as const, fieldError: validation.message },
      { status: 400 },
    );
  }

  try {
    await db.shopSetting.upsert({
      where: { shop: session.shop },
      update: { label },
      create: { shop: session.shop, label },
    });

    return json({ ok: true as const, intent: "saveLabel" as const, label });
  } catch (error) {
    logger.error("failed to save shop setting", {
      shop: session.shop,
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });

    return json(
      {
        ok: false as const,
        intent: "saveLabel" as const,
        fieldError: "Could not save the label. Try again.",
      },
      { status: 500 },
    );
  }
}

/**
 * One product's title with its own fetcher, so saving a title neither touches
 * the label form's state nor navigates. Remix revalidates the loader after the
 * write, so the list shows what Shopify stored.
 */
function ProductTitleForm({ product }: { product: { id: string; title: string; status: string } }) {
  const fetcher = useFetcher<typeof action>();
  const [title, setTitle] = useState(product.title);
  const response = fetcher.data;
  const result = response?.intent === "renameProduct" ? response : null;
  const saving = fetcher.state !== "idle";

  return (
    <fetcher.Form method="post">
      <input type="hidden" name="intent" value="renameProduct" />
      <input type="hidden" name="productId" value={product.id} />
      <FormLayout>
        <TextField
          label={`Product title (${product.status})`}
          name="title"
          autoComplete="off"
          value={title}
          onChange={setTitle}
          maxLength={PRODUCT_TITLE_MAX_LENGTH}
          error={result && !result.ok ? result.fieldError : undefined}
          helpText={result && result.ok ? "Saved to Shopify." : undefined}
        />
        <Button submit loading={saving} disabled={saving}>
          Save title
        </Button>
      </FormLayout>
    </fetcher.Form>
  );
}

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const rawActionData = useActionData<typeof action>();
  const actionData = rawActionData?.intent === "saveLabel" ? rawActionData : undefined;
  const navigation = useNavigation();
  const [label, setLabel] = useState(data.label);
  const isSubmitting = navigation.state === "submitting";

  return (
    <Page title="Sample admin page">
      <Layout>
        <Layout.Section>
          {data.error ? (
            <Banner tone="critical" title="Could not load shop data">
              <p>{data.error.message}</p>
            </Banner>
          ) : null}

          {actionData && !actionData.ok ? (
            <Banner tone="critical" title="Could not save label">
              <p>{actionData.fieldError}</p>
            </Banner>
          ) : null}

          {actionData && actionData.ok ? (
            <Banner tone="success" title="Label saved">
              <p>Saved &quot;{actionData.label}&quot;.</p>
            </Banner>
          ) : null}

          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                {data.shopName || "Shop"}
              </Text>

              {data.products.length === 0 ? (
                <EmptyState
                  heading="No products yet"
                  image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
                >
                  <p>Products created in this shop will show up here.</p>
                </EmptyState>
              ) : (
                <BlockStack gap="400">
                  {data.products.map((product) => (
                    <ProductTitleForm key={product.id} product={product} />
                  ))}
                </BlockStack>
              )}
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
