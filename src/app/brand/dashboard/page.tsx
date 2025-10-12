// /src/app/brand/dashboard/page.tsx
import { registerOrderWebhook } from "@/app/actions/shopifyActions";

export default function BrandDashboard() {

  return (
    <div style={{ padding: '20px' }}>
      <h1>Brand Dashboard</h1>

      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
        <h2>Step 1: Connect Your Store</h2>
        {/* The form from Phase 2 to connect the store */}
        <form action="/api/shopify/auth" method="get">
          <label htmlFor="shop">Shopify Store URL:&nbsp;</label>
          <input
            type="text"
            name="shop"
            id="shop"
            placeholder="your-store-name.myshopify.com"
            required
          />
          <button type="submit" style={{ marginLeft: '10px' }}>Connect Shopify Store</button>
        </form>
      </div>

      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
        <h2>Step 2: Activate Order Tracking</h2>
        <p>Click the button below to allow our app to track sales and calculate commissions.</p>
        {/* This form calls our new Server Action */}
        <form action={registerOrderWebhook}>
          <button type="submit">Register Order Webhook</button>
        </form>
      </div>

    </div>
  );
}