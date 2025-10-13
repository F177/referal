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
    // This is the key change. We create a mock response object that the
    // Shopify library's node adapter can work with.
    const mockResponse: any = {
      setHeader: (key: string, value: any) => {
        // In a real Node.js environment, this would set headers.
        // For our purposes in the Next.js App Router, we can ignore this
        // as the library only uses it to set cookies, which we handle manually.
      },
      getHeaders: () => ({}),
      end: () => {},
    };

    const callback = await shopify.auth.callback({
      rawRequest: req as any,
      rawResponse: mockResponse,
    });

    const shopifySession = callback.session;
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