import speakeasy from "speakeasy";
import QRCode from "qrcode";

// Hardcoded email for authentication
export const ADMIN_EMAIL = "sanjithrozario@gmail.com";

// Hardcoded secret key (In production, this should be stored securely in environment variables)
// Generate a new secret if needed by uncommenting the line below and running once
// console.log('New Secret:', speakeasy.generateSecret({ length: 32 }).base32);

export const TOTP_SECRET = process.env.TOTP_SECRET || "JBSWY3DPEHPK3PXP"; // Replace with your generated secret

/**
 * Generate a new TOTP secret
 */
export function generateTOTPSecret(email: string = ADMIN_EMAIL) {
  const secret = speakeasy.generateSecret({
    name: `UT-Admin (${email})`,
    issuer: "UT-Admin Panel",
    length: 32,
  });

  return {
    secret: secret.base32,
    otpauth_url: secret.otpauth_url,
  };
}

/**
 * Verify TOTP token
 */
export function verifyTOTP(
  token: string,
  secret: string = TOTP_SECRET
): boolean {
  try {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: 2, // Allow 2 time steps before and after for clock skew
    });
  } catch (error) {
    console.error("TOTP verification error:", error);
    return false;
  }
}

/**
 * Generate current TOTP token (for testing/debugging)
 */
export function generateTOTP(secret: string = TOTP_SECRET): string {
  return speakeasy.totp({
    secret: secret,
    encoding: "base32",
  });
}

/**
 * Generate QR code data URL
 */
export async function generateQRCode(
  secret: string = TOTP_SECRET,
  email: string = ADMIN_EMAIL
): Promise<string> {
  const otpauth = speakeasy.otpauthURL({
    secret: secret,
    label: email,
    issuer: "UT-Admin Panel",
    encoding: "base32",
  });

  try {
    const qrCodeDataURL = await QRCode.toDataURL(otpauth);
    return qrCodeDataURL;
  } catch (error) {
    console.error("QR code generation error:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Get TOTP setup information
 */
export async function getTOTPSetupInfo() {
  const qrCode = await generateQRCode(TOTP_SECRET, ADMIN_EMAIL);
  const currentToken = generateTOTP(TOTP_SECRET);

  return {
    email: ADMIN_EMAIL,
    secret: TOTP_SECRET,
    qrCode,
    currentToken,
    manualEntryKey: TOTP_SECRET.match(/.{1,4}/g)?.join(" ") || TOTP_SECRET, // Format for easier manual entry
  };
}
