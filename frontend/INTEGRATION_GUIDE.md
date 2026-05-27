# Integration Guide: Frontend Redux + Go Backend

## Quick Start

### Prerequisites
- Node.js and npm installed
- Go 1.19+ installed
- Backend running on `http://localhost:8080`
- Frontend running on `http://localhost:3001`

### 1. Start the Backend

```bash
cd backend

# Install dependencies (if not done)
go mod download

# Run the backend
make start
# OR
go run cmd/server/main.go
```

Expected output:
```
Starting server on localhost:8080
```

### 2. Start the Frontend

```bash
cd frontend

# Install dependencies (if not done)
npm install

# Run development server
npm run dev
```

Expected output:
```
▲ Next.js 16.2.6
- Local: http://localhost:3001
```

### 3. Test Authentication Flow

#### Signup
1. Open `http://localhost:3001` in browser
2. Click "Login" button in header
3. Click "Sign Up" tab in modal
4. Fill in:
   - Email: `testuser@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
5. Click "Sign Up" button
6. Should redirect to home and show "Welcome testuser@example.com"

#### Login
1. After signup, click logout
2. Click "Login" button
3. Fill in same credentials
4. Click "Login" button
5. Should authenticate and show user email

#### Protected Actions
1. When logged in, clicking "Add" on products should work
2. When logged out, clicking "Add" should prompt login

## Backend Configuration

### Default Admin User
The backend creates a default admin on startup:
- Email: `admin@vedic-puja.com`
- Password: Check `internal/auth/service.go` for default password

### JWT Configuration
Edit `.env` or set environment variables:
```bash
JWT_SECRET=your-secret-key-change-in-production
PORT=8080
HOST=localhost
STORAGE_PATH=./data
```

### CORS Setup
Backend has CORS middleware enabled in `internal/middleware/cors.go`
- Allows requests from `http://localhost:3001`
- Allows credentials (for future cookie-based auth)

## Frontend Configuration

### Environment Variables
Create `.env.local` in frontend root:
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

This is already configured, but you can modify for:
- **Development**: `http://localhost:8080`
- **Production**: `https://api.yourdomain.com`

## API Requests Flow

```
User Input (Login Form)
    ↓
React Component (Login.tsx)
    ↓
Redux Thunk (authSlice.ts)
    ↓
Axios Service (authService.ts)
    ↓
Backend API (/api/v1/auth/login)
    ↓
Response → Redux Store → UI Update
```

## Redux State Example

### After Successful Login:
```json
{
  "auth": {
    "user": {
      "id": "user_1234567890",
      "email": "testuser@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "isAuthenticated": true,
    "isLoading": false,
    "error": null
  }
}
```

### After Logout:
```json
{
  "auth": {
    "user": null,
    "token": null,
    "isAuthenticated": false,
    "isLoading": false,
    "error": null
  }
}
```

## Network Requests

### Login Request
```http
POST /api/v1/auth/login HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "email": "testuser@example.com",
  "password": "password123"
}
```

### Login Response (Success)
```json
{
  "id": "user_1234567890",
  "email": "testuser@example.com",
  "role": "user",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 86400
}
```

### Login Response (Error)
```json
{
  "error": "invalid credentials"
}
```

## Debugging

### Check Browser Console
- Redux state updates
- Network request errors
- Component rendering issues

### Check Redux DevTools
1. Install [Redux DevTools Extension](https://chrome.google.com/webstore/detail/redux-devtools/lmjabbelojblfmlpfbbgejnfipjbkhia)
2. Open DevTools → Redux tab
3. Inspect state and actions

### Check Backend Logs
- Look for request logs in terminal running backend
- Check for authentication errors
- Verify token validation

### Network Tab
1. Open Browser DevTools → Network tab
2. Try login
3. Check request/response for:
   - Status: 200 (success) or 401 (error)
   - Headers: Authorization, Content-Type
   - Response: Token and user data

## Troubleshooting

### Issue: "Network request failed"
**Cause**: Backend not running or wrong URL
**Solution**: 
1. Verify backend is running on port 8080
2. Check `.env.local` has correct `NEXT_PUBLIC_API_URL`
3. Check backend logs for errors

### Issue: "CORS error"
**Cause**: Frontend and backend have different origins
**Solution**:
1. Ensure backend CORS middleware allows `http://localhost:3001`
2. Check backend `internal/middleware/cors.go`
3. Backend should respond with `Access-Control-Allow-*` headers

### Issue: "Invalid credentials"
**Cause**: Wrong email or password
**Solution**:
1. Ensure email and password are correct
2. Try signup with new email first
3. Check backend data storage at `./data/users.json`

### Issue: Token not persisted
**Cause**: localStorage not working
**Solution**:
1. Check browser localStorage in DevTools
2. Verify `localStorage.authToken` is set after login
3. Check for browser privacy mode restrictions

### Issue: "User already exists"
**Cause**: Email used before
**Solution**:
1. Use different email for signup
2. Or login with existing credentials
3. Check `./data/users.json` for existing users

## Production Deployment

### Frontend Changes
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Backend Changes
```env
JWT_SECRET=your-strong-production-secret
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

### Security Checklist
- [ ] Use HTTPS for both frontend and backend
- [ ] Change JWT_SECRET to strong random value
- [ ] Enable HTTPS-only cookies (if implemented)
- [ ] Implement rate limiting on auth endpoints
- [ ] Add request validation and sanitization
- [ ] Enable CORS only for your domain
- [ ] Keep tokens short-lived (24 hours)
- [ ] Implement refresh token rotation
- [ ] Add comprehensive logging
- [ ] Monitor authentication failures

## Next Features to Implement

1. **Refresh Token**
   - Implement refresh token endpoint in backend
   - Auto-refresh token before expiration in frontend

2. **Protected Routes**
   - Create `withAuth` HOC for protected pages
   - Redirect to login if not authenticated

3. **User Profile**
   - Create `/profile` page
   - Display user information
   - Allow profile updates

4. **Password Reset**
   - Add forgot password flow
   - Email verification
   - Reset token handling

5. **Error Boundaries**
   - Add error boundary component
   - Better error handling UI

6. **Loading Skeletons**
   - Show loading state while authenticating
   - Improve UX during network requests

## File Changes Summary

### New Files Created
- `src/store/index.ts` - Redux store setup
- `src/store/slices/authSlice.ts` - Auth reducer & thunks
- `src/services/authService.ts` - API service
- `src/components/ReduxProvider.tsx` - Redux provider wrapper
- `src/components/AuthModal.tsx` - Auth modal dialog
- `src/components/Login.tsx` - Login form
- `src/components/Signup.tsx` - Signup form
- `.env.local` - Environment configuration
- `REDUX_SETUP.md` - Redux documentation
- `INTEGRATION_GUIDE.md` - This file

### Modified Files
- `package.json` - Added Redux dependencies
- `src/app/layout.tsx` - Added ReduxProvider
- `src/app/page.tsx` - Redux integration
- `src/components/Header.tsx` - User info display

## Commands Reference

### Frontend
```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run linter
```

### Backend
```bash
go mod download    # Download dependencies
go run cmd/server/main.go    # Run server
make start         # Using Makefile
make test          # Run tests
make build         # Build binary
```

## Support & Debugging

For issues or questions:
1. Check browser console for errors
2. Verify backend is running
3. Check network requests in DevTools
4. Review Redux state in Redux DevTools
5. Check backend logs for errors
6. Refer to [REDUX_SETUP.md](./REDUX_SETUP.md) for detailed documentation
