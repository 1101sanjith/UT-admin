"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Loading } from "@/components/ui/Loading";

interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
  last_login: string | null;
}

export default function AdminPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Add Admin Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTOTPVerification, setShowTOTPVerification] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [superAdminTOTP, setSuperAdminTOTP] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);

  // Generated QR Code States
  const [generatedAdmin, setGeneratedAdmin] = useState<{
    email: string;
    name: string;
    qrCode: string;
    secret: string;
    currentToken: string;
  } | null>(null);

  useEffect(() => {
    fetchAdmins();

    // Auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchAdmins();
    }, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(refreshInterval);
  }, []);

  const fetchAdmins = async () => {
    try {
      // Don't show loading spinner on auto-refresh, only on initial load
      if (admins.length === 0) {
        setLoading(true);
      }
      const response = await fetch("/api/admins");
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to fetch admins");
        if (admins.length === 0) {
          setLoading(false);
        }
        return;
      }

      setAdmins(data.admins || []);
      setLoading(false);
    } catch (err) {
      setError("An error occurred while fetching admins");
      if (admins.length === 0) {
        setLoading(false);
      }
    }
  };

  const handleAddAdminClick = () => {
    setNewAdminEmail("");
    setNewAdminName("");
    setSuperAdminTOTP("");
    setError("");
    setSuccessMessage("");
    setShowAddModal(true);
  };

  const handleVerifyTOTP = async () => {
    if (!superAdminTOTP) {
      setError("Please enter TOTP code");
      return;
    }

    setError("");
    setAddingAdmin(true);

    try {
      // Verify super admin TOTP
      const verifyResponse = await fetch("/api/admins/verify-super-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totpCode: superAdminTOTP }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        setError(
          verifyData.error === "Invalid TOTP token"
            ? "Invalid OTP code. Please check your authenticator app and try again."
            : verifyData.error || "TOTP verification failed"
        );
        setAddingAdmin(false);
        return;
      }

      // TOTP verified, now add the admin
      await handleAddAdmin();
    } catch (err) {
      setError("An error occurred during verification");
      setAddingAdmin(false);
    }
  };

  const handleAddAdmin = async () => {
    try {
      // Generate TOTP for new admin
      const generateResponse = await fetch("/api/auth/generate-totp-for-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newAdminEmail }),
      });

      const generateData = await generateResponse.json();

      if (!generateResponse.ok) {
        setError(generateData.error || "Failed to generate TOTP");
        setAddingAdmin(false);
        return;
      }

      // Add admin to database
      const addResponse = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newAdminEmail,
          name: newAdminName || newAdminEmail.split("@")[0],
          totpSecret: generateData.secret,
          createdBy: "sanjithrozario@gmail.com",
        }),
      });

      const addData = await addResponse.json();

      if (!addResponse.ok) {
        setError(addData.error || "Failed to add admin");
        setAddingAdmin(false);
        return;
      }

      // Success! Show QR code
      setGeneratedAdmin({
        email: newAdminEmail,
        name: newAdminName || newAdminEmail.split("@")[0],
        qrCode: generateData.qrCode,
        secret: generateData.secret,
        currentToken: generateData.currentToken,
      });

      setShowTOTPVerification(false);
      setShowAddModal(false);
      setAddingAdmin(false);
      setSuperAdminTOTP("");
      setError("");

      // Show success message
      setSuccessMessage(
        `Admin ${newAdminName || newAdminEmail} has been successfully added!`
      );

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);

      // Refresh admin list
      fetchAdmins();
    } catch (err) {
      setError("An error occurred while adding admin");
      setAddingAdmin(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch("/api/admins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !currentStatus }),
      });

      if (response.ok) {
        fetchAdmins();
      }
    } catch (err) {
      console.error("Error toggling admin status:", err);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-accent to-brand-600 bg-clip-text text-transparent">
              Admin Management
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Manage admin users and their access
            </p>
          </div>
          <Button onClick={handleAddAdminClick}>+ Add New Admin</Button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-xl animate-pulse">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <p className="text-sm text-green-800 font-bold">
                {successMessage}
              </p>
            </div>
          </div>
        )}

        {/* Admin List */}
        <Card>
          <div className="p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
              All Admins
            </h2>

            {loading ? (
              <Loading text="Loading admins..." />
            ) : admins.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-400"
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
                <p className="text-gray-600">No admins found</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-3 md:px-4 text-xs font-bold text-gray-600 uppercase tracking-wide">
                          Name
                        </th>
                        <th className="text-left py-3 px-3 md:px-4 text-xs font-bold text-gray-600 uppercase tracking-wide">
                          Email
                        </th>
                        <th className="text-left py-3 px-3 md:px-4 text-xs font-bold text-gray-600 uppercase tracking-wide">
                          Role
                        </th>
                        <th className="text-left py-3 px-3 md:px-4 text-xs font-bold text-gray-600 uppercase tracking-wide">
                          Status
                        </th>
                        <th className="text-left py-3 px-3 md:px-4 text-xs font-bold text-gray-600 uppercase tracking-wide hidden md:table-cell">
                          Last Login
                        </th>
                        <th className="text-left py-3 px-3 md:px-4 text-xs font-bold text-gray-600 uppercase tracking-wide hidden lg:table-cell">
                          Created
                        </th>
                        <th className="text-left py-3 px-3 md:px-4 text-xs font-bold text-gray-600 uppercase tracking-wide">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((admin) => (
                        <tr
                          key={admin.id}
                          className="border-b border-gray-100 hover:bg-brand-50/30 transition-colors"
                        >
                          <td className="py-3 px-3 md:px-4 text-sm font-semibold text-gray-900">
                            {admin.name}
                          </td>
                          <td className="py-3 px-3 md:px-4 text-sm text-gray-700">
                            {admin.email}
                          </td>
                          <td className="py-3 px-3 md:px-4">
                            <span
                              className={`inline-flex px-2 md:px-3 py-1 text-xs font-bold rounded-full border ${
                                admin.role === "super_admin"
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : "bg-brand-100 text-brand-800 border-brand-300"
                              }`}
                            >
                              {admin.role === "super_admin"
                                ? "Super Admin"
                                : "Admin"}
                            </span>
                          </td>
                          <td className="py-3 px-3 md:px-4">
                            <span
                              className={`inline-flex px-2 md:px-3 py-1 text-xs font-bold rounded-full border ${
                                admin.is_active
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                              }`}
                            >
                              {admin.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="py-3 px-3 md:px-4 text-xs md:text-sm text-gray-600 hidden md:table-cell">
                            {formatDate(admin.last_login)}
                          </td>
                          <td className="py-3 px-3 md:px-4 text-xs md:text-sm text-gray-600 hidden lg:table-cell">
                            {formatDate(admin.created_at)}
                          </td>
                          <td className="py-3 px-3 md:px-4">
                            {admin.role !== "super_admin" && (
                              <button
                                onClick={() =>
                                  handleToggleStatus(admin.id, admin.is_active)
                                }
                                className={`text-xs md:text-sm font-bold transition-colors ${
                                  admin.is_active
                                    ? "text-red-600 hover:text-red-700"
                                    : "text-green-600 hover:text-green-700"
                                }`}
                              >
                                {admin.is_active ? "Deactivate" : "Activate"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Add Admin Modal */}
        {showAddModal && (
          <Modal
            isOpen={showAddModal}
            onClose={() => {
              setShowAddModal(false);
              setShowTOTPVerification(false);
              setError("");
            }}
            title="Add New Admin"
          >
            {!showTOTPVerification ? (
              <div className="space-y-4">
                <p className="text-gray-600 text-sm">
                  Enter the details of the new admin. You'll need to verify with
                  your TOTP code.
                </p>

                <Input
                  type="email"
                  label="Admin Email"
                  placeholder="newadmin@example.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  required
                />

                <Input
                  type="text"
                  label="Admin Name"
                  placeholder="John Doe"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                />

                <div className="flex gap-3 justify-end pt-4">
                  <Button
                    onClick={() => {
                      setShowAddModal(false);
                      setError("");
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (!newAdminEmail) {
                        setError("Please enter an email address");
                        return;
                      }
                      setShowTOTPVerification(true);
                    }}
                    disabled={!newAdminEmail}
                  >
                    Next: Verify TOTP
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-brand-50 border-2 border-brand-300 rounded-xl p-4">
                  <p className="text-sm text-accent font-bold">
                    Security Verification Required
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    Enter your TOTP code from Google Authenticator
                    (sanjithrozario@gmail.com) to add this admin.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 animate-pulse">
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-sm text-red-700 font-bold">{error}</p>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-700">
                    <strong>Email:</strong> {newAdminEmail}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>Name:</strong>{" "}
                    {newAdminName || newAdminEmail.split("@")[0]}
                  </p>
                </div>

                <div>
                  <Input
                    type="text"
                    label="Ask OTP from Sanjith Rozario"
                    placeholder="Enter 6-digit code"
                    value={superAdminTOTP}
                    onChange={(e) => {
                      setSuperAdminTOTP(
                        e.target.value.replace(/\D/g, "").slice(0, 6)
                      );
                      // Clear error when user starts typing
                      if (error) setError("");
                    }}
                    maxLength={6}
                    required
                    className={
                      error
                        ? "border-2 border-red-400 focus:border-red-500 focus:ring-red-400"
                        : ""
                    }
                  />
                  {superAdminTOTP.length > 0 && superAdminTOTP.length < 6 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {6 - superAdminTOTP.length} more digit(s) required
                    </p>
                  )}
                  {superAdminTOTP.length === 6 && (
                    <p className="text-xs text-green-600 mt-1 font-semibold">
                      Code complete - Ready to verify
                    </p>
                  )}
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button
                    onClick={() => {
                      setShowTOTPVerification(false);
                      setError("");
                    }}
                    variant="outline"
                    disabled={addingAdmin}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleVerifyTOTP}
                    disabled={addingAdmin || superAdminTOTP.length !== 6}
                  >
                    {addingAdmin ? "Verifying..." : "Verify & Add Admin"}
                  </Button>
                </div>
              </div>
            )}
          </Modal>
        )}

        {/* Show Generated QR Code */}
        {generatedAdmin && (
          <Modal
            isOpen={!!generatedAdmin}
            onClose={() => setGeneratedAdmin(null)}
            title="Admin Added Successfully"
          >
            <div className="space-y-6">
              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
                <p className="text-sm text-green-800 font-bold">
                  New admin has been created
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Share the QR code below with {generatedAdmin.name} to set up
                  their TOTP authentication.
                </p>
              </div>

              {/* Admin Info */}
              <div>
                <h4 className="text-md font-bold text-gray-900 mb-2">
                  Admin Details
                </h4>
                <div className="bg-gray-50 p-4 rounded-xl space-y-2 border border-gray-200">
                  <p className="text-sm text-gray-700">
                    <strong>Name:</strong> {generatedAdmin.name}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Email:</strong> {generatedAdmin.email}
                  </p>
                </div>
              </div>

              {/* QR Code */}
              <div>
                <h4 className="text-md font-bold text-gray-900 mb-2">
                  QR Code for TOTP Setup
                </h4>
                <div className="flex justify-center bg-white p-6 rounded-xl border-2 border-brand-200">
                  <img
                    src={generatedAdmin.qrCode}
                    alt="TOTP QR Code"
                    className="w-48 h-48 md:w-64 md:h-64"
                  />
                </div>
              </div>

              {/* Secret Key */}
              <div>
                <h4 className="text-md font-bold text-gray-900 mb-2">
                  Secret Key
                </h4>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <code className="text-sm font-mono text-accent break-all">
                    {generatedAdmin.secret}
                  </code>
                  <Button
                    onClick={() =>
                      copyToClipboard(generatedAdmin.secret, "Secret Key")
                    }
                    size="sm"
                    className="flex-shrink-0"
                  >
                    Copy
                  </Button>
                </div>
              </div>

              {/* Current TOTP */}
              <div>
                <h4 className="text-md font-bold text-gray-900 mb-2">
                  Current TOTP (for testing)
                </h4>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-green-50 p-4 rounded-xl border-2 border-green-300">
                  <code className="text-xl md:text-2xl font-bold font-mono text-green-700">
                    {generatedAdmin.currentToken}
                  </code>
                  <Button
                    onClick={() =>
                      copyToClipboard(generatedAdmin.currentToken, "TOTP")
                    }
                    size="sm"
                    className="flex-shrink-0"
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Note: This code changes every 30 seconds
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-brand-50 p-4 rounded-xl border-2 border-brand-200">
                <h4 className="text-md font-bold text-gray-900 mb-2">
                  Setup Instructions
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                  <li>Send the QR code to {generatedAdmin.name}</li>
                  <li>
                    They should install Google Authenticator on their phone
                  </li>
                  <li>Scan the QR code in the app</li>
                  <li>Login using email: {generatedAdmin.email}</li>
                  <li>Enter the 6-digit TOTP code from the app</li>
                </ol>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => setGeneratedAdmin(null)}>Done</Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
