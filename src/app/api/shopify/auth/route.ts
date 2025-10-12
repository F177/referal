// /src/app/api/shopify/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import shopify from '@/lib/shopify';

export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get('shop');

  if (!shop) {
    return new NextResponse('Missing shop parameter', { status: 400 });
  }

  const authUrl = await shopify.auth.begin({
    shop,
    callbackPath: '/api/shopify/callback',
    isOnline: false, // Use offline access token
  });

  // Redirect the user to the Shopify authorization screen
  return NextResponse.redirect(authUrl);
}