// /src/app/actions/shopifyActions.ts
'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import shopify from '@/lib/shopify';
import { decrypt } from '@/lib/encryption';
import { GraphqlQueryError } from '@shopify/shopify-api';

// Helper function to get an authenticated Shopify GraphQL client
async function getShopifyGraphQLClient() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) throw new Error('Unauthorized');

  const brandStore = await prisma.brandStore.findUnique({
    where: { brandId: userId },
  });

  if (!brandStore || !brandStore.accessToken) {
    throw new Error('Shopify store not connected.');
  }

  const accessToken = decrypt(brandStore.accessToken);

  const client = new shopify.clients.Graphql({
    session: {
      id: '', // Not needed for offline token requests
      shop: brandStore.storeUrl,
      state: '',
      isOnline: false,
      accessToken: accessToken,
    },
  });
  return { client };
}

/**
 * Registers the orders/paid webhook on the connected Shopify store.
 */
export async function registerOrderWebhook() {
  try {
    const { client } = await getShopifyGraphQLClient();
    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/shopify`;

    const response: any = await client.query({
      data: {
        query: `mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
          webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
            userErrors {
              field
              message
            }
            webhookSubscription {
              id
            }
          }
        }`,
        variables: {
          topic: "ORDERS_PAID",
          webhookSubscription: {
            callbackUrl: webhookUrl,
            format: "JSON"
          }
        }
      }
    });

    if (response.body.data.webhookSubscriptionCreate.userErrors.length > 0) {
      throw new Error(response.body.data.webhookSubscriptionCreate.userErrors[0].message);
    }

    console.log('Webhook registered successfully:', response.body.data.webhookSubscriptionCreate.webhookSubscription.id);
    return { success: true, message: 'Webhook for paid orders has been registered!' };

  } catch (error) {
    console.error('Failed to register webhook:', error);
    return { success: false, message: 'Failed to register webhook.' };
  }
}