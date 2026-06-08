import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const origin = req.headers.get("origin") || "http://localhost:3001";

    // 1. Mock Gateway Mode Fallback Check
    if (
      !process.env.STRIPE_SECRET_KEY ||
      process.env.STRIPE_SECRET_KEY.startsWith("sk_test_mock")
    ) {
      console.warn("Stripe is running in mock mode. Generating mock session ID.");
      const mockSessionId = `mock_session_${Date.now()}`;
      
      // We will also return the payload details in mock success search parameters so it can be committed
      const portalUrl = new URL(`${origin}/checkout/payment-portal`);
      portalUrl.searchParams.set("session_id", mockSessionId);
      portalUrl.searchParams.set("userId", body.userId);
      portalUrl.searchParams.set("street", body.address.street);
      portalUrl.searchParams.set("city", body.address.city);
      portalUrl.searchParams.set("state", body.address.state || "WA");
      portalUrl.searchParams.set("zip", body.address.zip);
      portalUrl.searchParams.set("country", body.address.country || "United States");
      portalUrl.searchParams.set("couponCode", body.couponCode || "");
      portalUrl.searchParams.set("couponDiscountPercent", String(body.couponDiscountPercent || 0));
      portalUrl.searchParams.set("items", JSON.stringify(body.items));

      return NextResponse.json({ url: portalUrl.toString() });
    }

    // 2. Real Stripe Checkout Session Integration
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia" as any,
    });

    const discountMultiplier = 1 - (body.couponDiscountPercent || 0) / 100;
    
    // Map cart items to Stripe line items
    const lineItems = body.items.map((item: any) => {
      // Calculate final unit price (Stripe requires amount in cents)
      const unitAmountInCents = Math.round(item.price * discountMultiplier * 100);
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${item.name} (SIZE: ${item.size})`,
            images: item.imageUrl ? [item.imageUrl] : [],
          },
          unit_amount: unitAmountInCents,
        },
        quantity: item.quantity,
      };
    });

    // Handle conditional flat shipping cost
    const subtotal = body.items.reduce(
      (acc: number, item: any) => acc + item.price * item.quantity,
      0
    );
    const shippingFee = subtotal > 250 || subtotal === 0 ? 0 : 10;
    
    if (shippingFee > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Flat Rate Insured Shipping",
          },
          unit_amount: shippingFee * 100, // Cents
        },
        quantity: 1,
      });
    }

    // Create session in Stripe
    const session = await stripe.checkout.sessions.create({
      automatic_payment_methods: {
        enabled: true
      },
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      metadata: {
        userId: body.userId,
        couponCode: body.couponCode,
        couponDiscountPercent: String(body.couponDiscountPercent || 0),
        address: JSON.stringify(body.address),
        cartItems: JSON.stringify(
          body.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            size: item.size,
          }))
        ),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe Session Creation Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
