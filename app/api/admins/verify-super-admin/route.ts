import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import speakeasy from "speakeasy";

const SUPER_ADMIN_EMAIL = "sanjithrozario@gmail.com";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { totpCode } = body;

    if (!totpCode) {
      return NextResponse.json(
        { error: "TOTP code is required" },
        { status: 400 }
      );
    }

    // Fetch super admin's TOTP secret from database
    const { data: superAdmin, error } = await supabase
      .from("admins")
      .select("totp_secret, is_active")
      .eq("email", SUPER_ADMIN_EMAIL)
      .single();

    if (error || !superAdmin) {
      console.error("Error fetching super admin:", error);
      return NextResponse.json(
        { error: "Super admin not found" },
        { status: 404 }
      );
    }

    if (!superAdmin.is_active) {
      return NextResponse.json(
        { error: "Super admin account is inactive" },
        { status: 403 }
      );
    }

    // Verify TOTP code
    const isValid = speakeasy.totp.verify({
      secret: superAdmin.totp_secret,
      encoding: "base32",
      token: totpCode,
      window: 2,
    });

    if (!isValid) {
      return NextResponse.json({ error: "Invalid TOTP code" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: "TOTP verification successful",
      verified: true,
    });
  } catch (error) {
    console.error("Error verifying super admin TOTP:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
