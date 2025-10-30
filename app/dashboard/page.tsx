"use client";

import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState("today");
  const [stats, setStats] = useState({
    totalOrders: 0,
    revenue: 0,
    activeUsers: 0,
    completedOrders: 0,
    avgOrderValue: 0,
    cancellationRate: "0.0",
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [orderStatusDistribution, setOrderStatusDistribution] = useState<any[]>(
    []
  );
  const [revenueOverview, setRevenueOverview] = useState<any[]>([]);
  const [topServices, setTopServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(refreshInterval);
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      // Don't show loading spinner on auto-refresh, only on initial load
      if (stats.totalOrders === 0) {
        setLoading(true);
      }

      // Fetch dashboard stats from API
      const statsResponse = await fetch("/api/dashboard/stats");
      const statsData = await statsResponse.json();

      if (statsResponse.ok && statsData.success) {
        setStats(statsData.stats);
        setOrderStatusDistribution(statsData.orderStatusDistribution);
        setTopServices(statsData.topServices);

        // Calculate height percentages for revenue chart
        const maxRevenue = Math.max(
          ...statsData.revenueOverview.map((d: any) => d.amount),
          1
        );
        const revenueWithHeights = statsData.revenueOverview.map(
          (item: any) => ({
            ...item,
            height: (item.amount / maxRevenue) * 100,
          })
        );
        setRevenueOverview(revenueWithHeights);
      }

      // Fetch recent orders
      const { data: recentOrdersData } = await supabase
        .from("orders_full_view")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      const transformedRecentOrders = (recentOrdersData || []).map(
        (order: any) => ({
          id: order.order_number,
          customer: order.user_name || "Unknown",
          service:
            order.item_count > 1 ? `${order.item_count} Services` : "Service",
          amount: parseFloat(order.total_amount || 0),
          status: capitalizeStatus(order.status),
          time: getTimeAgo(order.created_at),
        })
      );

      setRecentOrders(transformedRecentOrders);
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

  const getStatusColor = (color: string) => {
    const colorMap: Record<string, string> = {
      green: "bg-green-500",
      blue: "bg-accent",
      yellow: "bg-brand-500",
      red: "bg-red-500",
    };
    return colorMap[color] || "bg-gray-500";
  };

  if (loading) {
    return <Loading fullScreen text="Loading Dashboard..." />;
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-accent to-brand-600 bg-clip-text text-transparent">
            Dashboard Overview
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 md:px-4 py-2 text-sm md:text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-400 focus:border-brand-400 outline-none text-gray-900 bg-white"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button className="px-3 md:px-4 py-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2 text-sm md:text-base font-medium">
            <svg
              className="w-4 h-4 md:w-5 md:h-5"
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
            <span className="hidden sm:inline">Export Report</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6">
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          trend={{ value: "+12.5%", isPositive: true }}
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
          value={`₹${stats.revenue.toLocaleString("en-IN")}`}
          trend={{ value: "+8.3%", isPositive: true }}
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
          value={stats.activeUsers}
          trend={{ value: "+5.2%", isPositive: true }}
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
          value={stats.completedOrders}
          trend={{ value: "+15.1%", isPositive: true }}
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
          value={`₹${stats.avgOrderValue.toLocaleString("en-IN")}`}
          trend={{ value: "-2.1%", isPositive: false }}
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
          value={`${stats.cancellationRate}%`}
          trend={{ value: "-1.2%", isPositive: true }}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Order Status Distribution */}
        <Card title="Order Status Distribution" subtitle="Current breakdown">
          {orderStatusDistribution.length > 0 ? (
            <div className="space-y-4">
              {orderStatusDistribution.map((item) => (
                <div key={item.status}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      {item.status}
                    </span>
                    <span className="text-sm text-gray-600">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`${getStatusColor(
                        item.color
                      )} h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No order data available
            </p>
          )}
        </Card>

        {/* Revenue Chart */}
        <Card title="Revenue Overview" subtitle="Last 7 days">
          {revenueOverview.length > 0 ? (
            <div className="space-y-3">
              {revenueOverview.map((item) => (
                <div
                  key={item.date}
                  className="flex items-center gap-3 md:gap-4"
                >
                  <div className="w-10 md:w-12 text-xs md:text-sm font-semibold text-gray-600">
                    {item.day}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-7 md:h-8">
                        <div
                          className="bg-gradient-to-r from-brand-400 to-brand-600 h-7 md:h-8 rounded-full flex items-center justify-end pr-2 md:pr-3 transition-all duration-500"
                          style={{ width: `${item.height}%` }}
                        >
                          {item.amount > 0 && (
                            <span className="text-xs text-white font-semibold">
                              ₹{(item.amount / 1000).toFixed(0)}k
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No revenue data available
            </p>
          )}
        </Card>
      </div>

      {/* Recent Orders */}
      <Card
        title="Recent Orders"
        subtitle="Latest customer bookings"
        action={
          <button className="text-xs md:text-sm text-brand-600 hover:text-brand-700 font-semibold transition-colors">
            View All →
          </button>
        }
      >
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-3 md:px-4 text-xs font-bold text-gray-600 uppercase tracking-wide">
                    Order ID
                  </th>
                  <th className="text-left py-3 px-3 md:px-4 text-xs font-bold text-gray-600 uppercase tracking-wide">
                    Customer
                  </th>
                  <th className="text-left py-3 px-3 md:px-4 text-xs font-bold text-gray-600 uppercase tracking-wide hidden sm:table-cell">
                    Service
                  </th>
                  <th className="text-left py-3 px-3 md:px-4 text-xs font-bold text-gray-600 uppercase tracking-wide">
                    Amount
                  </th>
                  <th className="text-left py-3 px-3 md:px-4 text-xs font-bold text-gray-600 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left py-3 px-3 md:px-4 text-xs font-bold text-gray-600 uppercase tracking-wide hidden md:table-cell">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-3 md:px-4">
                        <span className="font-semibold text-gray-900 text-sm">
                          {order.id}
                        </span>
                      </td>
                      <td className="py-3 px-3 md:px-4 text-gray-700 text-sm">
                        {order.customer}
                      </td>
                      <td className="py-3 px-3 md:px-4 text-gray-700 text-sm hidden sm:table-cell">
                        {order.service}
                      </td>
                      <td className="py-3 px-3 md:px-4 font-semibold text-gray-900 text-sm">
                        ₹{order.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 md:px-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-3 px-3 md:px-4 text-xs md:text-sm text-gray-500 hidden md:table-cell">
                        {order.time}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No recent orders
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Service Analytics */}
      <Card title="Top Services" subtitle="Most booked services">
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-3 md:px-4 text-xs font-bold text-gray-600 uppercase tracking-wide">
                    Rank
                  </th>
                  <th className="text-left py-3 px-3 md:px-4 text-xs font-bold text-gray-600 uppercase tracking-wide">
                    Service Name
                  </th>
                  <th className="text-left py-3 px-3 md:px-4 text-xs font-bold text-gray-600 uppercase tracking-wide">
                    Bookings
                  </th>
                  <th className="text-left py-3 px-3 md:px-4 text-xs font-bold text-gray-600 uppercase tracking-wide hidden sm:table-cell">
                    Revenue
                  </th>
                  <th className="text-left py-3 px-3 md:px-4 text-xs font-bold text-gray-600 uppercase tracking-wide hidden md:table-cell">
                    Popularity
                  </th>
                </tr>
              </thead>
              <tbody>
                {topServices.length > 0 ? (
                  topServices.map((service) => {
                    const maxBookings = Math.max(
                      ...topServices.map((s) => s.bookings),
                      1
                    );
                    const popularityWidth =
                      (service.bookings / maxBookings) * 100;
                    return (
                      <tr
                        key={service.rank}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-3 md:px-4">
                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-100 text-brand-700 font-bold text-sm">
                            {service.rank}
                          </span>
                        </td>
                        <td className="py-3 px-3 md:px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900 text-sm">
                              {service.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {service.category}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 md:px-4 text-gray-700 font-semibold text-sm">
                          {service.bookings}
                        </td>
                        <td className="py-3 px-3 md:px-4 font-semibold text-gray-900 text-sm hidden sm:table-cell">
                          ₹{service.revenue.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 md:px-4 hidden md:table-cell">
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-brand-400 to-brand-600 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${popularityWidth}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      No service data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
