import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      return NextResponse.json(
        { error: "Missing Razorpay secret." },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired session." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      restaurantId,
    } = body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !restaurantId
    ) {
      return NextResponse.json(
        { error: "Missing payment verification fields." },
        { status: 400 }
      );
    }

    const { data: roleData } = await supabase
      .from("restaurant_users")
      .select("role")
      .eq("restaurant_id", restaurantId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleData?.role !== "admin") {
      return NextResponse.json(
        { error: "Only restaurant admins can verify payments." },
        { status: 403 }
      );
    }

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment signature." },
        { status: 400 }
      );
    }

    const { data: existingPayment } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("razorpay_payment_id", razorpay_payment_id)
      .maybeSingle();

    if (existingPayment) {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
      });
    }

    const { error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: user.id,
        restaurant_id: restaurantId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount: 499,
        status: "paid",
        plan: "pro",
      });

    if (subscriptionError) {
      return NextResponse.json(
        { error: subscriptionError.message },
        { status: 500 }
      );
    }

    await supabase
      .from("menus")
      .update({
        is_pro: true,
      })
      .eq("user_id", user.id);

    return NextResponse.json({
      success: true,
      verified: true,
    });
  } catch (error) {
    console.error("Payment verification failed:", error);

    return NextResponse.json(
      { error: "Verification failed." },
      { status: 500 }
    );
  }
}