// src/app/api/shopify/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get('shop');

  if (!shop) {
    return new NextResponse('Missing shop parameter', { status: 400 });
  }

  // Validar formato
  const shopDomain = shop.replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!shopDomain.endsWith('.myshopify.com')) {
    return new NextResponse('Invalid shop domain', { status: 400 });
  }

  const state = crypto.randomUUID();
  const scopes = process.env.SHOPIFY_SCOPES!;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/shopify/callback`;
  const apiKey = process.env.SHOPIFY_API_KEY!;

  // IMPORTANTE: Salvar o state em algum lugar (sessão, cache, DB)
  // Por enquanto, vamos simplificar e usar um state fixo
  // Em produção, use Redis ou DB para validar no callback

  const authUrl = `https://${shopDomain}/admin/oauth/authorize?` +
    new URLSearchParams({
      client_id: apiKey,
      scope: scopes,
      redirect_uri: redirectUri,
      state: state,
    }).toString();

  return NextResponse.redirect(authUrl);
}