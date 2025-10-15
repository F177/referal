// src/app/creator/coupons/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Coupon {
  id: string;
  couponCode: string;
  status: string;
  commissionRate: number;
  discountValue: number;
  usageCount: number;
  createdAt: string;
  approvedAt: string | null;
  brandStore: {
    storeName: string;
    storeUrl: string;
    platform: string;
  };
}

export default function CreatorCoupons() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/creator/coupons');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user && (session.user as any).role !== 'CREATOR') {
      router.push('/');
    }
  }, [session, router]);

  useEffect(() => {
    if (session?.user) {
      fetchCoupons();
    }
  }, [session]);

  const fetchCoupons = async () => {
    try {
      const response = await fetch('/api/coupons/list');
      const data = await response.json();
      setCoupons(data);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('✅ Código copiado para a área de transferência!');
  };

  const filteredCoupons = filter === 'ALL' 
    ? coupons 
    : coupons.filter(c => c.status === filter);

  if (status === 'loading' || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={() => router.push('/creator/dashboard')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginBottom: '20px'
          }}
        >
          ← Voltar ao Dashboard
        </button>
        <h1 style={{ margin: '0 0 10px 0' }}>Meus Cupons</h1>
        <p style={{ color: '#666', margin: 0 }}>
          Gerencie seus códigos de desconto e acompanhe o desempenho
        </p>
      </div>

      {/* Filters */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '30px',
        flexWrap: 'wrap'
      }}>
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: '10px 20px',
              backgroundColor: filter === status ? '#5c6ac4' : 'white',
              color: filter === status ? 'white' : '#333',
              border: '1px solid #dee2e6',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: filter === status ? 'bold' : 'normal'
            }}
          >
            {status === 'ALL' ? 'Todos' : 
             status === 'PENDING' ? 'Pendentes' :
             status === 'APPROVED' ? 'Aprovados' : 'Rejeitados'}
          </button>
        ))}
      </div>

      {/* Coupons List */}
      {filteredCoupons.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <p style={{ fontSize: '48px', margin: '0 0 20px 0' }}>🎫</p>
          <h3 style={{ margin: '0 0 10px 0' }}>Nenhum cupom encontrado</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            {filter === 'ALL' 
              ? 'Comece solicitando parcerias com marcas!' 
              : `Nenhum cupom ${filter.toLowerCase()} no momento.`}
          </p>
          <button
            onClick={() => router.push('/creator/brands')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Ver Marcas Disponíveis
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {filteredCoupons.map(coupon => (
            <CouponCard
              key={coupon.id}
              coupon={coupon}
              onCopy={copyToClipboard}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CouponCardProps {
  coupon: Coupon;
  onCopy: (text: string) => void;
}

function CouponCard({ coupon, onCopy }: CouponCardProps) {
  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    PENDING: { bg: '#fff3cd', text: '#856404', label: '⏳ Pendente' },
    APPROVED: { bg: '#d4edda', text: '#155724', label: '✅ Aprovado' },
    REJECTED: { bg: '#f8d7da', text: '#721c24', label: '❌ Rejeitado' },
    ACTIVE: { bg: '#d1ecf1', text: '#0c5460', label: '🔥 Ativo' },
  };

  const status = statusColors[coupon.status] || statusColors.PENDING;

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '25px',
      borderRadius: '8px',
      border: '1px solid #dee2e6',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>{coupon.brandStore.storeName}</h3>
            <span style={{
              padding: '4px 8px',
              backgroundColor: '#e7f3ff',
              color: '#0066cc',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {coupon.brandStore.platform}
            </span>
          </div>
          <a
            href={`https://${coupon.brandStore.storeUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#5c6ac4', textDecoration: 'none', fontSize: '14px' }}
          >
            {coupon.brandStore.storeUrl}
          </a>
        </div>
        <span style={{
          padding: '6px 12px',
          backgroundColor: status.bg,
          color: status.text,
          borderRadius: '5px',
          fontSize: '14px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap'
        }}>
          {status.label}
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '15px',
        paddingTop: '15px',
        borderTop: '1px solid #dee2e6'
      }}>
        <div>
          <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#666' }}>Código do Cupom</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <code style={{
              padding: '8px 12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              fontWeight: 'bold',
              fontSize: '16px'
            }}>
              {coupon.couponCode}
            </code>
            {coupon.status === 'APPROVED' && (
              <button
                onClick={() => onCopy(coupon.couponCode)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#5c6ac4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                📋 Copiar
              </button>
            )}
          </div>
        </div>

        <div>
          <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#666' }}>Taxa de Comissão</p>
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '18px', color: '#28a745' }}>
            {(coupon.commissionRate * 100).toFixed(0)}%
          </p>
        </div>

        <div>
          <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#666' }}>Desconto Oferecido</p>
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '18px' }}>
            {coupon.discountValue}%
          </p>
        </div>

        <div>
          <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#666' }}>Vezes Usado</p>
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '18px' }}>
            {coupon.usageCount}x
          </p>
        </div>
      </div>

      <div style={{ 
        fontSize: '12px', 
        color: '#666',
        paddingTop: '15px',
        borderTop: '1px solid #dee2e6'
      }}>
        Solicitado em: {new Date(coupon.createdAt).toLocaleDateString('pt-BR')}
        {coupon.approvedAt && ` • Aprovado em: ${new Date(coupon.approvedAt).toLocaleDateString('pt-BR')}`}
      </div>
    </div>
  );
}