// src/app/api/shopify/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import shopify from '@/lib/shopify';
import { encrypt } from '@/lib/encryption';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId || (session?.user as any).role !== 'BRAND') {
    return new NextResponse('Unauthorized: You must be logged in as a BRAND.', { status: 401 });
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    // The validateHmac utility expects an object version of the search params.
    const query = Object.fromEntries(searchParams.entries());

    // 1. Validate that the request came from Shopify
    const isValid = await shopify.utils.validateHmac(query);
    if (!isValid) {
      return new NextResponse('Authentication failed: Invalid HMAC.', { status: 400 });
    }

    // 2. Exchange the authorization code for an access token
    // We use tokenExchange, which does not interact with the Response object.
    const { session: shopifySession } = await shopify.auth.tokenExchange({
      shop: query.shop,
      code: query.code,
    });

    const { shop, accessToken } = shopifySession;

    if (!accessToken) {
        return new NextResponse('Could not retrieve access token from Shopify.', { status: 500 });
    }

    const encryptedAccessToken = encrypt(accessToken);

    await prisma.brandStore.upsert({
      where: { brandId: userId },
      update: {
        storeUrl: shop,
        accessToken: encryptedAccessToken,
      },
      create: {
        brandId: userId,
        storeUrl: shop,
        accessToken: encryptedAccessToken,
        platform: 'SHOPIFY',
        webhookSecret: '', // Placeholder
      },
    });

    const redirectUrl = new URL('/brand/dashboard', req.url);
    return NextResponse.redirect(redirectUrl.toString());

  } catch (error: any) {
    console.error('Shopify callback error:', error);
    return new NextResponse(`Authentication failed: ${error.message}. Please try connecting your store again.`, { status: 500 });
  }
}