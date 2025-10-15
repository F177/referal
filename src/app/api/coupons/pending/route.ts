// src/app/api/coupons/pending/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId || (session?.user as any).role !== 'BRAND') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Buscar a loja do brand
    const brandStore = await prisma.brandStore.findUnique({
      where: { brandId: userId },
    });

    if (!brandStore) {
      return NextResponse.json([]);
    }

    // Buscar cupons pendentes para esta loja
    const pendingCoupons = await prisma.couponMap.findMany({
      where: {
        brandStoreId: brandStore.id,
        status: 'PENDING',
      },
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const formatted = pendingCoupons.map(coupon => ({
      id: coupon.id,
      couponCode: coupon.couponCode,
      commissionRate: parseFloat(coupon.commissionRate.toString()),
      discountValue: parseFloat(coupon.discountValue.toString()),
      creator: coupon.creator,
      createdAt: coupon.createdAt.toISOString(),
    }));

    return NextResponse.json(formatted);

  } catch (error) {
    console.error('Error fetching pending requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}