// src/app/brand/dashboard/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

// Componente de Spinner para feedback de carregamento
const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// Componente principal do Dashboard
export default function BrandDashboard() {
  const { data: session, status } = useSession();
  const [shopName, setShopName] = useState('');
  const [store, setStore] = useState<{ storeUrl: string } | null>(null);
  const [isLoadingStore, setIsLoadingStore] = useState(true);
  const [isRegisteringWebhook, setIsRegisteringWebhook] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Efeito para buscar o status da loja do usuário logado
  useEffect(() => {
    const fetchStoreStatus = async () => {
      if (status === 'authenticated' && session?.user?.role === 'BRAND') {
        try {
          // Vamos criar essa API route a seguir
          const response = await fetch('/api/brand/store-status');
          if (response.ok) {
            const data = await response.json();
            setStore(data.store);
          }
        } catch (error) {
          console.error("Failed to fetch store status:", error);
          setNotification({ type: 'error', message: 'Não foi possível verificar o status da sua loja.' });
        } finally {
          setIsLoadingStore(false);
        }
      }
      if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'BRAND')) {
          setIsLoadingStore(false);
      }
    };
    
    fetchStoreStatus();
  }, [session, status]);

  // Função para lidar com a conexão da loja Shopify
  const handleConnectShopify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName) {
      setNotification({ type: 'error', message: 'Por favor, insira o nome da sua loja Shopify.' });
      return;
    }
    const shopDomain = `${shopName}.myshopify.com`;
    // Redireciona para a rota de autenticação da Shopify
    window.location.href = `/api/shopify/auth?shop=${shopDomain}`;
  };

  // Função para registrar o webhook
  const handleRegisterWebhook = async () => {
    setIsRegisteringWebhook(true);
    setNotification(null);
    try {
      const response = await fetch('/api/shopify/register-webhook', { method: 'POST' });
      const result = await response.json();
      if (response.ok && result.success) {
        setNotification({ type: 'success', message: 'Webhook de pedidos registrado com sucesso!' });
      } else {
        throw new Error(result.message || 'Falha ao registrar o webhook.');
      }
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message });
    } finally {
      setIsRegisteringWebhook(false);
    }
  };

  // Renderiza estado de carregamento da sessão
  if (status === 'loading' || isLoadingStore) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
        <span className="ml-3 text-gray-600">Carregando seu dashboard...</span>
      </div>
    );
  }
  
  // Renderiza se o usuário não for uma MARCA
  if (status !== 'authenticated' || session.user.role !== 'BRAND') {
      return (
        <div className="flex items-center justify-center min-h-screen text-center">
            <div>
                <h1 className="text-2xl font-bold">Acesso Negado</h1>
                <p className="text-gray-600">Você precisa estar logado como uma Marca para acessar esta página.</p>
            </div>
        </div>
      )
  }

  // Renderização principal do dashboard
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="pb-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard da Marca</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Gerencie a integração com sua loja e acompanhe suas comissões.</p>
        </header>

        <main className="mt-8">
          {notification && (
            <div className={`p-4 mb-6 rounded-lg text-sm ${notification.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
              {notification.message}
            </div>
          )}

          {store ? (
            // Card para loja conectada
            <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Integração com Shopify</h2>
              <div className="flex items-center gap-3 mt-4 text-green-600 dark:text-green-400">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <p className="font-medium">Sua loja <span className="font-bold">{store.storeUrl}</span> está conectada!</p>
              </div>
              <div className="mt-6 pt-6 border-t dark:border-gray-700">
                <h3 className="font-semibold">Próximo passo</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Para começar a rastrear as vendas dos seus creators, você precisa registrar nosso webhook. Isso nos permitirá receber notificações de pedidos pagos que usam os cupons de comissão.</p>
                <button 
                  onClick={handleRegisterWebhook}
                  disabled={isRegisteringWebhook}
                  className="inline-flex items-center justify-center mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 disabled:bg-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800"
                >
                  {isRegisteringWebhook ? <><Spinner /> Registrando...</> : 'Registrar Webhook de Pedidos'}
                </button>
              </div>
            </div>
          ) : (
            // Card para conectar a loja
            <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Conecte sua loja Shopify</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Para começar, conecte sua loja Shopify à nossa plataforma. Isso nos permitirá criar cupons de desconto e rastrear as vendas para comissionar seus creators.</p>
              <form onSubmit={handleConnectShopify} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="shopName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Nome da sua loja Shopify</label>
                  <div className="flex items-center">
                    <input
                      id="shopName"
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                      placeholder="exemplo-loja"
                      className="flex-grow px-3 py-2 text-gray-900 bg-gray-50 border border-gray-300 rounded-l-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                    <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-l-0 border-gray-300 rounded-r-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">.myshopify.com</span>
                  </div>
                </div>
                <button type="submit" className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300 dark:bg-green-500 dark:hover:bg-green-600 dark:focus:ring-green-800">
                  Conectar com Shopify
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}