# Redux Authentication Setup Documentation

## Overview
This document explains the Redux store setup for authentication in the Vedic Puja Sanskar frontend, including integration with the Go backend API.

## Architecture

### Redux Store Structure
```
store/
├── index.ts                    # Store configuration
└── slices/
    └── authSlice.ts            # Authentication reducer with async thunks
```

### Services
```
services/
└── authService.ts              # API communication layer with axios
```

### Components
```
components/
├── ReduxProvider.tsx           # Redux Provider wrapper
├── AuthModal.tsx               # Modal for login/signup
├── Login.tsx                   # Login component
└── Signup.tsx                  # Signup component
```

## Key Features

### 1. Redux Toolkit Setup (`store/index.ts`)
- Configures the Redux store with the auth reducer
- Uses Redux Toolkit's `configureStore` for simplified setup

### 2. Auth Slice (`store/slices/authSlice.ts`)
Contains the authentication state and async thunks:

**State Shape:**
```typescript
{
  user: User | null;           // Authenticated user info
  token: string | null;        // JWT access token
  isLoading: boolean;          // Loading state
  isAuthenticated: boolean;    // Auth status
  error: string | null;        // Error messages
}
```

**Async Thunks:**
- `signup(email, password)` - Register new user
- `login(email, password)` - Authenticate user
- `logout()` - Clear auth data

**Sync Actions:**
- `clearError()` - Clear error messages
- `clearAuth()` - Clear all auth data

### 3. Auth Service (`services/authService.ts`)
Singleton service for API communication:

**Features:**
- Axios instance with automatic token injection
- Request interceptor adds Authorization header
- Response interceptor handles 401 errors
- Methods: `signup()`, `login()`, `getProfile()`, `logout()`

**Persistence:**
- Auth token stored in localStorage as `authToken`
- User data stored in localStorage as `userData`
- Automatically restored on page reload

### 4. Components

#### AuthModal (`components/AuthModal.tsx`)
Modal dialog with tabbed interface:
- Login tab
- Sign Up tab
- Smooth tab switching
- Closes after successful auth

#### Login Component (`components/Login.tsx`)
- Email and password inputs
- Form validation
- Error display
- Loading state handling
- Switch to signup link

#### Signup Component (`components/Signup.tsx`)
- Email validation (format check)
- Password strength validation (min 6 chars)
- Confirm password matching
- Error handling
- Switch to login link

#### ReduxProvider (`components/ReduxProvider.tsx`)
Wraps the app with Redux Provider for state access

## Setup Instructions

### 1. Install Dependencies
```bash
cd frontend
npm install
```

New packages added:
- `@reduxjs/toolkit` - Redux state management
- `react-redux` - React bindings for Redux
- `axios` - HTTP client for API calls

### 2. Configure Backend URL
Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 3. Update Next.js Layout
The root layout is already wrapped with `ReduxProvider` component.

## Usage Examples

### Dispatching Login Action
```typescript
import { useDispatch, useSelector } from 'react-redux';
import { login } from '@/store/slices/authSlice';
import { RootState, AppDispatch } from '@/store';

function MyComponent() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading, error } = useSelector((state: RootState) => state.auth);

  const handleLogin = async (email: string, password: string) => {
    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) {
      // Login successful
    }
  };

  return (
    // Component JSX
  );
}
```

### Accessing Auth State
```typescript
const { user, token, isAuthenticated, isLoading, error } = useSelector(
  (state: RootState) => state.auth
);
```

### Logout
```typescript
dispatch(logout());
```

## API Endpoints

The frontend communicates with the Go backend:

| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | `/api/v1/auth/signup` | `{email, password}` | `{id, email, role, accessToken, tokenType, expiresIn}` |
| POST | `/api/v1/auth/login` | `{email, password}` | `{id, email, role, accessToken, tokenType, expiresIn}` |
| GET | `/api/v1/auth/profile` | Bearer token header | User profile data |

## Error Handling

### Auth Errors
- Email already exists
- Invalid credentials
- Validation errors (email format, password strength)

### Network Errors
- Connection refused
- CORS issues
- Server errors (5xx)

All errors are:
1. Caught by axios interceptors
2. Stored in Redux state (`error` field)
3. Displayed in error messages in components
4. User can retry or switch between login/signup

## Persistence & Hydration

### Persisted Data
- **localStorage.authToken** - JWT access token
- **localStorage.userData** - User object (id, email, role)

### Hydration Flow
1. Redux initializes with localStorage data (if available)
2. User state is restored on page reload
3. Protected components can access `isAuthenticated` flag

## Security Considerations

### Current Implementation
- JWT tokens stored in localStorage
- Authorization header set automatically via axios interceptor
- 401 responses clear auth data (logout on token expiration)
- HTTPS recommended for production

### Best Practices
- Keep JWT tokens short-lived (24 hours default)
- Implement refresh token rotation for long sessions
- Sanitize error messages (don't expose sensitive details)
- Use HTTPS in production
- Add CSRF protection for stateful operations
- Implement rate limiting on auth endpoints

## Common Issues & Solutions

### Issue: "401 Unauthorized" on protected routes
**Solution**: Token may be expired. Implement refresh token logic.

### Issue: State resets on page reload
**Solution**: Check localStorage for `authToken`. Redux initializes from it automatically.

### Issue: CORS errors
**Solution**: Ensure Go backend has CORS middleware enabled. Check [middleware/cors.go](../backend/internal/middleware/auth.go)

### Issue: Login works but page doesn't update
**Solution**: Ensure component is wrapped with `useSelector` to subscribe to state changes.

## Testing

### Manual Testing Flow
1. Open app at `http://localhost:3001`
2. Click "Login" button
3. Open AuthModal with login tab
4. Try with test email: `test@example.com`
5. Try password: `password123`
6. Check Redux DevTools for state changes
7. Verify token in localStorage
8. Refresh page to test persistence
9. Click logout to clear auth

### Testing Signup
1. Switch to "Sign Up" tab
2. Enter new email: `newemail@example.com`
3. Enter password: `securepass123`
4. Confirm password
5. Submit and verify auth state updates

## Redux DevTools

To use Redux DevTools browser extension:

1. Install Redux DevTools browser extension
2. Redux store is configured to work with it
3. Open DevTools and navigate to Redux tab
4. Inspect state changes and actions

## File Structure Summary

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx (✓ Redux Provider added)
│   │   ├── page.tsx (✓ Redux integration added)
│   │   └── globals.css
│   ├── components/
│   │   ├── ReduxProvider.tsx (✓ NEW)
│   │   ├── AuthModal.tsx (✓ NEW)
│   │   ├── Login.tsx (✓ NEW)
│   │   ├── Signup.tsx (✓ NEW)
│   │   ├── Header.tsx (✓ Updated with user info)
│   │   └── Footer.tsx
│   ├── services/
│   │   └── authService.ts (✓ NEW)
│   └── store/
│       ├── index.ts (✓ NEW)
│       └── slices/
│           └── authSlice.ts (✓ NEW)
├── .env.local (✓ NEW - API URL config)
├── package.json (✓ Updated with dependencies)
└── tsconfig.json
```

## Next Steps

1. **Run the backend**: `npm run dev` in backend directory
2. **Run the frontend**: `npm run dev` in frontend directory (port 3001)
3. **Test authentication flow**: Use Login/Signup modal
4. **Monitor Redux state**: Use Redux DevTools
5. **Implement additional features**:
   - Refresh token rotation
   - Password reset
   - Email verification
   - User profile page
   - Protected routes wrapper

## Resources

- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [React-Redux Hooks](https://react-redux.js.org/api/hooks)
- [Axios Documentation](https://axios-http.com/)
- [Next.js Best Practices](https://nextjs.org/docs)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)
