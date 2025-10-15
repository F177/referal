// src/app/api/coupons/request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId || (session?.user as any).role !== 'CREATOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { brandStoreId, commissionRate, discountValue } = body;

    if (!brandStoreId) {
      return NextResponse.json({ error: 'Brand store ID is required' }, { status: 400 });
    }

    // Verificar se já existe solicitação pendente ou aprovada
    const existingCoupon = await prisma.couponMap.findFirst({
      where: {
        creatorId: userId,
        brandStoreId,
        status: {
          in: ['PENDING', 'APPROVED', 'ACTIVE'],
        },
      },
    });

    if (existingCoupon) {
      return NextResponse.json(
        { error: 'Você já tem uma solicitação ativa para esta marca' },
        { status: 400 }
      );
    }

    // Buscar informações do creator e da loja
    const creator = await prisma.user.findUnique({
      where: { id: userId },
    });

    const brandStore = await prisma.brandStore.findUnique({
      where: { id: brandStoreId },
      include: { brand: true },
    });

    if (!brandStore) {
      return NextResponse.json({ error: 'Brand store not found' }, { status: 404 });
    }

    // Gerar código de cupom único
    const couponCode = generateCouponCode(creator?.name || creator?.email || 'CREATOR');

    // Criar solicitação de cupom
    const coupon = await prisma.couponMap.create({
      data: {
        couponCode,
        commissionRate: new Decimal(commissionRate || 0.10),
        discountValue: new Decimal(discountValue || 10),
        status: 'PENDING',
        creatorId: userId,
        brandStoreId,
      },
    });

    // Criar notificação para a marca
    await prisma.notification.create({
      data: {
        userId: brandStore.brandId,
        type: 'NEW_REQUEST',
        title: 'Nova Solicitação de Cupom',
        message: `${creator?.name || creator?.email} solicitou um cupom com ${commissionRate * 100}% de comissão.`,
        metadata: {
          couponId: coupon.id,
          creatorName: creator?.name,
          creatorEmail: creator?.email,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Solicitação enviada com sucesso!',
      coupon,
    });

  } catch (error: any) {
    console.error('Error requesting coupon:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Função auxiliar para gerar código de cupom único
function generateCouponCode(name: string): string {
  const cleanName = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 8);
  
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `${cleanName}${randomPart}`;
}