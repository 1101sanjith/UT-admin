# TOTP Google Authentication Setup Guide

This application now uses **TOTP (Time-based One-Time Password)** authentication with Google Authenticator for secure admin panel access.

## 🔐 Authentication Details

- **Email**: sanjithrozario@gmail.com
- **Method**: TOTP (Google Authenticator compatible)

## 📋 Quick Setup

### 1. Install Dependencies

```bash
npm install speakeasy qrcode
npm install --save-dev @types/speakeasy @types/qrcode
```

### 2. Generate TOTP Secret (One Time)

```bash
node -e "console.log(require('speakeasy').generateSecret({length: 32}).base32)"
```

Copy the generated secret and update it in `lib/totp.ts`:

```typescript
export const TOTP_SECRET = "YOUR_GENERATED_SECRET_HERE";
```

### 3. View Setup Information

```bash
npm run dev
```

Navigate to: http://localhost:3000/totp-setup

This page displays:

- ✅ Email address
- ✅ QR code for scanning
- ✅ Secret key for manual entry
- ✅ Current TOTP code (updates every 30 seconds)

### 4. Setup Google Authenticator

**Option A: Scan QR Code**

1. Open Google Authenticator app on your phone
2. Tap "+" or "Add account"
3. Select "Scan QR code"
4. Scan the QR code from `/totp-setup` page

**Option B: Manual Entry**

1. Open Google Authenticator app
2. Tap "+" or "Add account"
3. Select "Enter a setup key"
4. Enter:
   - Account: UT-Admin (sanjithrozario@gmail.com)
   - Key: [Copy from `/totp-setup` page]
   - Type: Time-based

### 5. Login

1. Go to http://localhost:3000/login
2. Enter email: `sanjithrozario@gmail.com`
3. Enter the 6-digit code from your Google Authenticator app
4. Click "Login"

## 🔧 Files Created/Modified

### New Files:

- `lib/totp.ts` - TOTP utility functions
- `app/api/auth/verify-totp/route.ts` - TOTP verification API
- `app/api/auth/totp-setup/route.ts` - Setup information API
- `app/totp-setup/page.tsx` - Setup page with QR code
- `.env.example` - Environment variables template

### Modified Files:

- `app/login/page.tsx` - Updated to use TOTP authentication
- `package.json` - Added speakeasy and qrcode dependencies

## 🌐 API Endpoints

### POST /api/auth/verify-totp

Verifies TOTP token for authentication.

**Request:**

```json
{
  "email": "sanjithrozario@gmail.com",
  "token": "123456"
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Authentication successful",
  "email": "sanjithrozario@gmail.com"
}
```

**Response (Error):**

```json
{
  "error": "Invalid TOTP token"
}
```

### GET /api/auth/totp-setup

Returns TOTP setup information including QR code.

**Response:**

```json
{
  "email": "sanjithrozario@gmail.com",
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,...",
  "currentToken": "123456",
  "manualEntryKey": "JBSW Y3DP EHPK 3PXP"
}
```

## 💻 Command Line TOTP Generation

### Install CLI Tool:

```bash
npm install -g speakeasy-cli
```

### Generate Current TOTP:

```bash
speakeasy -s JBSWY3DPEHPK3PXP
```

### Using Node.js:

```javascript
const speakeasy = require("speakeasy");
const token = speakeasy.totp({
  secret: "JBSWY3DPEHPK3PXP",
  encoding: "base32",
});
console.log("Current TOTP:", token);
```

## 🔄 How TOTP Works

1. **Secret Key**: A shared secret between server and authenticator app
2. **Time-based**: Generates new code every 30 seconds
3. **Algorithm**: Uses HMAC-SHA1 with current timestamp
4. **Synchronization**: Both server and app use the same time-based algorithm
5. **Window**: Server accepts codes from ±60 seconds (2 time steps) for clock skew

## 🛡️ Security Best Practices

1. **Never expose the secret key** - Keep it in environment variables
2. **Use HTTPS** in production
3. **Rotate secrets** periodically
4. **Enable rate limiting** on verification endpoint
5. **Log failed attempts** for security monitoring
6. **Implement session management** after successful authentication

## 📱 Compatible Authenticator Apps

- Google Authenticator
- Microsoft Authenticator
- Authy
- 1Password
- LastPass Authenticator
- Any RFC 6238 compatible TOTP app

## 🧪 Testing

### Test with Current Token:

Visit `/totp-setup` to see the current valid TOTP code.

### Test Login Flow:

1. Open `/totp-setup` in one tab
2. Open `/login` in another tab
3. Copy the current TOTP code from setup page
4. Enter email and TOTP code in login page
5. Verify successful authentication

## ⚙️ Environment Variables

Create a `.env.local` file:

```bash
# TOTP Configuration
TOTP_SECRET=JBSWY3DPEHPK3PXP

# Supabase (if using)
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

## 🐛 Troubleshooting

### "Invalid TOTP token" Error:

- Check your phone's time is synchronized
- Ensure secret key matches in app and server
- TOTP codes expire every 30 seconds - use fresh code
- Verify email matches exactly

### QR Code Not Displaying:

- Check browser console for errors
- Ensure qrcode package is installed
- Verify API endpoint is accessible

### Time Sync Issues:

- Enable automatic time on your phone
- Server and phone should have accurate time
- TOTP allows ±60 second window for clock skew

## 📞 Support

For issues or questions, contact: sanjithrozario@gmail.com

## 📜 License

This authentication system is part of the UT-Admin project.
