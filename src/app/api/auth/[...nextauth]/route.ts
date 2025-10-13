// src/app/api/shopify/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import shopify from '@/lib/shopify';

export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get('shop');

  if (!shop) {
    return new NextResponse('Missing shop parameter', { status: 400 });
  }

  // The shopify.auth.begin() call is incompatible with the App Router in this library version.
  // We will construct the URL manually, which is more reliable.
  const scopes = process.env.SHOPIFY_SCOPES!;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/shopify/callback`;
  const apiKey = process.env.SHOPIFY_API_KEY!;
  
  // In production, this should be a unique, securely generated nonce that you verify in the callback.
  const state = 'nonce'; 

  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&grant_options[]=per-user`;
  
  return NextResponse.redirect(authUrl);
}