// src/app/api/brand/disconnect-store/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function DELETE() {
  const session = await getServerSession(authOptions);

  // Garante que apenas usuários autenticados e do tipo BRAND possam acessar
  if (!session?.user?.id || session.user.role !== 'BRAND') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    // Verifica se existe uma loja conectada
    const brandStore = await prisma.brandStore.findUnique({
      where: {
        brandId: session.user.id,
      },
    });

    if (!brandStore) {
      return NextResponse.json(
        { error: 'Nenhuma loja encontrada para desconectar' }, 
        { status: 404 }
      );
    }

    // Remove todas as transações relacionadas (opcional, depende da sua lógica de negócio)
    // Você pode querer apenas desativar em vez de deletar
    await prisma.transaction.deleteMany({
      where: {
        brandStoreId: brandStore.id,
      },
    });

    // Remove todos os cupons relacionados
    await prisma.couponMap.deleteMany({
      where: {
        brandStoreId: brandStore.id,
      },
    });

    // Remove a loja
    await prisma.brandStore.delete({
      where: {
        id: brandStore.id,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Loja desconectada com sucesso' 
    });

  } catch (error) {
    console.error("Erro ao desconectar loja:", error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
}