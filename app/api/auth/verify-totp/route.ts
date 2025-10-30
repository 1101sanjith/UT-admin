import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import speakeasy from "speakeasy";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token } = body;

    // Validate input
    if (!email || !token) {
      return NextResponse.json(
        { error: "Email and TOTP token are required" },
        { status: 400 }
      );
    }

    // Get admin from Supabase
    const { data: admin, error } = await supabase
      .from("admins")
      .select("email, name, totp_secret, is_active")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !admin) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 401 }
      );
    }

    if (!admin.is_active) {
      return NextResponse.json(
        { error: "Account is inactive" },
        { status: 403 }
      );
    }

    // Verify TOTP token with admin's secret
    const isValid = speakeasy.totp.verify({
      secret: admin.totp_secret,
      encoding: "base32",
      token: token,
      window: 2,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid TOTP token" },
        { status: 401 }
      );
    }

    // Update last login
    await supabase
      .from("admins")
      .update({ last_login: new Date().toISOString() })
      .eq("email", email.toLowerCase());

    // Success
    return NextResponse.json({
      success: true,
      message: "Authentication successful",
      email: admin.email,
      name: admin.name,
    });
  } catch (error) {
    console.error("TOTP verification error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
