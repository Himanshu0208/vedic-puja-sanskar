# API pagination

Paginated endpoints accept standard query parameters `page` (1-based index) and `pageSize` (clamped between 1 and 100). Responses return the item collection with paging metadata: `total`, `page`, `pageSize`, and `totalPages`.

## Parameter defaults

| Endpoint | Default `pageSize` | Max `pageSize` | Supported filters |
|---|---|---|---|
| `GET /api/v1/products` | 12 | 100 | `search` (product/category name), `category` (exact) |
| `GET /api/v1/orders` | 10 | 100 | None (filtered to authenticated customer) |
| `GET /api/v1/admin/orders` | 25 | 100 | `search` (order ID or customer email), `status` (exact), `paymentStatus` (exact) |
| `GET /api/v1/admin/users` | 25 | 100 | `search` (email or full name) |

## Endpoints

### 1. Product catalog

```http
GET /api/v1/products?page=1&pageSize=12&search=rudraksha&category=Malas
```

**Response schema:**
```json
{
  "products": [ ... ],
  "total": 48,
  "page": 1,
  "pageSize": 12,
  "totalPages": 4
}
```

### 2. Customer orders

```http
GET /api/v1/orders?page=1&pageSize=10
```

**Response schema:**
```json
{
  "orders": [
    {
      "orderId": 101,
      "status": "DELIVERED",
      "paymentStatus": "success",
      "paymentMethod": "razorpay",
      "returnStatus": "",
      "totalAmount": 1499.00,
      "currency": "INR",
      "createdAt": "2026-09-28T10:00:00Z",
      "items": [
        {
          "productName": "5 Mukhi Rudraksha Mala",
          "imageURL": "/uploads/product_1.jpg",
          "quantity": 1,
          "unitPrice": 1499.00,
          "amount": 1499.00
        }
      ]
    }
  ],
  "total": 15,
  "page": 1,
  "pageSize": 10,
  "totalPages": 2
}
```

### 3. Admin orders

```http
GET /api/v1/admin/orders?page=1&pageSize=25&search=user@example.com&status=PLACED&paymentStatus=success
```

**Response schema:**
```json
{
  "orders": [
    {
      "orderId": 101,
      "customerEmail": "user@example.com",
      "status": "PLACED",
      "paymentStatus": "success",
      "paymentMethod": "razorpay",
      "totalAmount": 1499.00,
      "currency": "INR",
      "createdAt": "2026-09-28T10:00:00Z"
    }
  ],
  "total": 120,
  "page": 1,
  "pageSize": 25,
  "totalPages": 5
}
```

### 4. Admin users

```http
GET /api/v1/admin/users?page=1&pageSize=25&search=user@example.com
```

**Response schema:**
```json
{
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "role": "user",
      "createdAt": "2026-09-28T09:00:00Z",
      "orderCount": 3
    }
  ],
  "total": 350,
  "page": 1,
  "pageSize": 25,
  "totalPages": 14
}
```

### Order fulfilment status update

```http
PATCH /api/v1/admin/orders/{id}/status
Content-Type: application/json

{
  "status": "PROCESSING"
}
```

Valid statuses: `PENDING_PAYMENT`, `PLACED`, `PROCESSING`, `PACKED`, `SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`, `RTO`.

## Client compatibility

Frontend page components (`OrdersPage`, `AdminOrdersPage`, `AdminUsersPage`, `AdminProducts`, `Home`) handle both paginated JSON structures and unpaginated array fallbacks for backwards compatibility during server restarts.

## Frontend components

### 1. `PaginationNav` (`frontend/src/components/common/PaginationNav.tsx`)
- Unified accessible bottom pagination bar.
- Shows range summary (e.g. "Showing 1–12 of 48 items"), Previous/Next buttons, active page indicators, and page pills with ellipsis windowing.
- Used across:
  - My Orders (`frontend/src/app/orders/page.tsx`)
  - Admin Dashboard Recent Orders (`frontend/src/app/admin/dashboard/page.tsx`)
  - Admin Orders list (`frontend/src/app/admin/orders/page.tsx`)
  - Admin Users list (`frontend/src/app/admin/users/page.tsx`)
  - Admin Products list (`frontend/src/app/admin/products/page.tsx`)
  - Storefront Catalog (`frontend/src/app/page.tsx`)

### 2. `ProductCarousel` (`frontend/src/components/common/ProductCarousel.tsx`)
- Smooth horizontal swipe/scroll carousel with auto-play, pause on hover, previous/next controls, and slide indicator dots.
- Integrated on Home page (`frontend/src/app/page.tsx`) for featured sacred collections.
