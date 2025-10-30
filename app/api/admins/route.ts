import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET - Fetch all admins
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("admins")
      .select(
        "id, email, name, role, is_active, created_at, created_by, last_login"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching admins:", error);
      return NextResponse.json(
        { error: "Failed to fetch admins" },
        { status: 500 }
      );
    }

    return NextResponse.json({ admins: data || [] });
  } catch (error) {
    console.error("Error in GET /api/admins:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add new admin (requires TOTP verification)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, totpSecret, createdBy } = body;

    if (!email || !totpSecret) {
      return NextResponse.json(
        { error: "Email and TOTP secret are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from("admins")
      .select("email")
      .eq("email", email.toLowerCase())
      .single();

    if (existingAdmin) {
      return NextResponse.json(
        { error: "Admin with this email already exists" },
        { status: 409 }
      );
    }

    // Insert new admin
    const { data, error } = await supabase
      .from("admins")
      .insert([
        {
          email: email.toLowerCase(),
          name: name || email.split("@")[0],
          totp_secret: totpSecret,
          role: "admin",
          is_active: true,
          created_by: createdBy || "system",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating admin:", error);
      return NextResponse.json(
        { error: "Failed to create admin" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        created_at: data.created_at,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/admins:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update admin status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Admin ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("admins")
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating admin:", error);
      return NextResponse.json(
        { error: "Failed to update admin" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, admin: data });
  } catch (error) {
    console.error("Error in PATCH /api/admins:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
