// /src/lib/shopify.ts
import { shopifyApi, ApiVersion, SessionStorage, FileSessionStorage } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';
import path from 'path';

// A temporary storage location for Shopify sessions during the OAuth process
const sessionStorage = new FileSessionStorage(path.join(process.cwd(), 'tmp', 'shopify_sessions'));

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SHOPIFY_SCOPES!.split(','),
  hostName: new URL(process.env.NEXTAUTH_URL!).hostname,
  apiVersion: ApiVersion.October23,
  isEmbeddedApp: false,
  // Add the session storage to the configuration
  sessionStorage: sessionStorage,
});

export default shopify;