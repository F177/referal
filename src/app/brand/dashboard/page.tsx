// src/app/brand/dashboard/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface PendingRequest {
  id: string;
  couponCode: string;
  commissionRate: number;
  discountValue: number;
  creator: {
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function BrandDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/brand/dashboard');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user && (session.user as any).role !== 'BRAND') {
      router.push('/');
    }
  }, [session, router]);

  useEffect(() => {
    if (searchParams.get('success')) {
      setMessage('✅ Loja conectada com sucesso!');
    }
    if (searchParams.get('error')) {
      setMessage(`❌ Erro: ${searchParams.get('error')}`);
    }
  }, [searchParams]);

  useEffect(() => {
    if (session?.user) {
      fetchPendingRequests();
    }
  }, [session]);

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch('/api/coupons/pending');
      const data = await response.json();
      setPendingRequests(data);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  const handleRegisterWebhook = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/shopify/register-webhook', {
        method: 'POST',
      });
      const result = await response.json();
      setMessage(result.message);
    } catch (error) {
      setMessage('❌ Falha ao registrar webhook.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (couponId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/coupons/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponId, action: 'approve' }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setMessage('✅ Cupom aprovado e criado no Shopify!');
        fetchPendingRequests();
      } else {
        setMessage(`❌ Erro: ${result.error}`);
      }
    } catch (error) {
      setMessage('❌ Erro ao aprovar cupom.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (couponId: string) => {
    if (!confirm('Tem certeza que deseja rejeitar?')) return;

    setLoading(true);
    try {
      const response = await fetch('/api/coupons/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponId, action: 'reject' }),
      });

      if (response.ok) {
        setMessage('Solicitação rejeitada.');
        fetchPendingRequests();
      }
    } catch (error) {
      setMessage('❌ Erro ao rejeitar.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Dashboard da Marca</h1>
        <div>
          <span style={{ marginRight: '15px' }}>
            Olá, {session?.user?.name || session?.user?.email}
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
            Sair
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

      {pendingRequests.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2>📬 Solicitações Pendentes ({pendingRequests.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {pendingRequests.map(request => (
              <div
                key={request.id}
                style={{
                  backgroundColor: '#fff3cd',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #ffc107'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 10px 0' }}>{request.creator.name}</h3>
                    <p style={{ margin: '0 0 5px 0', color: '#666' }}>{request.creator.email}</p>
                    <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                      <span>💰 Comissão: <strong>{(request.commissionRate * 100).toFixed(0)}%</strong></span>
                      <span>🎁 Desconto: <strong>{request.discountValue}%</strong></span>
                      <span>🎫 Código: <strong>{request.couponCode}</strong></span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleApprove(request.id)}
                      disabled={loading}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: loading ? '#ccc' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      ✅ Aprovar
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      disabled={loading}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: loading ? '#ccc' : '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      ❌ Rejeitar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{
        border: '1px solid #ccc',
        padding: '30px',
        borderRadius: '8px',
        marginBottom: '20px',
        backgroundColor: '#f8f9fa',
      }}>
        <h2>🔗 Passo 1: Conectar Loja Shopify</h2>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          Digite a URL da sua loja Shopify.
        </p>

        <form action="/api/shopify/auth" method="get">
          <input
            type="text"
            name="shop"
            placeholder="sua-loja.myshopify.com"
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
            Conectar
          </button>
        </form>
      </div>

      <div style={{
        border: '1px solid #ccc',
        padding: '30px',
        borderRadius: '8px',
        backgroundColor: '#f8f9fa',
      }}>
        <h2>📊 Passo 2: Ativar Rastreamento</h2>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          Registre webhook para rastrear vendas.
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
          {loading ? '⏳ Registrando...' : '🔔 Registrar Webhook'}
        </button>
      </div>
    </div>
  );
}