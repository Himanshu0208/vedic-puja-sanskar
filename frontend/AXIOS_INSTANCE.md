# Axios Instance - Reusable API Client

The axios instance has been extracted into a separate file so it can be reused across multiple service files.

## File Structure

```
src/services/
├── axiosInstance.ts    # Shared axios instance with interceptors
├── authService.ts      # Authentication API calls (uses axiosInstance)
└── [other-services]    # Other API services can also use axiosInstance
```

## What's in axiosInstance.ts

- **Base URL**: Configured from `NEXT_PUBLIC_API_URL` environment variable
- **Default Headers**: `Content-Type: application/json`
- **Request Interceptor**: Automatically adds JWT token to Authorization header
- **Response Interceptor**: Handles 401 errors and clears auth data on token expiration

## Usage Examples

### Example 1: Creating a Product Service

```typescript
// src/services/productService.ts
import axiosInstance from './axiosInstance';

class ProductService {
  async getAllProducts() {
    try {
      const response = await axiosInstance.get('/api/v1/products');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || error.message;
      throw new Error(message);
    }
  }

  async getProductById(id: string) {
    try {
      const response = await axiosInstance.get(`/api/v1/products/${id}`);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || error.message;
      throw new Error(message);
    }
  }

  async createProduct(productData: any) {
    try {
      const response = await axiosInstance.post('/api/v1/products/create', productData);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || error.message;
      throw new Error(message);
    }
  }

  async updateProduct(id: string, productData: any) {
    try {
      const response = await axiosInstance.put(`/api/v1/products/${id}`, productData);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || error.message;
      throw new Error(message);
    }
  }

  async deleteProduct(id: string) {
    try {
      const response = await axiosInstance.delete(`/api/v1/products/${id}`);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || error.message;
      throw new Error(message);
    }
  }
}

export const productService = new ProductService();
```

### Example 2: Creating an Order Service

```typescript
// src/services/orderService.ts
import axiosInstance from './axiosInstance';

class OrderService {
  async createOrder(orderData: any) {
    try {
      const response = await axiosInstance.post('/api/v1/orders', orderData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create order');
    }
  }

  async getOrders() {
    try {
      const response = await axiosInstance.get('/api/v1/orders');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch orders');
    }
  }

  async getOrderById(id: string) {
    try {
      const response = await axiosInstance.get(`/api/v1/orders/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch order');
    }
  }
}

export const orderService = new OrderService();
```

### Example 3: Using in Redux Thunks

```typescript
// src/store/slices/productSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productService } from '@/services/productService';

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      const products = await productService.getAllProducts();
      return products;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (productData: any, { rejectWithValue }) => {
    try {
      const product = await productService.createProduct(productData);
      return product;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    isLoading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export default productSlice.reducer;
```

## Features of axiosInstance

### ✅ Automatic Token Injection
Every request automatically includes the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### ✅ Automatic Token Refresh
When a 401 error occurs, the instance automatically:
1. Clears the stored token
2. Clears user data
3. Prevents infinite request loops

### ✅ Error Handling
All responses include error details:
```typescript
// Success
{
  status: 200,
  data: { ... }
}

// Error
{
  response: {
    status: 401,
    data: { error: 'Invalid token' }
  }
}
```

## How to Create a New Service

### Template

```typescript
import axiosInstance from './axiosInstance';

class YourService {
  async methodName(params: any) {
    try {
      const response = await axiosInstance.method('/api/endpoint', data);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || error.message;
      throw new Error(message);
    }
  }
}

export const yourService = new YourService();
```

### Available Methods

```typescript
// GET request
axiosInstance.get('/api/endpoint')

// POST request
axiosInstance.post('/api/endpoint', data)

// PUT request (full update)
axiosInstance.put('/api/endpoint', data)

// PATCH request (partial update)
axiosInstance.patch('/api/endpoint', data)

// DELETE request
axiosInstance.delete('/api/endpoint')
```

## Benefits

1. **DRY Principle**: Interceptors defined once, used everywhere
2. **Consistency**: All API calls follow same pattern
3. **Centralized Error Handling**: 401 errors handled in one place
4. **Type Safety**: TypeScript support with proper types
5. **Maintainability**: Easy to add new services
6. **Scalability**: Works with any number of services

## Configuration

Edit `src/services/axiosInstance.ts` to customize:

```typescript
// Change base URL
const backendUrl = 'your-api-url';

// Add custom headers
axiosInstance.defaults.headers.common['X-Custom-Header'] = 'value';

// Change timeout
axiosInstance.defaults.timeout = 30000; // 30 seconds

// Add custom interceptors
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    // Custom error handling
    return Promise.reject(error);
  }
);
```

## Best Practices

### ✅ Do This
```typescript
// Use the service approach
class ProductService {
  async getProducts() {
    const response = await axiosInstance.get('/api/products');
    return response.data;
  }
}
export const productService = new ProductService();
```

### ❌ Don't Do This
```typescript
// Don't create axios instances in components
import axios from 'axios';
const api = axios.create(...); // ❌ Creates duplicate instance
```

### ✅ Export Singleton
```typescript
// Create once and export
export const productService = new ProductService();
// Then import and use everywhere
import { productService } from '@/services/productService';
```

## Testing

When testing services, you can mock the axiosInstance:

```typescript
jest.mock('@/services/axiosInstance', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import axiosInstance from '@/services/axiosInstance';

test('getProducts', async () => {
  axiosInstance.get.mockResolvedValue({
    data: [{ id: 1, name: 'Product' }],
  });

  const result = await productService.getAllProducts();
  expect(result).toEqual([{ id: 1, name: 'Product' }]);
});
```

## File Organization

```
src/
├── services/
│   ├── axiosInstance.ts      # Core axios configuration
│   ├── authService.ts        # Authentication
│   ├── productService.ts     # Products (example)
│   ├── orderService.ts       # Orders (example)
│   └── userService.ts        # User profile (example)
├── store/
│   └── slices/
│       ├── authSlice.ts
│       ├── productSlice.ts
│       └── orderSlice.ts
└── components/
```

## Common Endpoints Pattern

```typescript
// API V1 endpoints typically follow REST conventions:
GET    /api/v1/products           # Get all
POST   /api/v1/products           # Create new
GET    /api/v1/products/:id       # Get one
PUT    /api/v1/products/:id       # Update (full)
PATCH  /api/v1/products/:id       # Update (partial)
DELETE /api/v1/products/:id       # Delete

// Protected routes add auth headers automatically
GET    /api/v1/auth/profile       # Requires token (added by interceptor)
POST   /api/v1/orders             # Requires token
```

## Next Steps

1. Review existing `authService.ts` for implementation patterns
2. Create new services for products, orders, users, etc.
3. Create Redux slices that use the new services
4. Use services in components via Redux thunks
5. Test services with mock data

---

**Status**: ✅ Ready to Use
**Location**: `src/services/axiosInstance.ts`
**Dependencies**: axios, localStorage (browser API)
**Last Updated**: May 2026
