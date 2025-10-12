// /src/lib/shopify.ts
import { shopifyApi, ApiVersion } from '@shopify/shopify-api'; // Changed import
import '@shopify/shopify-api/adapters/node';

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SHOPIFY_SCOPES!.split(','),
  hostName: new URL(process.env.NEXTAUTH_URL!).hostname,
  // Use the ApiVersion enum instead of LATEST_API_VERSION
  apiVersion: ApiVersion.October23, // Or another recent, stable version
  isEmbeddedApp: false,
});

export default shopify;