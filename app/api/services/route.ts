import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// GET - Fetch all services
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ data, success: true });
  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Failed to fetch services", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.icon || !body.price) {
      return NextResponse.json(
        {
          error: "Missing required fields: name, icon, and price are required",
        },
        { status: 400 }
      );
    }

    // Validate data types
    if (typeof body.name !== "string" || body.name.trim() === "") {
      return NextResponse.json(
        { error: "Invalid name: must be a non-empty string" },
        { status: 400 }
      );
    }

    if (typeof body.icon !== "string" || body.icon.trim() === "") {
      return NextResponse.json(
        { error: "Invalid icon: must be a non-empty string" },
        { status: 400 }
      );
    }

    const price = parseFloat(body.price);
    if (isNaN(price) || price <= 0) {
      return NextResponse.json(
        { error: "Invalid price: must be a positive number" },
        { status: 400 }
      );
    }

    // Get the highest display_order and add 1
    const { data: maxOrderData, error: maxOrderError } = await supabase
      .from("services")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1);

    if (maxOrderError) {
      console.error("Error fetching max display_order:", maxOrderError);
    }

    const nextDisplayOrder =
      maxOrderData && maxOrderData.length > 0
        ? (maxOrderData[0].display_order || 0) + 1
        : 1;

    // Prepare service data
    const serviceData = {
      name: body.name.trim(),
      icon: body.icon.trim(),
      color: body.color || "#4CAF50",
      price: price,
      what_we_do: Array.isArray(body.what_we_do)
        ? body.what_we_do.filter((item: string) => item && item.trim() !== "")
        : [],
      what_we_dont: Array.isArray(body.what_we_dont)
        ? body.what_we_dont.filter((item: string) => item && item.trim() !== "")
        : [],
      how_its_done: Array.isArray(body.how_its_done)
        ? body.how_its_done.filter((item: string) => item && item.trim() !== "")
        : [],
      is_active: body.is_active !== undefined ? body.is_active : true,
      display_order: nextDisplayOrder,
    };

    console.log("Inserting service data:", serviceData);

    const { data, error } = await supabase
      .from("services")
      .insert(serviceData)
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        {
          error: "Failed to create service",
          details: error.message,
          hint: error.hint,
          code: error.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data, success: true, message: "Service created successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Failed to create service", details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update service
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      );
    }

    // Prepare update data (only include provided fields)
    const serviceUpdate: any = {};

    if (updateData.name !== undefined) {
      serviceUpdate.name = updateData.name.trim();
    }
    if (updateData.icon !== undefined) {
      serviceUpdate.icon = updateData.icon.trim();
    }
    if (updateData.color !== undefined) {
      serviceUpdate.color = updateData.color;
    }
    if (updateData.price !== undefined) {
      serviceUpdate.price = parseFloat(updateData.price);
    }
    if (updateData.what_we_do !== undefined) {
      serviceUpdate.what_we_do = Array.isArray(updateData.what_we_do)
        ? updateData.what_we_do.filter(
            (item: string) => item && item.trim() !== ""
          )
        : [];
    }
    if (updateData.what_we_dont !== undefined) {
      serviceUpdate.what_we_dont = Array.isArray(updateData.what_we_dont)
        ? updateData.what_we_dont.filter(
            (item: string) => item && item.trim() !== ""
          )
        : [];
    }
    if (updateData.how_its_done !== undefined) {
      serviceUpdate.how_its_done = Array.isArray(updateData.how_its_done)
        ? updateData.how_its_done.filter(
            (item: string) => item && item.trim() !== ""
          )
        : [];
    }
    if (updateData.is_active !== undefined) {
      serviceUpdate.is_active = updateData.is_active;
    }

    const { data, error } = await supabase
      .from("services")
      .update(serviceUpdate)
      .eq("id", id)
      .select();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json(
        { error: "Failed to update service", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data, success: true, message: "Service updated successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Failed to update service", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete service
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("services").delete().eq("id", id);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete service", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Service deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Failed to delete service", details: error.message },
      { status: 500 }
    );
  }
}
