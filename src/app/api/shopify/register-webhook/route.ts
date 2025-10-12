// The correct location: src/app/api/shopify/register-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
// CORRECTED: Import Session and GraphqlClient directly from the main package
import shopify, { Session, GraphqlClient } from '@shopify/shopify-api';
import { decrypt } from '@/lib/encryption';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId || (session?.user as any).role !== 'BRAND') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brandStore = await prisma.brandStore.findUnique({
      where: { brandId: userId },
    });

    if (!brandStore || !brandStore.accessToken) {
      throw new Error('Shopify store not connected.');
    }

    const accessToken = decrypt(brandStore.accessToken);
    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/shopify`;

    // Create a new, valid Session instance for the client
    const shopifySession = new Session({
        id: `offline_${brandStore.storeUrl}`,
        shop: brandStore.storeUrl,
        state: 'placeholder',
        isOnline: false,
        accessToken: accessToken,
    });

    // CORRECTED: Instantiate GraphqlClient directly, not via shopify.clients
    const client = new GraphqlClient({ session: shopifySession });

    const response: any = await client.query({
      data: {
        query: `mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
          webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
            userErrors { field message }
            webhookSubscription { id }
          }
        }`,
        variables: {
          topic: "ORDERS_PAID",
          webhookSubscription: { callbackUrl: webhookUrl, format: "JSON" }
        }
      }
    });

    if (response.body.data.webhookSubscriptionCreate.userErrors.length > 0) {
      throw new Error(response.body.data.webhookSubscriptionCreate.userErrors[0].message);
    }

    return NextResponse.json({ success: true, message: 'Webhook registered successfully!' });

  } catch (error: any) {
    console.error('Failed to register webhook:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to register webhook.' }, { status: 500 });
  }
}