import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Fetch all orders
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (ordersError) throw ordersError;

    // Calculate Order Status Distribution
    const statusCounts = {
      completed: 0,
      in_progress: 0,
      pending: 0,
      cancelled: 0,
      confirmed: 0,
    };

    let totalRevenue = 0;
    let completedRevenue = 0;

    orders?.forEach((order: any) => {
      const status = order.status?.toLowerCase() || "pending";
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status as keyof typeof statusCounts]++;
      }

      if (order.payment_status === "paid") {
        const amount = parseFloat(order.total_amount || 0);
        totalRevenue += amount;
        if (status === "completed") {
          completedRevenue += amount;
        }
      }
    });

    const totalOrders = orders?.length || 0;
    const orderStatusDistribution = [
      {
        status: "Completed",
        count: statusCounts.completed,
        percentage:
          totalOrders > 0
            ? Math.round((statusCounts.completed / totalOrders) * 100)
            : 0,
        color: "green",
      },
      {
        status: "In Progress",
        count: statusCounts.in_progress + statusCounts.confirmed,
        percentage:
          totalOrders > 0
            ? Math.round(
                ((statusCounts.in_progress + statusCounts.confirmed) /
                  totalOrders) *
                  100
              )
            : 0,
        color: "blue",
      },
      {
        status: "Pending",
        count: statusCounts.pending,
        percentage:
          totalOrders > 0
            ? Math.round((statusCounts.pending / totalOrders) * 100)
            : 0,
        color: "yellow",
      },
      {
        status: "Cancelled",
        count: statusCounts.cancelled,
        percentage:
          totalOrders > 0
            ? Math.round((statusCounts.cancelled / totalOrders) * 100)
            : 0,
        color: "red",
      },
    ];

    // Calculate Revenue Overview (Last 7 days)
    const today = new Date();
    const last7Days = [];
    const revenueByDay: { [key: string]: number } = {};

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayKey = date.toISOString().split("T")[0];
      last7Days.push(dayKey);
      revenueByDay[dayKey] = 0;
    }

    orders?.forEach((order: any) => {
      if (order.payment_status === "paid" && order.created_at) {
        const orderDate = new Date(order.created_at)
          .toISOString()
          .split("T")[0];
        if (revenueByDay.hasOwnProperty(orderDate)) {
          revenueByDay[orderDate] += parseFloat(order.total_amount || 0);
        }
      }
    });

    const revenueOverview = last7Days.map((dayKey) => {
      const date = new Date(dayKey);
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return {
        day: dayNames[date.getDay()],
        date: dayKey,
        amount: Math.round(revenueByDay[dayKey]),
        height: 0, // Will be calculated on client side based on max value
      };
    });

    // Calculate Top Services with proper JOIN
    const { data: orderItemsWithServices, error: orderItemsError } =
      await supabase.from("order_items").select(`
        service_id,
        quantity,
        price,
        services:service_id (
          id,
          name,
          category,
          is_active
        )
      `);

    if (orderItemsError) {
      console.error("Order items fetch error:", orderItemsError);
    }

    // Calculate bookings and revenue per service
    const serviceStats: {
      [key: string]: {
        name: string;
        bookings: number;
        revenue: number;
        category: string;
      };
    } = {};

    orderItemsWithServices?.forEach((item: any) => {
      // Only process if service exists and is active
      if (item.services && item.services.is_active) {
        const serviceId = item.service_id;
        const quantity = item.quantity || 1;
        const price = parseFloat(item.price || 0);

        if (!serviceStats[serviceId]) {
          serviceStats[serviceId] = {
            name: item.services.name,
            bookings: 0,
            revenue: 0,
            category: item.services.category || "General",
          };
        }

        serviceStats[serviceId].bookings += quantity;
        serviceStats[serviceId].revenue += price * quantity;
      }
    });

    // If no order items found, fetch services and show them with 0 bookings
    if (Object.keys(serviceStats).length === 0) {
      const { data: servicesData } = await supabase
        .from("services")
        .select("id, name, category, is_active")
        .eq("is_active", true)
        .limit(5);

      servicesData?.forEach((service: any) => {
        serviceStats[service.id] = {
          name: service.name,
          bookings: 0,
          revenue: 0,
          category: service.category || "General",
        };
      });
    }

    // Convert to array and sort by bookings (primary) and revenue (secondary)
    const topServices = Object.values(serviceStats)
      .sort((a, b) => {
        if (b.bookings !== a.bookings) {
          return b.bookings - a.bookings;
        }
        return b.revenue - a.revenue;
      })
      .slice(0, 5)
      .map((service, index) => ({
        name: service.name,
        bookings: service.bookings,
        revenue: Math.round(service.revenue),
        category: service.category,
        rank: index + 1,
        popularity: service.bookings, // For chart calculation
      }));

    // Fetch users count
    const { count: usersCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    // Calculate stats
    const stats = {
      totalOrders: totalOrders,
      revenue: Math.round(totalRevenue),
      activeUsers: usersCount || 0,
      completedOrders: statusCounts.completed,
      avgOrderValue:
        totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      cancellationRate:
        totalOrders > 0
          ? ((statusCounts.cancelled / totalOrders) * 100).toFixed(1)
          : "0.0",
    };

    return NextResponse.json({
      success: true,
      stats,
      orderStatusDistribution,
      revenueOverview,
      topServices,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
