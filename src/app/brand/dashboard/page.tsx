// src/app/brand/dashboard/page.tsx
'use client';

import { useSession, signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function BrandDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/brand/dashboard');
    }
  }, [status, router]);

  // Verificar se é BRAND
  useEffect(() => {
    if (session?.user && (session.user as any).role !== 'BRAND') {
      setMessage('❌ Access denied. Only BRAND users can access this page.');
    }
  }, [session]);

  // Mostrar mensagens de sucesso/erro do OAuth
  useEffect(() => {
    if (searchParams.get('success')) {
      setMessage('✅ Store connected successfully!');
    }
    if (searchParams.get('error')) {
      setMessage(`❌ Error: ${searchParams.get('error')}`);
    }
  }, [searchParams]);

  const handleRegisterWebhook = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/shopify/register-webhook', {
        method: 'POST',
      });
      const result = await response.json();
      setMessage(result.message);
    } catch (error) {
      setMessage('❌ Failed to register webhook.');
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading enquanto verifica autenticação
  if (status === 'loading') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  // Mostrar erro se não for BRAND
  if (session?.user && (session.user as any).role !== 'BRAND') {
    return (
      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Access Denied</h1>
        <p>Only BRAND users can access this page.</p>
        <button onClick={() => router.push('/')}>Go Home</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1>Brand Dashboard</h1>
        <div>
          <span style={{ marginRight: '15px' }}>
            Welcome, {session?.user?.name || session?.user?.email}
          </span>
          <button 
            onClick={() => router.push('/api/auth/signout')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          borderRadius: '5px',
          backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
          color: message.includes('✅') ? '#155724' : '#721c24',
        }}>
          {message}
        </div>
      )}

      <div style={{
        border: '1px solid #ccc',
        padding: '30px',
        borderRadius: '8px',
        marginBottom: '20px',
        backgroundColor: '#f8f9fa',
      }}>
        <h2>🔗 Step 1: Connect Your Shopify Store</h2>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          Enter your Shopify store URL to connect it to the platform.
        </p>
        
        <form action="/api/shopify/auth" method="get">
          <input
            type="text"
            name="shop"
            placeholder="your-store.myshopify.com"
            required
            style={{
              padding: '12px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              width: '350px',
              marginRight: '10px',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: '#5c6ac4',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Connect Store
          </button>
        </form>
      </div>

      <div style={{
        border: '1px solid #ccc',
        padding: '30px',
        borderRadius: '8px',
        backgroundColor: '#f8f9fa',
      }}>
        <h2>📊 Step 2: Activate Order Tracking</h2>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          Register a webhook to track sales and calculate commissions.
        </p>
        <button
          onClick={handleRegisterWebhook}
          disabled={loading}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 'bold',
            backgroundColor: loading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '⏳ Registering...' : '🔔 Register Webhook'}
        </button>
      </div>
    </div>
  );
}