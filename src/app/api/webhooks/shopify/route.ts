// /src/app/api/webhooks/shopify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * This handler receives and processes webhooks from Shopify.
 * Specifically, it listens for the 'orders/paid' topic.
 */
export async function POST(req: NextRequest) {
  // 1. Read the raw request body (important for HMAC verification)
  const rawBody = await req.text();
  const hmacHeader = req.headers.get('x-shopify-hmac-sha256');

  // 2. HMAC Signature Verification
  try {
    const hash = crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET!)
      .update(rawBody, 'utf8')
      .digest('base64');

    // Compare the generated hash with the one from the header
    if (hash !== hmacHeader) {
      console.warn('⚠️ Webhook verification failed: HMAC mismatch');
      return new NextResponse('Unauthorized', { status: 401 });
    }
  } catch (error) {
    console.error('Webhook verification error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  // 3. Process the webhook data
  try {
    const orderData = JSON.parse(rawBody);

    // Check if there are any discount codes in the order
    if (!orderData.discount_codes || orderData.discount_codes.length === 0) {
      // No coupon used, so we can ignore this order.
      return NextResponse.json({ message: 'No discount code found.' }, { status: 200 });
    }

    const couponCode = orderData.discount_codes[0].code;

    // 4. Look up the coupon in our database
    const couponMap = await prisma.couponMap.findUnique({
      where: { couponCode },
    });

    if (!couponMap) {
      // This coupon isn't from our platform, so we ignore it.
      return NextResponse.json({ message: 'Coupon not found in our system.' }, { status: 200 });
    }

    // 5. Calculate commission and create a transaction record
    const orderTotal = new Decimal(orderData.subtotal_price);
    const commissionAmount = orderTotal.mul(couponMap.commissionRate);

    await prisma.transaction.create({
      data: {
        orderId: orderData.id.toString(),
        orderTotal: orderTotal,
        commissionAmount: commissionAmount,
        status: 'PENDING', // This transaction is now pending payout
        couponMapId: couponMap.id,
        brandStoreId: couponMap.brandStoreId,
      },
    });

    // 6. Respond quickly with a 200 OK
    // We do all heavy lifting (like payouts) in the background (Phase 4)
    return NextResponse.json({ message: 'Webhook processed successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Error processing webhook', { status: 500 });
  }
}