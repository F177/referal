// /src/lib/shopify.ts
import { shopifyApi, LATEST_API_VERSION, Session } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SHOPIFY_SCOPES!.split(','),
  hostName: new URL(process.env.NEXTAUTH_URL!).hostname,
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: false,
});

export default shopify;