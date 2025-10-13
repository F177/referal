// src/app/api/shopify/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import shopify from '@/lib/shopify';

export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get('shop');

  if (!shop) {
    return new NextResponse('Missing shop parameter', { status: 400 });
  }

  try {
    // Build the authorization URL manually using the correct API
    const authRoute = await shopify.auth.begin({
      shop: shop,
      callbackPath: '/api/shopify/callback',
      isOnline: false,
      // Create a proper request object that the library expects
      rawRequest: req as any,
      rawResponse: new Response() as any,
    });

    // Redirect the user to Shopify's login/authorization screen
    return NextResponse.redirect(authRoute);
  } catch (error) {
    console.error('Shopify auth error:', error);
    
    // If the above doesn't work, construct the URL manually
    const scopes = process.env.SHOPIFY_SCOPES!;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/shopify/callback`;
    const apiKey = process.env.SHOPIFY_API_KEY!;
    
    const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=nonce&grant_options[]=per-user`;
    
    return NextResponse.redirect(authUrl);
  }
}