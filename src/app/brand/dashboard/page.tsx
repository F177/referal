// src/app/brand/dashboard/page.tsx
'use client';

export default function BrandDashboard() {

  // This function now safely calls our new API endpoint
  const handleRegisterWebhook = async () => {
    const response = await fetch('/api/shopify/register-webhook', {
      method: 'POST',
    });
    const result = await response.json();
    alert(result.message); // Show the result to the user
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Brand Dashboard</h1>

      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
        <h2>Step 1: Connect Your Store</h2>
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
        {/* This form now triggers our client-side fetch function */}
        <form action={handleRegisterWebhook}>
          <button type="submit">Register Order Webhook</button>
        </form>
      </div>
    </div>
  );
}