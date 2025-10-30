import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { totpStorage } from "@/lib/totp-storage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Generate a new TOTP secret for this user
    const secret = speakeasy.generateSecret({
      name: `UT-Admin (${email})`,
      issuer: "UT-Admin Panel",
      length: 32,
    });

    // Generate QR code
    const otpauth = speakeasy.otpauthURL({
      secret: secret.base32,
      label: email,
      issuer: "UT-Admin Panel",
      encoding: "base32",
    });

    const qrCodeDataURL = await QRCode.toDataURL(otpauth);

    // Generate current TOTP token
    const currentToken = speakeasy.totp({
      secret: secret.base32,
      encoding: "base32",
    });

    // Store the user's secret in memory
    totpStorage.addUser(email, secret.base32);

    return NextResponse.json({
      success: true,
      email,
      secret: secret.base32,
      qrCode: qrCodeDataURL,
      currentToken,
      manualEntryKey:
        secret.base32.match(/.{1,4}/g)?.join(" ") || secret.base32,
    });
  } catch (error) {
    console.error("Error generating TOTP for user:", error);
    return NextResponse.json(
      { error: "Failed to generate TOTP" },
      { status: 500 }
    );
  }
}
