// src/app/api/shopify/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import shopify from '@/lib/shopify';
import prisma from '@/lib/prisma';
import { encrypt } from '@/lib/encryption'; // We will create this file next

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  // Make sure the user is a BRAND before proceeding
  if (!session?.user || (session.user as any).role !== 'BRAND') {
    // Redirect to login if not authenticated or not a brand
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    const callback = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: new NextResponse(),
    });

    const { accessToken, scope } = callback.session;
    const shop = callback.session.shop;

    if (!accessToken) {
      throw new Error('Could not retrieve access token.');
    }

    // Encrypt the token before saving
    const encryptedToken = encrypt(accessToken);

    // Save or update the store details in your database
    await prisma.brandStore.upsert({
      where: { brandId: (session.user as any).id },
      update: {
        platform: 'SHOPIFY',
        storeUrl: shop,
        accessToken: encryptedToken,
      },
      create: {
        brandId: (session.user as any).id,
        platform: 'SHOPIFY',
        storeUrl: shop,
        accessToken: encryptedToken,
        webhookSecret: '', // This is a placeholder for now
      },
    });

    // Redirect user to their dashboard on success
    return NextResponse.redirect(new URL('/brand/dashboard', req.url));

  } catch (error: any) {
    console.error('--- Shopify callback error ---', error.message);
    // Redirect with an error message on failure
    return NextResponse.redirect(new URL('/brand/dashboard?error=auth_failed', req.url));
  }
}