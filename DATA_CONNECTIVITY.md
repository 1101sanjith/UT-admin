# Data Connectivity Architecture

## Current Implementation

### Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│  (app/dashboard/services/page.tsx)                         │
│                                                             │
│  - User fills form                                          │
│  - Validates input                                          │
│  - Calls API via fetch()                                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ HTTP POST/PUT/DELETE/GET
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                     API Routes                              │
│  (app/api/services/route.ts)                               │
│                                                             │
│  - Validates request data                                   │
│  - Sanitizes input                                          │
│  - Filters empty arrays                                     │
│  - Calculates display_order                                 │
│  - Calls Supabase                                           │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Supabase Client API
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                   Supabase Database                         │
│                                                             │
│  Table: services                                            │
│  - id (UUID, Primary Key)                                   │
│  - name (TEXT)                                              │
│  - icon (TEXT)                                              │
│  - color (TEXT)                                             │
│  - price (NUMERIC)                                          │
│  - what_we_do (JSONB)                                       │
│  - what_we_dont (JSONB)                                     │
│  - how_its_done (JSONB)                                     │
│  - is_active (BOOLEAN)                                      │
│  - display_order (INTEGER)                                  │
│  - created_at (TIMESTAMP)                                   │
│  - updated_at (TIMESTAMP)                                   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Examples

### Creating a Service

#### 1. User Action

User fills the form and clicks "Create"

#### 2. Frontend Processing

```javascript
// app/dashboard/services/page.tsx
const cleanedData = {
  name: "Home Cleaning",
  icon: "🧹",
  color: "#4CAF50",
  price: 49,
  what_we_do: ["Dusting", "Mopping", "Vacuuming"],
  what_we_dont: ["Outdoor cleaning", "Laundry"],
  how_its_done: ["Book service", "Team arrives", "Cleaning", "Inspection"],
  is_active: true,
};

const response = await fetch("/api/services", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(cleanedData),
});
```

#### 3. API Route Processing

```javascript
// app/api/services/route.ts
export async function POST(request) {
  // 1. Parse request body
  const body = await request.json();

  // 2. Validate required fields
  if (!body.name || !body.icon || !body.price) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // 3. Calculate display_order
  const { data: maxOrderData } = await supabase
    .from("services")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1);

  const nextDisplayOrder = (maxOrderData?.[0]?.display_order || 0) + 1;

  // 4. Insert into database
  const { data, error } = await supabase
    .from("services")
    .insert({
      ...cleanedData,
      display_order: nextDisplayOrder,
    })
    .select();

  // 5. Return response
  return NextResponse.json({ data, success: true }, { status: 201 });
}
```

#### 4. Database Storage

```sql
INSERT INTO services (
  id, name, icon, color, price,
  what_we_do, what_we_dont, how_its_done,
  is_active, display_order
) VALUES (
  gen_random_uuid(),
  'Home Cleaning',
  '🧹',
  '#4CAF50',
  49.00,
  '["Dusting", "Mopping", "Vacuuming"]'::jsonb,
  '["Outdoor cleaning", "Laundry"]'::jsonb,
  '["Book service", "Team arrives", "Cleaning", "Inspection"]'::jsonb,
  true,
  1
);
```

#### 5. Response Back to Frontend

```json
{
  "data": [
    {
      "id": "uuid-here",
      "name": "Home Cleaning",
      "icon": "🧹",
      "color": "#4CAF50",
      "price": "49.00",
      "what_we_do": ["Dusting", "Mopping", "Vacuuming"],
      "what_we_dont": ["Outdoor cleaning", "Laundry"],
      "how_its_done": [
        "Book service",
        "Team arrives",
        "Cleaning",
        "Inspection"
      ],
      "is_active": true,
      "display_order": 1,
      "created_at": "2025-10-30T...",
      "updated_at": "2025-10-30T..."
    }
  ],
  "success": true,
  "message": "Service created successfully"
}
```

## API Endpoints Detail

### GET /api/services

**Purpose**: Fetch all services

**Request**:

```http
GET /api/services HTTP/1.1
```

**Response**:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Home Cleaning",
      "icon": "🧹",
      "color": "#4CAF50",
      "price": "49.00",
      "what_we_do": ["Dusting", "Mopping"],
      "what_we_dont": ["Laundry"],
      "how_its_done": ["Book", "Clean", "Done"],
      "is_active": true,
      "display_order": 1
    }
  ],
  "success": true
}
```

### POST /api/services

**Purpose**: Create new service

**Request**:

```http
POST /api/services HTTP/1.1
Content-Type: application/json

{
  "name": "Car Wash",
  "icon": "🚗",
  "color": "#2196F3",
  "price": 25,
  "what_we_do": ["Exterior wash", "Interior vacuum"],
  "what_we_dont": ["Engine wash"],
  "how_its_done": ["Arrive", "Wash", "Dry"],
  "is_active": true
}
```

**Response**:

```json
{
  "data": [
    {
      /* created service */
    }
  ],
  "success": true,
  "message": "Service created successfully"
}
```

### PUT /api/services

**Purpose**: Update existing service

**Request**:

```http
PUT /api/services HTTP/1.1
Content-Type: application/json

{
  "id": "service-uuid-here",
  "name": "Updated Name",
  "price": 59
}
```

**Response**:

```json
{
  "data": [
    {
      /* updated service */
    }
  ],
  "success": true,
  "message": "Service updated successfully"
}
```

### DELETE /api/services

**Purpose**: Delete service

**Request**:

```http
DELETE /api/services?id=service-uuid-here HTTP/1.1
```

**Response**:

```json
{
  "success": true,
  "message": "Service deleted successfully"
}
```

## Error Handling

### Validation Errors (400)

```json
{
  "error": "Missing required fields: name, icon, and price are required"
}
```

### Database Errors (500)

```json
{
  "error": "Failed to create service",
  "details": "relation 'services' does not exist",
  "hint": "Run the SQL to create the table",
  "code": "42P01"
}
```

### Permission Errors (500)

```json
{
  "error": "Failed to create service",
  "details": "permission denied for table services",
  "code": "42501"
}
```

## Environment Configuration

### Required Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

### Supabase Client Initialization

```typescript
// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## Security Considerations

### Current Setup (Development)

- All operations allowed via RLS policy
- No authentication required

### Production Recommendations

1. Add authentication
2. Restrict RLS policies:

```sql
-- Only authenticated users can insert/update/delete
CREATE POLICY "Authenticated users can manage services" ON services
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Everyone can read active services
CREATE POLICY "Public can view active services" ON services
  FOR SELECT
  USING (is_active = true);
```

## Testing the Connection

### Diagnostic Endpoint

```
GET /api/test-connection
```

Returns:

```json
{
  "timestamp": "2025-10-30T...",
  "environment": {
    "hasSupabaseUrl": true,
    "hasSupabaseKey": true
  },
  "connection": {
    "status": "connected"
  },
  "table": {
    "exists": true
  },
  "data": {
    "count": 2,
    "sample": [...]
  }
}
```

## Summary

✅ **Frontend** validates and sends clean data  
✅ **API Routes** handle business logic and database operations  
✅ **Supabase** stores data reliably with proper types  
✅ **Error handling** provides clear feedback  
✅ **Validation** ensures data integrity  
✅ **Auto-ordering** maintains service sequence

This architecture provides:

- Clear separation of concerns
- Easy debugging
- Scalability
- Type safety
- Error transparency
