// src/app/creator/brands/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Brand {
  id: string;
  storeName: string;
  storeUrl: string;
  storeDescription: string;
  platform: string;
  activeCoupons: number;
  hasPendingRequest: boolean;
}

export default function BrandsMarketplace() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/creator/brands');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user && (session.user as any).role !== 'CREATOR') {
      router.push('/');
    }
  }, [session, router]);

  useEffect(() => {
    if (session?.user) {
      fetchBrands();
    }
  }, [session]);

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brands/list');
      const data = await response.json();
      setBrands(data);
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPartnership = async (brandId: string) => {
    if (!confirm('Deseja solicitar parceria com esta marca?')) return;

    try {
      const response = await fetch('/api/coupons/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandStoreId: brandId,
          commissionRate: 0.10, // 10% padrão
        }),
      });

      if (response.ok) {
        alert('✅ Solicitação enviada com sucesso! Aguarde aprovação da marca.');
        fetchBrands(); // Recarregar lista
      } else {
        const error = await response.json();
        alert(`❌ Erro: ${error.message}`);
      }
    } catch (error) {
      alert('❌ Erro ao enviar solicitação.');
    }
  };

  const filteredBrands = brands.filter(brand =>
    brand.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.storeDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h1 style={{ margin: '0 0 10px 0' }}>Marketplace de Marcas</h1>
        <p style={{ color: '#666', margin: 0 }}>
          Descubra marcas parceiras e solicite códigos de cupom personalizados
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '30px' }}>
        <input
          type="text"
          placeholder="Buscar marcas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '5px',
          }}
        />
      </div>

      {/* Brands Grid */}
      {filteredBrands.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <p style={{ fontSize: '48px', margin: '0 0 20px 0' }}>🏪</p>
          <h3 style={{ margin: '0 0 10px 0' }}>
            {searchTerm ? 'Nenhuma marca encontrada' : 'Nenhuma marca disponível'}
          </h3>
          <p style={{ color: '#666', margin: 0 }}>
            {searchTerm ? 'Tente outro termo de busca' : 'Aguarde enquanto marcas se conectam à plataforma'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {filteredBrands.map(brand => (
            <BrandCard
              key={brand.id}
              brand={brand}
              onRequestPartnership={() => handleRequestPartnership(brand.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface BrandCardProps {
  brand: Brand;
  onRequestPartnership: () => void;
}

function BrandCard({ brand, onRequestPartnership }: BrandCardProps) {
  return (
    <div style={{
      backgroundColor: 'white',
      padding: '25px',
      borderRadius: '8px',
      border: '1px solid #dee2e6',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
          marginBottom: '15px'
        }}>
          <h3 style={{ margin: 0, fontSize: '20px' }}>{brand.storeName}</h3>
          <span style={{
            padding: '4px 8px',
            backgroundColor: '#e7f3ff',
            color: '#0066cc',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {brand.platform}
          </span>
        </div>

        <p style={{
          color: '#666',
          fontSize: '14px',
          margin: '0 0 15px 0',
          minHeight: '60px'
        }}>
          {brand.storeDescription || 'Sem descrição disponível'}
        </p>

        <div style={{ marginBottom: '15px' }}>
          <a
            href={`https://${brand.storeUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#5c6ac4',
              textDecoration: 'none',
              fontSize: '14px'
            }}
          >
            🔗 {brand.storeUrl}
          </a>
        </div>

        <div style={{
          display: 'flex',
          gap: '15px',
          paddingTop: '15px',
          borderTop: '1px solid #dee2e6',
          fontSize: '14px',
          color: '#666'
        }}>
          <span>🎫 {brand.activeCoupons} cupons ativos</span>
        </div>
      </div>

      <button
        onClick={onRequestPartnership}
        disabled={brand.hasPendingRequest}
        style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: brand.hasPendingRequest ? '#6c757d' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: brand.hasPendingRequest ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          fontSize: '14px'
        }}
      >
        {brand.hasPendingRequest ? '⏳ Solicitação Pendente' : '🤝 Solicitar Parceria'}
      </button>
    </div>
  );
}