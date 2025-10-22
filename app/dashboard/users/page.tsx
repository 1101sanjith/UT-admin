"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { supabase } from "@/lib/supabase";

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch users from Supabase
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Fetch users with their addresses and order stats
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;

      // Transform data
      const transformedUsers = await Promise.all(
        (usersData || []).map(async (user: any) => {
          // Fetch user's addresses
          const { data: addressesData } = await supabase
            .from("addresses")
            .select("*")
            .eq("user_id", user.id);

          // Fetch user's orders
          const { data: ordersData } = await supabase
            .from("orders")
            .select(
              "total_amount, status, created_at, order_number, scheduled_date"
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5);

          const totalOrders = ordersData?.length || 0;
          const totalSpent =
            ordersData?.reduce(
              (sum: number, order: any) =>
                sum + parseFloat(order.total_amount || 0),
              0
            ) || 0;

          // Determine user segment
          let segment = "Regular";
          if (totalSpent > 50000) segment = "VIP";
          else if (totalOrders >= 5) segment = "Frequent";
          else if (totalOrders === 1) segment = "New";
          else if (totalOrders === 0) segment = "Inactive";

          // Determine status (active if ordered in last 30 days)
          const lastOrder = ordersData?.[0];
          const daysSinceLastOrder = lastOrder
            ? Math.floor(
                (Date.now() - new Date(lastOrder.created_at).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : 999;

          let status = "Active";
          if (daysSinceLastOrder > 30 || totalOrders === 0) status = "Inactive";

          return {
            id: user.id,
            name: user.name,
            email: `${user.name.toLowerCase().replace(" ", ".")}@example.com`,
            phone: user.phone_number,
            status,
            joinedDate: new Date(user.created_at).toLocaleDateString("en-IN"),
            totalOrders,
            totalSpent: Math.round(totalSpent),
            lastActive:
              daysSinceLastOrder === 0
                ? "Today"
                : daysSinceLastOrder === 1
                ? "1 day ago"
                : daysSinceLastOrder < 30
                ? `${daysSinceLastOrder} days ago`
                : "Inactive",
            addresses: (addressesData || []).map((addr: any) => ({
              id: addr.id,
              address: `${addr.house_floor}${
                addr.building_block ? ", " + addr.building_block : ""
              }${addr.landmark ? ", " + addr.landmark : ""}`,
              isDefault: addr.is_default,
            })),
            orderHistory: (ordersData || []).map((order: any) => ({
              id: order.order_number,
              service: "Service", // We'll need to fetch order items for actual service names
              amount: parseFloat(order.total_amount),
              date: new Date(order.scheduled_date).toLocaleDateString("en-IN"),
              status:
                order.status === "completed"
                  ? "Completed"
                  : order.status === "cancelled"
                  ? "Cancelled"
                  : order.status === "in_progress"
                  ? "In Progress"
                  : "Pending",
            })),
            segment,
          };
        })
      );

      setUsers(transformedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Dummy mock data for fallback (keep existing structure)
  const mockUsers = [
    {
      id: "1",
      name: "Rahul Sharma",
      email: "rahul@example.com",
      phone: "+91 9876543210",
      status: "Active",
      joinedDate: "2025-01-15",
      totalOrders: 12,
      totalSpent: 45000,
      lastActive: "2 hours ago",
      addresses: [
        { id: 1, address: "123, MG Road, Bangalore - 560001", isDefault: true },
        {
          id: 2,
          address: "456, Indiranagar, Bangalore - 560038",
          isDefault: false,
        },
      ],
      orderHistory: [
        {
          id: "ORD-1234",
          service: "AC Repair",
          amount: 2500,
          date: "2025-10-21",
          status: "Completed",
        },
        {
          id: "ORD-1180",
          service: "House Cleaning",
          amount: 3000,
          date: "2025-10-15",
          status: "Completed",
        },
      ],
      segment: "Frequent",
    },
    {
      id: "2",
      name: "Priya Gupta",
      email: "priya@example.com",
      phone: "+91 9876543211",
      status: "Active",
      joinedDate: "2025-02-20",
      totalOrders: 25,
      totalSpent: 98000,
      lastActive: "1 day ago",
      addresses: [
        {
          id: 1,
          address: "789, Park Street, Mumbai - 400001",
          isDefault: true,
        },
      ],
      orderHistory: [
        {
          id: "ORD-1233",
          service: "Plumbing",
          amount: 1500,
          date: "2025-10-20",
          status: "Completed",
        },
      ],
      segment: "VIP",
    },
    {
      id: "3",
      name: "Amit Patel",
      email: "amit@example.com",
      phone: "+91 9876543212",
      status: "Blocked",
      joinedDate: "2025-03-10",
      totalOrders: 3,
      totalSpent: 8500,
      lastActive: "1 week ago",
      addresses: [
        { id: 1, address: "321, Lake View, Delhi - 110001", isDefault: true },
      ],
      orderHistory: [
        {
          id: "ORD-1100",
          service: "Electrical Work",
          amount: 1800,
          date: "2025-09-15",
          status: "Completed",
        },
      ],
      segment: "Regular",
    },
    {
      id: "4",
      name: "Sneha Kumar",
      email: "sneha@example.com",
      phone: "+91 9876543213",
      status: "Active",
      joinedDate: "2025-10-01",
      totalOrders: 1,
      totalSpent: 1800,
      lastActive: "3 hours ago",
      addresses: [
        {
          id: 1,
          address: "654, Brigade Road, Bangalore - 560025",
          isDefault: true,
        },
      ],
      orderHistory: [
        {
          id: "ORD-1231",
          service: "Electrical Work",
          amount: 1800,
          date: "2025-10-21",
          status: "Completed",
        },
      ],
      segment: "New",
    },
    {
      id: "5",
      name: "Vikram Singh",
      email: "vikram@example.com",
      phone: "+91 9876543214",
      status: "Inactive",
      joinedDate: "2024-12-15",
      totalOrders: 8,
      totalSpent: 32000,
      lastActive: "45 days ago",
      addresses: [
        {
          id: 1,
          address: "987, Anna Nagar, Chennai - 600040",
          isDefault: true,
        },
      ],
      orderHistory: [
        {
          id: "ORD-980",
          service: "Painting",
          amount: 5000,
          date: "2025-08-10",
          status: "Completed",
        },
      ],
      segment: "Inactive",
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, "success" | "danger" | "default"> = {
      Active: "success",
      Blocked: "danger",
      Inactive: "default",
    };
    return <Badge variant={statusMap[status]}>{status}</Badge>;
  };

  const getSegmentBadge = (segment: string) => {
    const segmentMap: Record<
      string,
      "info" | "success" | "warning" | "default"
    > = {
      VIP: "success",
      Frequent: "info",
      New: "warning",
      Regular: "default",
      Inactive: "default",
    };
    return <Badge variant={segmentMap[segment]}>{segment}</Badge>;
  };

  const filteredUsers = users.filter((user) => {
    const matchesStatus =
      filterStatus === "all" || user.status.toLowerCase() === filterStatus;
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const handleViewDetails = (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleAction = (user: any) => {
    setSelectedUser(user);
    setActionModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage registered users and their activities
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
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {users.length}
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {users.filter((u) => u.status === "Active").length}
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">VIP Customers</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {users.filter((u) => u.segment === "VIP").length}
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
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactive Users</p>
              <p className="text-3xl font-bold text-gray-600 mt-1">
                {users.filter((u) => u.status === "Inactive").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-gray-600"
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

      {/* Filters and Search */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by name, email, or phone..."
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
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "blocked", label: "Blocked" },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  User
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Contact
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Joined Date
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Orders
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Total Spent
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Segment
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
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-500">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-gray-900">{user.phone}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {user.joinedDate}
                    </td>
                    <td className="py-3 px-4 text-gray-900 font-medium">
                      {user.totalOrders}
                    </td>
                    <td className="py-3 px-4 text-gray-900 font-medium">
                      ₹{user.totalSpent.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {getSegmentBadge(user.segment)}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(user.status)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(user)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleAction(user)}
                          className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                        >
                          Action
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* User Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="User Profile"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* User Info */}
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                {selectedUser.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedUser.name}
                </h2>
                <p className="text-gray-600">{selectedUser.email}</p>
                <p className="text-gray-600">{selectedUser.phone}</p>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge(selectedUser.status)}
                  {getSegmentBadge(selectedUser.segment)}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {selectedUser.totalOrders}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₹{selectedUser.totalSpent.toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Last Active</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {selectedUser.lastActive}
                </p>
              </div>
            </div>

            {/* Addresses */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Saved Addresses
              </h3>
              <div className="space-y-2">
                {selectedUser.addresses.map((addr: any) => (
                  <div
                    key={addr.id}
                    className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg"
                  >
                    <svg
                      className="w-5 h-5 text-gray-500 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-gray-900">{addr.address}</p>
                      {addr.isDefault && (
                        <Badge variant="info" size="sm">
                          Default
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order History */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Recent Order History
              </h3>
              <div className="space-y-3">
                {selectedUser.orderHistory.map((order: any) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{order.id}</p>
                      <p className="text-sm text-gray-600">{order.service}</p>
                      <p className="text-xs text-gray-500">{order.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        ₹{order.amount}
                      </p>
                      <Badge variant="success" size="sm">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Action Modal */}
      <Modal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        title="User Actions"
      >
        {selectedUser && (
          <div className="space-y-4">
            <p className="text-gray-700">
              Select an action for{" "}
              <span className="font-semibold">{selectedUser.name}</span>
            </p>
            <div className="space-y-2">
              {selectedUser.status === "Active" && (
                <Button className="w-full" variant="danger">
                  Block User
                </Button>
              )}
              {selectedUser.status === "Blocked" && (
                <Button className="w-full" variant="success">
                  Unblock User
                </Button>
              )}
              <Button className="w-full" variant="secondary">
                View Order History
              </Button>
              <Button className="w-full" variant="secondary">
                Send Notification
              </Button>
              <Button className="w-full" variant="danger">
                Delete Account
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
