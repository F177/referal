// src/lib/shopify.ts
import { shopifyApi, ApiVersion } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SHOPIFY_SCOPES!.split(','),
  hostName: new URL(process.env.NEXTAUTH_URL!).hostname,
  apiVersion: ApiVersion.October23,
  isEmbeddedApp: false,
});

export default shopify;