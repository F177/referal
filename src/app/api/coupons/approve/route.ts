// src/app/api/coupons/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import shopify from '@/lib/shopify';
import { decrypt } from '@/lib/encryption';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId || (session?.user as any).role !== 'BRAND') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { couponId, action } = body;

    if (!couponId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Buscar cupom e verificar permissões
    const coupon = await prisma.couponMap.findUnique({
      where: { id: couponId },
      include: {
        brandStore: true,
        creator: true,
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    if (coupon.brandStore.brandId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (coupon.status !== 'PENDING') {
      return NextResponse.json({ error: 'Coupon already processed' }, { status: 400 });
    }

    // Rejeitar
    if (action === 'reject') {
      await prisma.couponMap.update({
        where: { id: couponId },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
        },
      });

      // Notificar creator
      await prisma.notification.create({
        data: {
          userId: coupon.creatorId,
          type: 'COUPON_REJECTED',
          title: 'Solicitação Rejeitada',
          message: `Sua solicitação de cupom para ${coupon.brandStore.storeName || coupon.brandStore.storeUrl} foi rejeitada.`,
        },
      });

      return NextResponse.json({ success: true, message: 'Coupon rejected' });
    }

    // Aprovar e criar no Shopify
    if (action === 'approve') {
      const accessToken = decrypt(coupon.brandStore.accessToken);

      // Criar sessão do Shopify
      const sessionData = shopify.session.customAppSession(coupon.brandStore.storeUrl);
      sessionData.accessToken = accessToken;

      const client = new shopify.clients.Graphql({ session: sessionData });

      // Criar Price Rule no Shopify
      const priceRuleResponse: any = await client.request(
        `mutation priceRuleCreate($priceRule: PriceRuleInput!) {
          priceRuleCreate(priceRule: $priceRule) {
            priceRule {
              id
            }
            userErrors {
              field
              message
            }
          }
        }`,
        {
          variables: {
            priceRule: {
              title: `Cupom ${coupon.creator.name || coupon.creator.email} - ${coupon.couponCode}`,
              valueType: 'PERCENTAGE',
              value: `-${coupon.discountValue}`,
              customerSelection: 'ALL',
              targetType: 'LINE_ITEM',
              targetSelection: 'ALL',
              allocationMethod: 'ACROSS',
              startsAt: new Date().toISOString(),
            },
          },
        }
      );

      const priceRuleData = priceRuleResponse.data?.priceRuleCreate;

      if (priceRuleData?.userErrors?.length > 0) {
        throw new Error(priceRuleData.userErrors[0].message);
      }

      const priceRuleId = priceRuleData.priceRule.id;

      // Criar Discount Code no Shopify
      const discountResponse: any = await client.request(
        `mutation priceRuleDiscountCodeCreate($priceRuleId: ID!, $code: String!) {
          priceRuleDiscountCodeCreate(
            priceRuleId: $priceRuleId
            code: $code
          ) {
            priceRuleDiscountCode {
              id
              code
            }
            userErrors {
              field
              message
            }
          }
        }`,
        {
          variables: {
            priceRuleId,
            code: coupon.couponCode,
          },
        }
      );

      const discountData = discountResponse.data?.priceRuleDiscountCodeCreate;

      if (discountData?.userErrors?.length > 0) {
        throw new Error(discountData.userErrors[0].message);
      }

      // Atualizar cupom no banco
      await prisma.couponMap.update({
        where: { id: couponId },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          shopifyPriceRuleId: priceRuleId,
          shopifyDiscountId: discountData.priceRuleDiscountCode.id,
        },
      });

      // Notificar creator
      await prisma.notification.create({
        data: {
          userId: coupon.creatorId,
          type: 'COUPON_APPROVED',
          title: 'Cupom Aprovado! 🎉',
          message: `Seu cupom ${coupon.couponCode} foi aprovado e está ativo! Comece a divulgar.`,
          metadata: {
            couponCode: coupon.couponCode,
            storeUrl: coupon.brandStore.storeUrl,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Coupon approved and created in Shopify!',
        couponCode: coupon.couponCode,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Error processing coupon:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}