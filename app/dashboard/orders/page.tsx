"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { supabase } from "@/lib/supabase";

export default function OrdersPage() {
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Fetch orders from Supabase
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders_full_view_table")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform data to match UI format
      const transformedOrders =
        data?.map((order: any) => ({
          id: order.id,
          orderNumber: order.order_number,
          customer: {
            name: order.user_name,
            phone: order.user_phone,
            email: `${order.user_name
              .toLowerCase()
              .replace(" ", ".")}@example.com`,
          },
          service:
            order.item_count > 1 ? `${order.item_count} Services` : "Service",
          amount: parseFloat(order.total_amount),
          status: capitalizeStatus(order.status),
          date: new Date(order.scheduled_date).toLocaleDateString("en-IN"),
          time: order.scheduled_time,
          address: `${order.house_floor}${
            order.building_block ? ", " + order.building_block : ""
          }${order.landmark ? ", " + order.landmark : ""}`,
          paymentMethod: order.payment_method || "Cash",
          paymentStatus: order.payment_status,
          specialInstructions: order.special_instructions,
          cancelReason: order.cancellation_reason,
          serviceProvider: null,
          timeline: generateTimeline(order),
        })) || [];

      setOrders(transformedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
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

  const generateTimeline = (order: any) => {
    const timeline = [
      {
        status: "Placed",
        time: order.created_at
          ? new Date(order.created_at).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-",
        completed: true,
      },
      {
        status: "Confirmed",
        time: order.confirmed_at
          ? new Date(order.confirmed_at).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-",
        completed: order.status !== "pending" && order.status !== "cancelled",
      },
      {
        status: "In Progress",
        time: "-",
        completed:
          order.status === "in_progress" || order.status === "completed",
      },
      {
        status: "Completed",
        time: order.completed_at
          ? new Date(order.completed_at).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-",
        completed: order.status === "completed",
      },
    ];

    if (order.status === "cancelled") {
      return [
        timeline[0],
        {
          status: "Cancelled",
          time: order.cancelled_at
            ? new Date(order.cancelled_at).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-",
          completed: true,
        },
      ];
    }

    return timeline;
  };

  // Dummy mock data for fallback
  const mockOrders = [
    {
      id: "ORD-1234",
      orderNumber: "#1234",
      customer: {
        name: "Rahul Sharma",
        phone: "+91 9876543210",
        email: "rahul@example.com",
      },
      service: "AC Repair",
      amount: 2500,
      status: "Pending",
      date: "2025-10-21",
      time: "10:30 AM",
      address: "123, MG Road, Bangalore - 560001",
      paymentMethod: "Online",
      serviceProvider: null,
      timeline: [
        { status: "Placed", time: "10:30 AM", completed: true },
        { status: "Confirmed", time: "-", completed: false },
        { status: "In Progress", time: "-", completed: false },
        { status: "Completed", time: "-", completed: false },
      ],
    },
    {
      id: "ORD-1233",
      orderNumber: "#1233",
      customer: {
        name: "Priya Gupta",
        phone: "+91 9876543211",
        email: "priya@example.com",
      },
      service: "House Cleaning",
      amount: 3000,
      status: "In Progress",
      date: "2025-10-21",
      time: "09:00 AM",
      address: "456, Park Street, Mumbai - 400001",
      paymentMethod: "Cash",
      serviceProvider: "Ravi Kumar",
      timeline: [
        { status: "Placed", time: "09:00 AM", completed: true },
        { status: "Confirmed", time: "09:15 AM", completed: true },
        { status: "In Progress", time: "10:00 AM", completed: true },
        { status: "Completed", time: "-", completed: false },
      ],
    },
    {
      id: "ORD-1232",
      orderNumber: "#1232",
      customer: {
        name: "Amit Patel",
        phone: "+91 9876543212",
        email: "amit@example.com",
      },
      service: "Plumbing",
      amount: 1500,
      status: "Completed",
      date: "2025-10-20",
      time: "02:00 PM",
      address: "789, Lake View, Delhi - 110001",
      paymentMethod: "Online",
      serviceProvider: "Suresh Yadav",
      timeline: [
        { status: "Placed", time: "02:00 PM", completed: true },
        { status: "Confirmed", time: "02:10 PM", completed: true },
        { status: "In Progress", time: "03:00 PM", completed: true },
        { status: "Completed", time: "05:30 PM", completed: true },
      ],
    },
    {
      id: "ORD-1231",
      orderNumber: "#1231",
      customer: {
        name: "Sneha Kumar",
        phone: "+91 9876543213",
        email: "sneha@example.com",
      },
      service: "Electrical Work",
      amount: 1800,
      status: "Confirmed",
      date: "2025-10-21",
      time: "03:00 PM",
      address: "321, Brigade Road, Bangalore - 560025",
      paymentMethod: "Cash",
      serviceProvider: "Ramesh Singh",
      timeline: [
        { status: "Placed", time: "03:00 PM", completed: true },
        { status: "Confirmed", time: "03:15 PM", completed: true },
        { status: "In Progress", time: "-", completed: false },
        { status: "Completed", time: "-", completed: false },
      ],
    },
    {
      id: "ORD-1230",
      orderNumber: "#1230",
      customer: {
        name: "Vikram Singh",
        phone: "+91 9876543214",
        email: "vikram@example.com",
      },
      service: "Painting",
      amount: 5000,
      status: "Cancelled",
      date: "2025-10-19",
      time: "11:00 AM",
      address: "654, Anna Nagar, Chennai - 600040",
      paymentMethod: "Online",
      serviceProvider: null,
      cancelReason: "Customer requested cancellation",
      timeline: [
        { status: "Placed", time: "11:00 AM", completed: true },
        { status: "Cancelled", time: "11:30 AM", completed: true },
      ],
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, "warning" | "info" | "success" | "danger"> =
      {
        Pending: "warning",
        Confirmed: "info",
        "In Progress": "info",
        Completed: "success",
        Cancelled: "danger",
      };
    return <Badge variant={statusMap[status]}>{status}</Badge>;
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      selectedStatus === "all" || order.status.toLowerCase() === selectedStatus;
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.phone.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const handleViewDetails = async (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
    // Fetch order items
    await fetchOrderItems(order.id);
  };

  const fetchOrderItems = async (orderId: string) => {
    try {
      setLoadingItems(true);
      const response = await fetch(`/api/orders/${orderId}`);
      const data = await response.json();

      if (data.items) {
        console.log("📦 Order items fetched:", data.items);
        setOrderItems(data.items);
      }
    } catch (error) {
      console.error("Error fetching order items:", error);
      setOrderItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleAction = (order: any) => {
    setSelectedOrder(order);
    setActionModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-1">
            Manage and track all customer orders
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
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
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filter
          </Button>
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
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: "All Orders",
            count: orders.length,
            color: "bg-gray-100 text-gray-800",
          },
          {
            label: "Pending",
            count: orders.filter((o) => o.status === "Pending").length,
            color: "bg-yellow-100 text-yellow-800",
          },
          {
            label: "Confirmed",
            count: orders.filter((o) => o.status === "Confirmed").length,
            color: "bg-blue-100 text-blue-800",
          },
          {
            label: "In Progress",
            count: orders.filter((o) => o.status === "In Progress").length,
            color: "bg-purple-100 text-purple-800",
          },
          {
            label: "Completed",
            count: orders.filter((o) => o.status === "Completed").length,
            color: "bg-green-100 text-green-800",
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by order number, customer name, or phone..."
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
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={[
                { value: "all", label: "All Status" },
                { value: "pending", label: "Pending" },
                { value: "confirmed", label: "Confirmed" },
                { value: "in progress", label: "In Progress" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      <Card>
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
                  Date & Time
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Amount
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="font-medium text-blue-600">
                        {order.orderNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {order.customer.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.customer.phone}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{order.service}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-gray-900">{order.date}</p>
                        <p className="text-sm text-gray-500">{order.time}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      ₹{order.amount}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(order)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View
                        </button>
                        {order.status !== "Completed" &&
                          order.status !== "Cancelled" && (
                            <button
                              onClick={() => handleAction(order)}
                              className="text-green-600 hover:text-green-700 text-sm font-medium"
                            >
                              Action
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Order Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Order Details"
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Order Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Order Number</p>
                <p className="font-semibold text-gray-900">
                  {selectedOrder.orderNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <div className="mt-1">
                  {getStatusBadge(selectedOrder.status)}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date & Time</p>
                <p className="font-semibold text-gray-900">
                  {selectedOrder.date} at {selectedOrder.time}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="font-semibold text-gray-900">
                  ₹{selectedOrder.amount}
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
                  {selectedOrder.customer.name}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Phone:</span>{" "}
                  {selectedOrder.customer.phone}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Email:</span>{" "}
                  {selectedOrder.customer.email}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Address:</span>{" "}
                  {selectedOrder.address}
                </p>
              </div>
            </div>

            {/* Service Info */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Service Details
              </h3>
              <div className="space-y-2">
                <p className="text-gray-700">
                  <span className="font-medium">Service:</span>{" "}
                  {selectedOrder.service}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Payment Method:</span>{" "}
                  {selectedOrder.paymentMethod}
                </p>
                {selectedOrder.serviceProvider && (
                  <p className="text-gray-700">
                    <span className="font-medium">Service Provider:</span>{" "}
                    {selectedOrder.serviceProvider}
                  </p>
                )}
              </div>
            </div>

            {/* Service Tasks */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Service Tasks</h3>
              {loadingItems ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading tasks...</p>
                </div>
              ) : orderItems.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                  {orderItems.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex-shrink-0 w-[320px] bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {/* Task Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-3xl">{item.service_icon || "🔧"}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {item.service_name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            Qty: {item.quantity}
                          </p>
                        </div>
                      </div>

                      {/* Price Info */}
                      <div className="bg-gray-50 rounded-md px-3 py-2 mb-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Unit Price:</span>
                          <span className="font-medium text-gray-900">
                            ₹{parseFloat(item.unit_price).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-1">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-bold text-gray-900">
                            ₹{parseFloat(item.total_price).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Description if available */}
                      {item.service_description && (
                        <p className="text-xs text-gray-600 mb-3">
                          {item.service_description}
                        </p>
                      )}

                      {/* Action Button */}
                      <Button className="w-full" size="sm" variant="outline">
                        Assign Provider
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <svg
                    className="w-12 h-12 text-gray-400 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p className="text-gray-500">No service tasks found</p>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                Order Timeline
              </h3>
              <div className="space-y-4">
                {selectedOrder.timeline.map((step: any, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        step.completed ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      {step.completed ? (
                        <svg
                          className="w-5 h-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          step.completed ? "text-gray-900" : "text-gray-500"
                        }`}
                      >
                        {step.status}
                      </p>
                      <p className="text-sm text-gray-500">{step.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedOrder.cancelReason && (
              <div className="border-t pt-4">
                <p className="text-sm text-red-600">
                  <span className="font-medium">Cancellation Reason:</span>{" "}
                  {selectedOrder.cancelReason}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Action Modal */}
      <Modal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        title="Order Actions"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <p className="text-gray-700">
              Select an action for order{" "}
              <span className="font-semibold">{selectedOrder.orderNumber}</span>
            </p>
            <div className="space-y-2">
              {selectedOrder.status === "Pending" && (
                <Button className="w-full" variant="success">
                  Confirm Order
                </Button>
              )}
              {(selectedOrder.status === "Pending" ||
                selectedOrder.status === "Confirmed") && (
                <Button className="w-full" variant="primary">
                  Assign Service Provider
                </Button>
              )}
              {selectedOrder.status === "Confirmed" && (
                <Button className="w-full" variant="primary">
                  Mark as In Progress
                </Button>
              )}
              {selectedOrder.status === "In Progress" && (
                <Button className="w-full" variant="success">
                  Mark as Completed
                </Button>
              )}
              <Button className="w-full" variant="secondary">
                Reschedule
              </Button>
              <Button className="w-full" variant="danger">
                Cancel Order
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
