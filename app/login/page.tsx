"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [totp, setTotp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: totp }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Authentication failed");
        setLoading(false);
        return;
      }

      // Store admin info in localStorage
      if (data.email && data.name) {
        localStorage.setItem("adminEmail", data.email);
        localStorage.setItem("adminName", data.name);
      }

      router.push("/dashboard");
    } catch (err) {
      setError("An error occurred during authentication");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Login with Email and TOTP</p>
        </div>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-6">
          <Input
            type="email"
            label="Email Address"
            placeholder="sanjithrozario@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="text"
            label="TOTP Code"
            placeholder="Enter 6-digit code"
            value={totp}
            onChange={(e) =>
              setTotp(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            maxLength={6}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Verifying..." : "Login"}
          </Button>
          <div className="mt-6 text-center">
            <a
              href="/totp-setup"
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors underline"
            >
              View TOTP Setup Instructions
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
