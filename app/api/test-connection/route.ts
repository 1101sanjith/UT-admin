import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseAnonKey,
      supabaseUrlPreview: supabaseUrl
        ? `${supabaseUrl.substring(0, 20)}...`
        : "MISSING",
      supabaseKeyPreview: supabaseAnonKey
        ? `${supabaseAnonKey.substring(0, 20)}...`
        : "MISSING",
    },
    connection: {
      status: "unknown",
      error: null as any,
    },
    table: {
      exists: false,
      error: null as any,
    },
    data: {
      count: 0,
      sample: [] as any[],
    },
  };

  // Test 1: Check environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    diagnostics.connection.status = "error";
    diagnostics.connection.error =
      "Missing environment variables. Please check .env.local file.";
    return NextResponse.json(diagnostics, { status: 500 });
  }

  try {
    // Test 2: Try to connect
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    diagnostics.connection.status = "connected";

    // Test 3: Check if table exists
    const { data, error, count } = await supabase
      .from("services")
      .select("*", { count: "exact" })
      .limit(3);

    if (error) {
      diagnostics.table.exists = false;
      diagnostics.table.error = {
        message: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details,
      };

      if (error.code === "42P01") {
        diagnostics.table.error.solution =
          "Table 'services' does not exist. Run the SQL from SERVICES_DATA_FORMAT.md to create it.";
      } else if (error.code === "42501") {
        diagnostics.table.error.solution =
          "Permission denied. Check Row Level Security policies in Supabase.";
      }

      return NextResponse.json(diagnostics, { status: 500 });
    }

    diagnostics.table.exists = true;
    diagnostics.data.count = count || 0;
    diagnostics.data.sample = data || [];

    return NextResponse.json(diagnostics, { status: 200 });
  } catch (error: any) {
    diagnostics.connection.status = "error";
    diagnostics.connection.error = {
      message: error.message,
      stack: error.stack,
    };
    return NextResponse.json(diagnostics, { status: 500 });
  }
}
