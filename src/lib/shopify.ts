// src/lib/shopify.ts
import { shopifyApi, ApiVersion } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SHOPIFY_SCOPES!.split(','),
  hostName: new URL(process.env.NEXTAUTH_URL!).hostname,
  hostScheme: 'https',
  apiVersion: ApiVersion.October25,
  isEmbeddedApp: false, // ← IMPORTANTE! Seu app NÃO é embedado
  isCustomStoreApp: false,
});

export default shopify;