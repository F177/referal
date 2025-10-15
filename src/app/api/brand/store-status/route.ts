// src/app/api/brand/store-status/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  // Garante que apenas usuários autenticados e do tipo BRAND possam acessar
  if (!session?.user?.id || session.user.role !== 'BRAND') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const brandStore = await prisma.brandStore.findUnique({
      where: {
        brandId: session.user.id,
      },
      select: {
        storeUrl: true, // Seleciona apenas o campo que precisamos no frontend
      },
    });

    if (!brandStore) {
      return NextResponse.json({ store: null });
    }

    return NextResponse.json({ store: brandStore });
  } catch (error) {
    console.error("Erro ao buscar status da loja:", error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}