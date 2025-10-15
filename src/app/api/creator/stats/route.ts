// src/app/api/creator/stats/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId || (session?.user as any).role !== 'CREATOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Buscar todos os cupons do creator
    const coupons = await prisma.couponMap.findMany({
      where: { creatorId: userId },
      include: {
        transactions: true,
      },
    });

    // Calcular estatísticas
    let totalSales = new Decimal(0);
    let pendingCommission = new Decimal(0);
    let paidCommission = new Decimal(0);
    let activeCoupons = 0;

    coupons.forEach(coupon => {
      if (coupon.status === 'APPROVED' || coupon.status === 'ACTIVE') {
        activeCoupons++;
      }

      coupon.transactions.forEach(transaction => {
        totalSales = totalSales.add(transaction.orderTotal);

        if (transaction.status === 'PENDING' || transaction.status === 'ELIGIBLE') {
          pendingCommission = pendingCommission.add(transaction.commissionAmount);
        } else if (transaction.status === 'PAID') {
          paidCommission = paidCommission.add(transaction.commissionAmount);
        }
      });
    });

    return NextResponse.json({
      totalSales: parseFloat(totalSales.toString()),
      pendingCommission: parseFloat(pendingCommission.toString()),
      paidCommission: parseFloat(paidCommission.toString()),
      activeCoupons,
    });

  } catch (error) {
    console.error('Error fetching creator stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}