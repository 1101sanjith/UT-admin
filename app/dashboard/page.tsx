"use client";

import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState("today");
  const [stats, setStats] = useState({
    totalOrders: { value: 0, trend: { value: "+0%", isPositive: true } },
    revenue: { value: "₹0", trend: { value: "+0%", isPositive: true } },
    activeUsers: { value: 0, trend: { value: "+0%", isPositive: true } },
    completedOrders: { value: 0, trend: { value: "+0%", isPositive: true } },
    avgOrderValue: { value: "₹0", trend: { value: "+0%", isPositive: true } },
    cancellationRate: {
      value: "0%",
      trend: { value: "+0%", isPositive: true },
    },
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [serviceAnalytics, setServiceAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Calculate stats
      const totalOrders = ordersData?.length || 0;
      const completedOrders =
        ordersData?.filter((o: any) => o.status === "completed").length || 0;
      const cancelledOrders =
        ordersData?.filter((o: any) => o.status === "cancelled").length || 0;
      const totalRevenue =
        ordersData
          ?.filter((o: any) => o.payment_status === "paid")
          ?.reduce(
            (sum: number, o: any) => sum + parseFloat(o.total_amount || 0),
            0
          ) || 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const cancellationRate =
        totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

      // Fetch users count
      const { count: usersCount } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      // Fetch recent orders with user data
      const { data: recentOrdersData } = await supabase
        .from("orders_full_view")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      const transformedRecentOrders = (recentOrdersData || []).map(
        (order: any) => ({
          id: order.order_number,
          customer: order.user_name,
          service:
            order.item_count > 1 ? `${order.item_count} Services` : "Service",
          amount: parseFloat(order.total_amount),
          status: capitalizeStatus(order.status),
          time: getTimeAgo(order.created_at),
        })
      );

      // Fetch service analytics (using dummy data since services table doesn't exist)
      const dummyServiceAnalytics = [
        { name: "AC Repair", bookings: 245, revenue: 612500, growth: 12.5 },
        { name: "House Cleaning", bookings: 189, revenue: 567000, growth: 8.3 },
        { name: "Plumbing", bookings: 167, revenue: 250500, growth: 15.2 },
        {
          name: "Electrical Work",
          bookings: 143,
          revenue: 257400,
          growth: -3.1,
        },
        { name: "Painting", bookings: 98, revenue: 490000, growth: 22.4 },
      ];

      setStats({
        totalOrders: {
          value: totalOrders,
          trend: { value: "+12.5%", isPositive: true },
        },
        revenue: {
          value: `₹${Math.round(totalRevenue).toLocaleString("en-IN")}`,
          trend: { value: "+8.3%", isPositive: true },
        },
        activeUsers: {
          value: usersCount || 0,
          trend: { value: "+5.2%", isPositive: true },
        },
        completedOrders: {
          value: completedOrders,
          trend: { value: "+15.1%", isPositive: true },
        },
        avgOrderValue: {
          value: `₹${Math.round(avgOrderValue).toLocaleString("en-IN")}`,
          trend: { value: "-2.1%", isPositive: false },
        },
        cancellationRate: {
          value: `${cancellationRate.toFixed(1)}%`,
          trend: { value: "-1.2%", isPositive: true },
        },
      });

      setRecentOrders(transformedRecentOrders);
      setServiceAnalytics(dummyServiceAnalytics);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const capitalizeStatus = (status: string) => {
    if (!status) return "Pending";
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  // Dummy mock data for fallback
  const mockRecentOrders = [
    {
      id: "ORD-1234",
      customer: "Rahul Sharma",
      service: "AC Repair",
      amount: 2500,
      status: "Pending",
      time: "10 mins ago",
    },
    {
      id: "ORD-1233",
      customer: "Priya Gupta",
      service: "Plumbing",
      amount: 1500,
      status: "In Progress",
      time: "25 mins ago",
    },
    {
      id: "ORD-1232",
      customer: "Amit Patel",
      service: "House Cleaning",
      amount: 3000,
      status: "Completed",
      time: "1 hour ago",
    },
    {
      id: "ORD-1231",
      customer: "Sneha Kumar",
      service: "Electrical Work",
      amount: 1800,
      status: "Confirmed",
      time: "2 hours ago",
    },
    {
      id: "ORD-1230",
      customer: "Vikram Singh",
      service: "Painting",
      amount: 5000,
      status: "Completed",
      time: "3 hours ago",
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      "warning" | "info" | "success" | "default"
    > = {
      Pending: "warning",
      Confirmed: "info",
      "In Progress": "info",
      Completed: "success",
      Cancelled: "default",
    };
    return <Badge variant={statusMap[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.value}
          trend={stats.totalOrders.trend}
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          }
        />
        <StatCard
          title="Revenue"
          value={stats.revenue.value}
          trend={stats.revenue.trend}
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers.value}
          trend={stats.activeUsers.trend}
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          }
        />
        <StatCard
          title="Completed Orders"
          value={stats.completedOrders.value}
          trend={stats.completedOrders.trend}
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatCard
          title="Avg. Order Value"
          value={stats.avgOrderValue.value}
          trend={stats.avgOrderValue.trend}
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          }
        />
        <StatCard
          title="Cancellation Rate"
          value={stats.cancellationRate.value}
          trend={stats.cancellationRate.trend}
          subtitle="Lower is better"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          }
        />
      </div>

      {/* Charts and Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Distribution */}
        <Card title="Order Status Distribution" subtitle="Current breakdown">
          <div className="space-y-4">
            {[
              {
                status: "Completed",
                count: 1089,
                percentage: 87,
                color: "bg-green-500",
              },
              {
                status: "In Progress",
                count: 78,
                percentage: 6,
                color: "bg-blue-500",
              },
              {
                status: "Pending",
                count: 45,
                percentage: 4,
                color: "bg-yellow-500",
              },
              {
                status: "Cancelled",
                count: 35,
                percentage: 3,
                color: "bg-red-500",
              },
            ].map((item) => (
              <div key={item.status}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {item.status}
                  </span>
                  <span className="text-sm text-gray-600">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Revenue Chart */}
        <Card title="Revenue Overview" subtitle="Last 7 days">
          <div className="space-y-3">
            {[
              { day: "Mon", amount: 32000, height: 60 },
              { day: "Tue", amount: 28000, height: 50 },
              { day: "Wed", amount: 35000, height: 70 },
              { day: "Thu", amount: 42000, height: 85 },
              { day: "Fri", amount: 38000, height: 75 },
              { day: "Sat", amount: 45000, height: 90 },
              { day: "Sun", amount: 40000, height: 80 },
            ].map((item) => (
              <div key={item.day} className="flex items-center gap-4">
                <div className="w-12 text-sm font-medium text-gray-600">
                  {item.day}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-8">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-8 rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                        style={{ width: `${item.height}%` }}
                      >
                        <span className="text-xs text-white font-medium">
                          ₹{(item.amount / 1000).toFixed(0)}k
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card
        title="Recent Orders"
        subtitle="Latest customer bookings"
        action={
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All →
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Order ID
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Customer
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Service
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Amount
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">
                      {order.id}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{order.customer}</td>
                  <td className="py-3 px-4 text-gray-700">{order.service}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">
                    ₹{order.amount}
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {order.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Service Analytics */}
      <Card title="Top Services" subtitle="Most booked services this month">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Service Name
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Bookings
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Revenue
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Growth
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Popularity
                </th>
              </tr>
            </thead>
            <tbody>
              {serviceAnalytics.map((service, index) => (
                <tr
                  key={service.name}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {service.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {service.bookings}
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">
                    ₹{service.revenue.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`flex items-center text-sm ${
                        service.growth >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {service.growth >= 0 ? "↑" : "↓"}{" "}
                      {Math.abs(service.growth)}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(service.bookings / 250) * 100}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
