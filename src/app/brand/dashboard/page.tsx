// Example for /src/app/brand/dashboard/page.tsx

export default function BrandDashboard() {
  // You'll likely fetch and display existing stores here...

  return (
    <div>
      <h1>Brand Dashboard</h1>
      <h2>Connect a New Store</h2>
      <form action="/api/shopify/auth" method="get">
        <label htmlFor="shop">Shopify Store URL:</label>
        <input
          type="text"
          name="shop"
          id="shop"
          placeholder="your-store-name.myshopify.com"
          required
        />
        <button type="submit">Connect Shopify Store</button>
      </form>
    </div>
  );
}