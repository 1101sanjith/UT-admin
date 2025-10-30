import { NextResponse } from "next/server";
import { getTOTPSetupInfo } from "@/lib/totp";

export async function GET() {
  try {
    const setupInfo = await getTOTPSetupInfo();

    return NextResponse.json(setupInfo);
  } catch (error) {
    console.error("Error getting TOTP setup info:", error);
    return NextResponse.json(
      { error: "Failed to get TOTP setup information" },
      { status: 500 }
    );
  }
}
