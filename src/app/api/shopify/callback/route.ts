// src/app/api/shopify/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId || (session?.user as any).role !== 'BRAND') {
    return new NextResponse('Unauthorized: Login as BRAND first', { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');
  const shop = searchParams.get('shop');
  const hmac = searchParams.get('hmac');
  const state = searchParams.get('state');

  if (!code || !shop || !hmac) {
    return new NextResponse('Missing parameters', { status: 400 });
  }

  // 1. Validar HMAC
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (key !== 'hmac') params[key] = value;
  });

  const message = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  const generatedHash = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET!)
    .update(message)
    .digest('hex');

  if (generatedHash !== hmac) {
    return new NextResponse('HMAC validation failed', { status: 403 });
  }

  // 2. Trocar code por access_token
  try {
    const tokenUrl = `https://${shop}/admin/oauth/access_token`;
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY!,
        client_secret: process.env.SHOPIFY_API_SECRET!,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const { access_token } = await tokenResponse.json();

    // 3. Salvar no banco de dados
    const encryptedToken = encrypt(access_token);

    await prisma.brandStore.upsert({
      where: { brandId: userId },
      update: {
        storeUrl: shop,
        accessToken: encryptedToken,
      },
      create: {
        brandId: userId,
        platform: 'SHOPIFY',
        storeUrl: shop,
        accessToken: encryptedToken,
        webhookSecret: '',
      },
    });

    // 4. Redirecionar para o dashboard
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/brand/dashboard?success=true`);

  } catch (error: any) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/brand/dashboard?error=${encodeURIComponent(error.message)}`
    );
  }
}