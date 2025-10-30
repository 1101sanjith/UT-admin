#!/usr/bin/env node

/**
 * TOTP Generator CLI
 * Generates TOTP codes for testing and authentication
 *
 * Usage:
 *   node totp-cli.js
 *   node totp-cli.js --qr
 *   node totp-cli.js --setup
 */

const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

// Configuration
const ADMIN_EMAIL = "sanjithrozario@gmail.com";
const TOTP_SECRET = process.env.TOTP_SECRET || "JBSWY3DPEHPK3PXP";

const args = process.argv.slice(2);
const showQR = args.includes("--qr");
const showSetup = args.includes("--setup");

async function generateQRCode() {
  const otpauth = speakeasy.otpauthURL({
    secret: TOTP_SECRET,
    label: ADMIN_EMAIL,
    issuer: "UT-Admin Panel",
    encoding: "base32",
  });

  try {
    const qrCode = await QRCode.toString(otpauth, {
      type: "terminal",
      small: true,
    });
    return qrCode;
  } catch (error) {
    console.error("Error generating QR code:", error);
    return null;
  }
}

function generateTOTP() {
  return speakeasy.totp({
    secret: TOTP_SECRET,
    encoding: "base32",
  });
}

function formatSecretKey(secret) {
  return secret.match(/.{1,4}/g)?.join(" ") || secret;
}

function getRemainingTime() {
  const now = Math.floor(Date.now() / 1000);
  const timeStep = 30;
  const remaining = timeStep - (now % timeStep);
  return remaining;
}

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║        TOTP Google Authentication Generator           ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  if (showSetup || showQR) {
    console.log("📧 Email Address:");
    console.log(`   ${ADMIN_EMAIL}\n`);

    console.log("🔑 Secret Key:");
    console.log(`   ${formatSecretKey(TOTP_SECRET)}\n`);

    console.log("🔐 Raw Secret (for configuration):");
    console.log(`   ${TOTP_SECRET}\n`);

    if (showQR) {
      console.log("📱 QR Code (Scan with Google Authenticator):");
      const qr = await generateQRCode();
      if (qr) {
        console.log(qr);
      }
    }

    console.log("📖 Setup Instructions:");
    console.log("   1. Install Google Authenticator on your phone");
    console.log(
      "   2. Scan the QR code above OR manually enter the secret key"
    );
    console.log("   3. Use the generated 6-digit code to login\n");
  }

  // Always show current TOTP
  const token = generateTOTP();
  const remaining = getRemainingTime();

  console.log("🔢 Current TOTP Code:");
  console.log(`\n   ┌─────────────┐`);
  console.log(`   │   ${token}   │`);
  console.log(`   └─────────────┘`);
  console.log(`\n   ⏱️  Valid for ${remaining} more seconds\n`);

  if (!showSetup && !showQR) {
    console.log("💡 Tips:");
    console.log("   • Run with --qr to show QR code");
    console.log("   • Run with --setup to show full setup information");
    console.log("   • This code changes every 30 seconds\n");
  }

  console.log("🌐 URLs:");
  console.log("   Login:  http://localhost:3001/login");
  console.log("   Setup:  http://localhost:3001/totp-setup\n");

  console.log("╚════════════════════════════════════════════════════════╝\n");
}

main().catch(console.error);
