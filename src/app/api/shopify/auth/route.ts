// src/app/api/shopify/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import shopify from '@/lib/shopify';

export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get('shop');

  if (!shop) {
    return new NextResponse('Missing shop parameter', { status: 400 });
  }

  // This function from the Shopify API library generates the unique
  // authorization URL for the user's specific store.
  const authUrl = await shopify.auth.begin({
    shop,
    callbackPath: '/api/shopify/callback',
    isOnline: false, // Use 'offline' tokens for long-term access
    rawRequest: req,
  });

  // Redirect the user to Shopify's login/authorization screen.
  return NextResponse.redirect(authUrl);
}