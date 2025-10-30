"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface TOTPSetupInfo {
  email: string;
  secret: string;
  qrCode: string;
  currentToken: string;
  manualEntryKey: string;
}

export default function TOTPSetupPage() {
  const [setupInfo, setSetupInfo] = useState<TOTPSetupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSetupInfo();
  }, []);

  const fetchSetupInfo = async () => {
    try {
      const response = await fetch("/api/auth/totp-setup");
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to load setup information");
        setLoading(false);
        return;
      }

      setSetupInfo(data);
      setLoading(false);
    } catch (err) {
      setError("An error occurred while loading setup information");
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !setupInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <p className="text-red-600">
            {error || "No setup information available"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            TOTP Authentication Setup
          </h1>

          <div className="space-y-6">
            {/* Email */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  📧 Email Address
                </h2>
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                  <code className="text-lg font-mono text-blue-600">
                    {setupInfo.email}
                  </code>
                  <Button
                    onClick={() => copyToClipboard(setupInfo.email, "Email")}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </Card>

            {/* QR Code */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  📱 QR Code
                </h2>
                <p className="text-gray-600 mb-4">
                  Scan this QR code with Google Authenticator or any TOTP app
                </p>
                <div className="flex justify-center bg-white p-4 rounded-lg border-2 border-gray-200">
                  <img
                    src={setupInfo.qrCode}
                    alt="TOTP QR Code"
                    className="w-64 h-64"
                  />
                </div>
              </div>
            </Card>

            {/* Secret Key */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  🔑 Secret Key
                </h2>
                <p className="text-gray-600 mb-4">
                  Manual entry key for authenticator apps
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <code className="text-sm font-mono text-blue-600">
                      {setupInfo.manualEntryKey}
                    </code>
                    <Button
                      onClick={() =>
                        copyToClipboard(setupInfo.secret, "Secret Key")
                      }
                    >
                      Copy
                    </Button>
                  </div>
                  <div className="flex items-center justify-between bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <code className="text-xs font-mono text-gray-700">
                      Raw: {setupInfo.secret}
                    </code>
                    <Button
                      onClick={() =>
                        copyToClipboard(setupInfo.secret, "Raw Secret")
                      }
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Current TOTP */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  🔢 Current TOTP Code
                </h2>
                <p className="text-gray-600 mb-4">
                  Use this 6-digit code to test your setup (refreshes every 30
                  seconds)
                </p>
                <div className="flex items-center justify-between bg-green-50 p-6 rounded-lg border-2 border-green-200">
                  <code className="text-3xl font-bold font-mono text-green-600 tracking-wider">
                    {setupInfo.currentToken}
                  </code>
                  <Button
                    onClick={() =>
                      copyToClipboard(setupInfo.currentToken, "TOTP Code")
                    }
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  ⚠️ This code changes every 30 seconds
                </p>
              </div>
            </Card>

            {/* Instructions */}
            <Card>
              <div className="p-6 bg-blue-50">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  📖 Setup Instructions
                </h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>
                    Install Google Authenticator or any TOTP app on your phone
                  </li>
                  <li>
                    Scan the QR code above OR manually enter the secret key
                  </li>
                  <li>The app will generate a 6-digit code every 30 seconds</li>
                  <li>
                    Go to the login page and enter your email:{" "}
                    <strong>{setupInfo.email}</strong>
                  </li>
                  <li>
                    Enter the 6-digit TOTP code from your authenticator app
                  </li>
                  <li>Click "Login" to access the admin panel</li>
                </ol>
              </div>
            </Card>

            {/* Test Command */}
            <Card>
              <div className="p-6 bg-gray-900 text-white">
                <h2 className="text-xl font-semibold mb-3">
                  💻 Command Line TOTP Generation
                </h2>
                <p className="text-gray-300 mb-4">
                  You can also generate TOTP codes using command line:
                </p>
                <div className="bg-black p-4 rounded-lg mb-4">
                  <code className="text-green-400 text-sm">
                    npm install -g speakeasy-cli
                    <br />
                    speakeasy -s {setupInfo.secret}
                  </code>
                </div>
                <p className="text-xs text-gray-400">
                  This will output the current TOTP code
                </p>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center pt-4">
              <Button
                onClick={() => (window.location.href = "/login")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Go to Login
              </Button>
              <Button
                onClick={fetchSetupInfo}
                className="bg-gray-600 hover:bg-gray-700"
              >
                Refresh TOTP Code
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
