// src/app/creator/dashboard/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface DashboardStats {
  totalSales: number;
  pendingCommission: number;
  paidCommission: number;
  activeCoupons: number;
}

export default function CreatorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/creator/dashboard');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user && (session.user as any).role !== 'CREATOR') {
      router.push('/');
    }
  }, [session, router]);

  useEffect(() => {
    if (session?.user) {
      fetchStats();
    }
  }, [session]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/creator/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0 }}>Dashboard do Creator</h1>
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

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginBottom: '40px'
      }}>
        <StatCard
          title="Vendas Totais"
          value={`R$ ${stats?.totalSales.toFixed(2) || '0.00'}`}
          icon="💰"
          color="#28a745"
        />
        <StatCard
          title="Comissão Pendente"
          value={`R$ ${stats?.pendingCommission.toFixed(2) || '0.00'}`}
          icon="⏳"
          color="#ffc107"
        />
        <StatCard
          title="Comissão Paga"
          value={`R$ ${stats?.paidCommission.toFixed(2) || '0.00'}`}
          icon="✅"
          color="#17a2b8"
        />
        <StatCard
          title="Cupons Ativos"
          value={stats?.activeCoupons || 0}
          icon="🎟️"
          color="#6f42c1"
        />
      </div>

      {/* Quick Actions */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px',
        marginBottom: '40px'
      }}>
        <ActionCard
          title="Marketplace de Marcas"
          description="Descubra marcas e solicite parcerias"
          icon="🏪"
          onClick={() => router.push('/creator/brands')}
          buttonText="Ver Marcas"
          buttonColor="#5c6ac4"
        />
        <ActionCard
          title="Meus Cupons"
          description="Gerencie seus códigos de desconto"
          icon="🎫"
          onClick={() => router.push('/creator/coupons')}
          buttonText="Ver Cupons"
          buttonColor="#28a745"
        />
        <ActionCard
          title="Histórico de Vendas"
          description="Acompanhe suas comissões"
          icon="📊"
          onClick={() => router.push('/creator/transactions')}
          buttonText="Ver Histórico"
          buttonColor="#17a2b8"
        />
      </div>

      {/* Recent Activity */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '30px',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h2 style={{ marginTop: 0 }}>Atividade Recente</h2>
        <p style={{ color: '#666' }}>
          Em breve você verá suas vendas mais recentes aqui.
        </p>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div style={{
      backgroundColor: 'white',
      padding: '25px',
      borderRadius: '8px',
      border: '1px solid #dee2e6',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{title}</p>
          <h2 style={{ margin: '10px 0 0 0', color, fontSize: '32px' }}>{value}</h2>
        </div>
        <div style={{ fontSize: '40px' }}>{icon}</div>
      </div>
    </div>
  );
}

interface ActionCardProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
  buttonText: string;
  buttonColor: string;
}

function ActionCard({ title, description, icon, onClick, buttonText, buttonColor }: ActionCardProps) {
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
        <div style={{ fontSize: '40px', marginBottom: '15px' }}>{icon}</div>
        <h3 style={{ margin: '0 0 10px 0' }}>{title}</h3>
        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{description}</p>
      </div>
      <button
        onClick={onClick}
        style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: buttonColor,
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '14px'
        }}
      >
        {buttonText}
      </button>
    </div>
  );
}