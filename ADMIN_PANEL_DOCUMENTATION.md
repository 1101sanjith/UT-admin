# Admin Panel UI Documentation

## 🎯 Overview

A comprehensive admin panel UI built with **Next.js 14**, **TypeScript**, and **Tailwind CSS**. This is a frontend-only implementation without database or backend logic, featuring all essential admin functionalities with modern, responsive design.

## ✨ Features Implemented

### 1. Authentication & Access Control

- **TOTP using Email ID**
  - Email-based OTP login system
  - 6-digit OTP input with auto-focus
  - Resend OTP functionality
  - Responsive login page with gradient design

### 2. Dashboard Overview

- **Real-time Statistics Cards**
  - Total Orders, Revenue, Active Users
  - Completed Orders, Avg. Order Value, Cancellation Rate
  - Trend indicators (up/down arrows with percentages)
- **Visual Analytics**
  - Order Status Distribution (bar charts)
  - Revenue Overview (7-day chart)
  - Recent Orders Table
  - Top Services with performance metrics

### 3. Order Management

- **Order Dashboard Features**
  - Status-based filtering (All, Pending, Confirmed, In Progress, Completed, Cancelled)
  - Real-time search by order number, customer name, or phone
  - Status badge indicators with color coding
  - Quick statistics cards for each order status
- **Order Details View**
  - Complete order information in modal
  - Customer details (name, phone, email, address)
  - Service details and payment method
  - Visual order timeline with completion status
  - Cancel reason display for cancelled orders
- **Order Actions**
  - Confirm pending orders
  - Assign to service provider
  - Mark as "In Progress"
  - Mark as "Completed"
  - Cancel orders
  - Reschedule orders

### 4. User Management

- **Customer Database**
  - All users list with avatars
  - Search/filter by name, email, or phone
  - Filter by status (Active, Inactive, Blocked)
  - User segmentation badges (VIP, Frequent, New, Regular, Inactive)
- **Customer Profile View**
  - Personal information display
  - Statistics (Total Orders, Total Spent, Last Active)
  - Saved addresses with default indicator
  - Recent order history
- **Customer Actions**
  - Block/Unblock users
  - View order history
  - Send notifications
  - Delete account
- **Analytics**
  - Total Users
  - Active Users count
  - VIP Customers count
  - Inactive Users count

### 5. Service Management

- **Service Cards & Grid View**
  - Visual service cards with icons
  - Service description and pricing
  - Booking statistics and revenue
  - Average ratings with stars
  - Growth percentage indicators
  - Popularity progress bars
- **Service Analytics**
  - Most booked services
  - Service revenue breakdown
  - Service popularity trends
  - Average rating per service
  - Growth rate tracking
- **Service Details Modal**
  - Complete service information
  - Performance metrics
  - Pricing details
  - Activate/Deactivate controls

### 6. Payment & Financial Management

- **Payment Tracking**
  - All transactions list
  - Filter by payment method (Cash, Online)
  - Filter by status (Paid, Pending, Failed, Refunded)
  - Search by payment ID, order ID, customer, or transaction ID
- **Financial Dashboard**
  - Total Revenue with growth trends
  - Online vs Cash payment breakdown
  - Pending payments tracking
  - Payment method distribution charts
  - Payment status distribution
- **Payment Details**
  - Transaction information
  - Customer and service details
  - Payment gateway information
  - Refund initiation controls

### 7. Category Management

- **Category Overview**
  - Visual category cards with icons
  - Service count per category
  - Total bookings and revenue
  - Status indicators (Active/Inactive)
- **Category Analytics**
  - Total categories count
  - Active categories
  - Total services across categories
  - Total bookings aggregation
- **Category Details**
  - Services list in each category
  - Performance metrics
  - Edit and activate/deactivate controls

## 🎨 UI Components

### Reusable Components Created

1. **Button** - Multiple variants (primary, secondary, danger, success, outline)
2. **Input** - With label, error, and icon support
3. **Badge** - Status indicators with color variants
4. **Card** - Container with title, subtitle, and action support
5. **Modal** - Responsive modal with multiple sizes
6. **Table** - Data table with hover effects
7. **Select** - Dropdown with label and error support
8. **StatCard** - Statistics card with icon and trend indicators

## 📱 Responsive Design

- **Mobile-First Approach**
  - Collapsible sidebar on mobile
  - Touch-friendly buttons and inputs
  - Responsive grid layouts
  - Mobile-optimized tables with horizontal scroll
- **Breakpoints**
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px

## 🎯 Key Features

### Visual Design

- Modern gradient backgrounds
- Consistent color scheme (Blue/Purple primary)
- Shadow effects for depth
- Smooth transitions and animations
- Status-based color coding

### User Experience

- Auto-focus on OTP inputs
- Search with instant filtering
- Modal-based detail views
- Hover effects on interactive elements
- Loading states with spinners
- Empty state messages

### Data Visualization

- Progress bars for metrics
- Bar charts for revenue
- Percentage indicators
- Trend arrows (up/down)
- Color-coded status badges

## 🚀 Pages Structure

```
/login                    - Email OTP Login
/dashboard               - Main Dashboard with Analytics
/dashboard/orders        - Order Management
/dashboard/users         - User Management
/dashboard/services      - Service Management
/dashboard/payments      - Payment Management
/dashboard/categories    - Category Management
```

## 📊 Mock Data Included

All pages include comprehensive mock data for:

- Orders (with various statuses)
- Users (with different segments)
- Services (with analytics)
- Payments (with transaction details)
- Categories (with service counts)

## 🎨 Color Scheme

- **Primary**: Blue (600/700)
- **Secondary**: Purple (600/700)
- **Success**: Green (600/700)
- **Warning**: Yellow (600/700)
- **Danger**: Red (600/700)
- **Info**: Blue (500/600)
- **Neutral**: Gray (50-900)

## 🔧 Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **React Hooks** - useState, useEffect, useRouter

## 📝 Navigation

The sidebar includes:

- Dashboard (Overview)
- Orders
- Users
- Services
- Payments
- Categories

Each section is fully functional with mock data and interactive UI elements.

## 🎯 Key Interactions

1. **Login Flow**: Email → OTP → Dashboard
2. **Search & Filter**: Real-time filtering across all pages
3. **Modals**: Click "View" buttons to see detailed information
4. **Actions**: Action buttons open secondary modals with available operations
5. **Navigation**: Sidebar navigation with active state indicators

## 📦 File Structure

```
app/
├── login/
│   └── page.tsx              # Login with OTP
├── dashboard/
│   ├── layout.tsx            # Dashboard layout with sidebar
│   ├── page.tsx              # Main dashboard
│   ├── orders/
│   │   └── page.tsx          # Order management
│   ├── users/
│   │   └── page.tsx          # User management
│   ├── services/
│   │   └── page.tsx          # Service management
│   ├── payments/
│   │   └── page.tsx          # Payment management
│   └── categories/
│       └── page.tsx          # Category management
components/
└── ui/
    ├── Button.tsx            # Reusable button component
    ├── Input.tsx             # Input with label and icon
    ├── Badge.tsx             # Status badges
    ├── Card.tsx              # Card container
    ├── Modal.tsx             # Modal dialog
    ├── Table.tsx             # Data table
    ├── Select.tsx            # Dropdown select
    └── StatCard.tsx          # Statistics card
```

## 🚀 Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run development server:

   ```bash
   npm run dev
   ```

3. Open browser:

   ```
   http://localhost:3000
   ```

4. Login page will load first. Use any email to receive OTP (simulated).

## 🎨 Customization

All styling is done with inline Tailwind CSS classes. To customize:

- Colors: Update color classes throughout components
- Layout: Modify grid and flex classes
- Spacing: Adjust padding/margin classes
- Breakpoints: Change responsive prefixes (sm:, md:, lg:)

## ⚡ Performance

- Client-side rendering for interactive UI
- Optimized with React hooks
- Minimal re-renders with proper state management
- Fast filtering with JavaScript array methods

## 📱 Mobile Features

- Hamburger menu for sidebar
- Touch-optimized buttons and inputs
- Responsive tables with horizontal scroll
- Mobile-friendly modals
- Optimized font sizes

## 🎯 Future Enhancement Possibilities

When connecting to a real backend:

1. Replace mock data with API calls
2. Add authentication with JWT/sessions
3. Implement real-time updates with WebSockets
4. Add file upload for images
5. Integrate actual payment gateways
6. Add real charts library (Chart.js, Recharts)
7. Implement data export (CSV/PDF)
8. Add notification system

---

**Note**: This is a UI-only implementation. All data is mocked and actions are simulated. No actual database operations are performed.
