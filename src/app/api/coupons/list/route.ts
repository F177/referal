// src/app/api/coupons/list/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId || (session?.user as any).role !== 'CREATOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const coupons = await prisma.couponMap.findMany({
      where: { creatorId: userId },
      include: {
        brandStore: {
          select: {
            storeName: true,
            storeUrl: true,
            platform: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formatted = coupons.map(coupon => ({
      id: coupon.id,
      couponCode: coupon.couponCode,
      status: coupon.status,
      commissionRate: parseFloat(coupon.commissionRate.toString()),
      discountValue: parseFloat(coupon.discountValue.toString()),
      usageCount: coupon.usageCount,
      createdAt: coupon.createdAt.toISOString(),
      approvedAt: coupon.approvedAt?.toISOString() || null,
      brandStore: coupon.brandStore,
    }));

    return NextResponse.json(formatted);

  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}