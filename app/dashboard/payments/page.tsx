"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { supabase } from "@/lib/supabase";

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMethod, setFilterMethod] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState("month");
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);

      const { data: ordersData, error } = await supabase
        .from("orders_full_view_table")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const transformedPayments = (ordersData || []).map((order: any) => {
        const paymentStatus =
          order.payment_status === "paid"
            ? "Paid"
            : order.payment_status === "pending"
            ? "Pending"
            : order.payment_status === "failed"
            ? "Failed"
            : order.payment_status === "refunded"
            ? "Refunded"
            : "Pending";

        const paymentMethod =
          order.payment_method === "online" ? "Online" : "Cash";

        const date = new Date(order.created_at);
        const formattedDate = date.toISOString().split("T")[0];
        const formattedTime = date.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        return {
          id: `PAY-${order.id}`,
          orderId: order.order_number,
          customer: order.user_name,
          amount: parseFloat(order.total_amount || 0),
          method: paymentMethod,
          paymentGateway: paymentMethod === "Online" ? "Razorpay" : "-",
          status: paymentStatus,
          date: formattedDate,
          time: formattedTime,
          transactionId:
            paymentMethod === "Online"
              ? `TXN${order.id}${Math.floor(Math.random() * 1000)}`
              : "-",
          service:
            order.item_count > 1 ? `${order.item_count} Services` : "Service",
        };
      });

      setPayments(transformedPayments);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for fallback
  const mockPayments = [
    {
      id: "PAY-1234",
      orderId: "ORD-1234",
      customer: "Rahul Sharma",
      amount: 2500,
      method: "Online",
      paymentGateway: "Razorpay",
      status: "Paid",
      date: "2025-10-21",
      time: "10:30 AM",
      transactionId: "TXN123456789",
      service: "AC Repair",
    },
    {
      id: "PAY-1233",
      orderId: "ORD-1233",
      customer: "Priya Gupta",
      amount: 3000,
      method: "Cash",
      paymentGateway: "-",
      status: "Paid",
      date: "2025-10-21",
      time: "09:00 AM",
      transactionId: "-",
      service: "House Cleaning",
    },
    {
      id: "PAY-1232",
      orderId: "ORD-1232",
      customer: "Amit Patel",
      amount: 1500,
      method: "Online",
      paymentGateway: "Paytm",
      status: "Paid",
      date: "2025-10-20",
      time: "02:00 PM",
      transactionId: "TXN987654321",
      service: "Plumbing",
    },
    {
      id: "PAY-1231",
      orderId: "ORD-1231",
      customer: "Sneha Kumar",
      amount: 1800,
      method: "Cash",
      paymentGateway: "-",
      status: "Pending",
      date: "2025-10-21",
      time: "03:00 PM",
      transactionId: "-",
      service: "Electrical Work",
    },
    {
      id: "PAY-1230",
      orderId: "ORD-1230",
      customer: "Vikram Singh",
      amount: 5000,
      method: "Online",
      paymentGateway: "Razorpay",
      status: "Failed",
      date: "2025-10-19",
      time: "11:00 AM",
      transactionId: "TXN111222333",
      service: "Painting",
    },
    {
      id: "PAY-1229",
      orderId: "ORD-1229",
      customer: "Anjali Reddy",
      amount: 2200,
      method: "Online",
      paymentGateway: "PhonePe",
      status: "Refunded",
      date: "2025-10-18",
      time: "04:30 PM",
      transactionId: "TXN444555666",
      service: "Pest Control",
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, "success" | "warning" | "danger" | "info"> =
      {
        Paid: "success",
        Pending: "warning",
        Failed: "danger",
        Refunded: "info",
      };
    return <Badge variant={statusMap[status]}>{status}</Badge>;
  };

  const getMethodBadge = (method: string) => {
    return method === "Online" ? (
      <Badge variant="info">Online</Badge>
    ) : (
      <Badge variant="default">Cash</Badge>
    );
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesStatus =
      filterStatus === "all" || payment.status.toLowerCase() === filterStatus;
    const matchesMethod =
      filterMethod === "all" || payment.method.toLowerCase() === filterMethod;
    const matchesSearch =
      payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.transactionId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesMethod && matchesSearch;
  });

  const handleViewDetails = (payment: any) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  // Calculate stats
  const totalRevenue = payments
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const onlinePayments = payments
    .filter((p) => p.method === "Online" && p.status === "Paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const cashPayments = payments
    .filter((p) => p.method === "Cash" && p.status === "Paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = payments
    .filter((p) => p.status === "Pending")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Payment Management
          </h1>
          <p className="text-gray-600 mt-1">
            Track and manage all transactions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <Button>
            <svg
              className="w-5 h-5 mr-2"
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
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                ₹{totalRevenue.toLocaleString()}
              </p>
              <p className="text-sm text-green-600 mt-1">
                +12.5% vs last month
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
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
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Online Payments</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                ₹{onlinePayments.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {((onlinePayments / totalRevenue) * 100).toFixed(0)}% of total
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cash Payments</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                ₹{cashPayments.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {((cashPayments / totalRevenue) * 100).toFixed(0)}% of total
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Payments</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                ₹{pendingPayments.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {payments.filter((p) => p.status === "Pending").length}{" "}
                transactions
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <Card title="Revenue Breakdown" subtitle="Payment method distribution">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Method Distribution */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              By Payment Method
            </h4>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Online Payments
                  </span>
                  <span className="text-sm text-gray-600">
                    ₹{onlinePayments.toLocaleString()} (
                    {((onlinePayments / totalRevenue) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${(onlinePayments / totalRevenue) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Cash Payments
                  </span>
                  <span className="text-sm text-gray-600">
                    ₹{cashPayments.toLocaleString()} (
                    {((cashPayments / totalRevenue) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(cashPayments / totalRevenue) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status Distribution */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              By Payment Status
            </h4>
            <div className="space-y-4">
              {[
                {
                  status: "Paid",
                  count: payments.filter((p) => p.status === "Paid").length,
                  color: "bg-green-600",
                },
                {
                  status: "Pending",
                  count: payments.filter((p) => p.status === "Pending").length,
                  color: "bg-yellow-600",
                },
                {
                  status: "Failed",
                  count: payments.filter((p) => p.status === "Failed").length,
                  color: "bg-red-600",
                },
                {
                  status: "Refunded",
                  count: payments.filter((p) => p.status === "Refunded").length,
                  color: "bg-blue-600",
                },
              ].map((item) => (
                <div key={item.status}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {item.status}
                    </span>
                    <span className="text-sm text-gray-600">
                      {item.count} transactions (
                      {((item.count / payments.length) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`${item.color} h-3 rounded-full transition-all duration-500`}
                      style={{
                        width: `${(item.count / payments.length) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Filters and Search */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by payment ID, order ID, customer, or transaction ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              }
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: "all", label: "All Status" },
                { value: "paid", label: "Paid" },
                { value: "pending", label: "Pending" },
                { value: "failed", label: "Failed" },
                { value: "refunded", label: "Refunded" },
              ]}
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              options={[
                { value: "all", label: "All Methods" },
                { value: "online", label: "Online" },
                { value: "cash", label: "Cash" },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Payments Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Payment ID
                </th>
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
                  Method
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Date & Time
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="font-medium text-blue-600">
                        {payment.id}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {payment.orderId}
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      {payment.customer}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {payment.service}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      ₹{payment.amount}
                    </td>
                    <td className="py-3 px-4">
                      {getMethodBadge(payment.method)}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-gray-900">{payment.date}</p>
                        <p className="text-sm text-gray-500">{payment.time}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleViewDetails(payment)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payment Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Payment Details"
        size="lg"
      >
        {selectedPayment && (
          <div className="space-y-6">
            {/* Payment Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Payment ID</p>
                <p className="font-semibold text-gray-900">
                  {selectedPayment.id}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <div className="mt-1">
                  {getStatusBadge(selectedPayment.status)}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="font-semibold text-blue-600">
                  {selectedPayment.orderId}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="font-semibold text-gray-900 text-lg">
                  ₹{selectedPayment.amount}
                </p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Customer Information
              </h3>
              <div className="space-y-2">
                <p className="text-gray-700">
                  <span className="font-medium">Name:</span>{" "}
                  {selectedPayment.customer}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Service:</span>{" "}
                  {selectedPayment.service}
                </p>
              </div>
            </div>

            {/* Payment Info */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Payment Information
              </h3>
              <div className="space-y-2">
                <p className="text-gray-700">
                  <span className="font-medium">Payment Method:</span>{" "}
                  {selectedPayment.method}
                </p>
                {selectedPayment.paymentGateway !== "-" && (
                  <p className="text-gray-700">
                    <span className="font-medium">Payment Gateway:</span>{" "}
                    {selectedPayment.paymentGateway}
                  </p>
                )}
                {selectedPayment.transactionId !== "-" && (
                  <p className="text-gray-700">
                    <span className="font-medium">Transaction ID:</span>{" "}
                    {selectedPayment.transactionId}
                  </p>
                )}
                <p className="text-gray-700">
                  <span className="font-medium">Date & Time:</span>{" "}
                  {selectedPayment.date} at {selectedPayment.time}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t pt-4 flex gap-3">
              {selectedPayment.status === "Paid" && (
                <Button variant="danger" className="flex-1">
                  Initiate Refund
                </Button>
              )}
              {selectedPayment.status === "Failed" && (
                <Button variant="primary" className="flex-1">
                  Retry Payment
                </Button>
              )}
              <Button variant="outline" className="flex-1">
                Download Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
