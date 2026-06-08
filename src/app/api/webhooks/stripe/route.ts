import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createOrderAction } from "@/lib/actions";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature") || "";

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-12-18.acacia" as any,
    });

    let event: Stripe.Event;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
      } catch (err: any) {
        console.error(`[Stripe Webhook] Signature verification failed:`, err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
      }
    } else {
      // Robust fallback for development & mock validation modes
      console.warn("[Stripe Webhook] STRIPE_WEBHOOK_SECRET is missing. Bypassing signature verification.");
      try {
        event = JSON.parse(body);
      } catch (err: any) {
        console.error(`[Stripe Webhook] JSON parsing failure:`, err.message);
        return NextResponse.json({ error: `Parsing Error: ${err.message}` }, { status: 400 });
      }
    }

    console.log(`[Stripe Webhook] Processing event type: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;

      if (!metadata) {
        console.error("[Stripe Webhook] Aborted: No session metadata found.");
        return NextResponse.json({ error: "Missing session metadata" }, { status: 400 });
      }

      try {
        const userId = metadata.userId;
        const couponCode = metadata.couponCode || null;
        const couponDiscountPercent = Number(metadata.couponDiscountPercent || 0);
        const address = JSON.parse(metadata.address);
        const cartItems = JSON.parse(metadata.cartItems);

        console.log(`[Stripe Webhook] Finalizing order for user: ${userId}`);

        // Commit order transaction to the database
        const orderRes = await createOrderAction({
          userId,
          street: address.street,
          city: address.city,
          state: address.state,
          zip: address.zip,
          country: address.country,
          total: session.amount_total ? session.amount_total / 100 : 0,
          couponCode,
          couponDiscountPercent,
          items: cartItems,
          paymentIntentId: session.payment_intent as string || session.id, // Store session.id as fallback if payment_intent is empty
        });

        if (orderRes.success) {
          console.log(`[Stripe Webhook] Order successfully committed: ${orderRes.orderId}`);
        } else {
          console.error(`[Stripe Webhook] Order creation failure: ${orderRes.error}`);
          return NextResponse.json({ error: orderRes.error || "Order creation failed" }, { status: 500 });
        }
      } catch (err: any) {
        console.error(`[Stripe Webhook] Metadata extraction/processing error:`, err);
        return NextResponse.json({ error: `Processing Error: ${err.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[Stripe Webhook] Route handler crash error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
