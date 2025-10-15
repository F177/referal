// src/app/api/brands/list/route.ts
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
    // Buscar todas as lojas públicas
    const stores = await prisma.brandStore.findMany({
      where: { isPublic: true },
      include: {
        brand: {
          select: {
            name: true,
            email: true,
          },
        },
        coupons: {
          where: {
            creatorId: userId,
            status: {
              in: ['PENDING', 'APPROVED', 'ACTIVE'],
            },
          },
        },
        _count: {
          select: {
            coupons: {
              where: {
                status: {
                  in: ['APPROVED', 'ACTIVE'],
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Formatar resposta
    const brands = stores.map(store => ({
      id: store.id,
      storeName: store.storeName || store.brand.name || store.storeUrl,
      storeUrl: store.storeUrl,
      storeDescription: store.storeDescription || `Loja ${store.platform}`,
      platform: store.platform,
      activeCoupons: store._count.coupons,
      hasPendingRequest: store.coupons.some(c => c.status === 'PENDING'),
    }));

    return NextResponse.json(brands);

  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}