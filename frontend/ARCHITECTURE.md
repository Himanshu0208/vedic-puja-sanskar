# Redux & Backend Architecture Diagram

## 📊 Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERACTION LAYER                        │
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Header     │    │  AuthModal   │    │   HomePage   │      │
│  │              │    │              │    │              │      │
│  │ [Login]      │    │ ┌──────────┐ │    │ [Add to      │      │
│  │ [Logout]     │───▶│ │  Login   │ │    │  Cart]       │      │
│  │              │    │ │  Signup  │ │    │              │      │
│  │ Shows:       │    │ └──────────┘ │    │ Shows:       │      │
│  │ - User email │    │              │    │ - Welcome    │      │
│  │ - Auth state │    │ Outputs:     │    │   message    │      │
│  └──────┬───────┘    │ - email      │    │ - Login      │      │
│         │            │ - password   │    │   prompt     │      │
│         │            └──────────────┘    └──────────────┘      │
│         │                   │                     │              │
└─────────┼───────────────────┼─────────────────────┼──────────────┘
          │                   │                     │
          └─────────┬─────────┴─────────┬───────────┘
                    │                   │
                    ▼                   ▼
┌────────────────────────────────────────────────────────────────┐
│              REDUX STATE MANAGEMENT LAYER                       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Redux Store                                             │   │
│  │                                                         │   │
│  │ auth: {                                                │   │
│  │   user: {id, email, role},                            │   │
│  │   token: "jwt_token",                                 │   │
│  │   isAuthenticated: true,                              │   │
│  │   isLoading: false,                                   │   │
│  │   error: null                                         │   │
│  │ }                                                      │   │
│  └────────────────────────────────────────────────────────┘   │
│                          │                                      │
│  ┌──────────────────────┴──────────────────────────────┐      │
│  │       Dispatch Actions (Async Thunks)               │      │
│  │                                                      │      │
│  │ • login({email, password})                         │      │
│  │ • signup({email, password})                        │      │
│  │ • logout()                                         │      │
│  └──────────────────────────────────────────────────────┘      │
└────────────────┬───────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────────┐
│            API SERVICE & INTERCEPTOR LAYER                     │
│                                                                 │
│  ┌────────────────────────────────────────────────────┐      │
│  │ Axios Instance (authService.ts)                    │      │
│  │                                                    │      │
│  │ Request Interceptor:                              │      │
│  │ • Add "Authorization: Bearer <token>" header       │      │
│  │                                                    │      │
│  │ Response Interceptor:                             │      │
│  │ • Handle 401 errors (logout on expired token)    │      │
│  │                                                    │      │
│  │ Methods:                                          │      │
│  │ • signup(email, password)                        │      │
│  │ • login(email, password)                         │      │
│  │ • getProfile()                                   │      │
│  └────────────────────────────────────────────────────┘      │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────────┐
│              NETWORK & BACKEND API LAYER                       │
│                                                                 │
│  Frontend          │         │        Backend (Go)            │
│  (Port 3001)       │         │        (Port 8080)             │
│                    │         │                                │
│  ┌────────────────┐│         │ ┌──────────────────────────┐  │
│  │ POST /api/v1/  ││────────▶│ │ /api/v1/auth/login       │  │
│  │ auth/login     ││ Request │ │ + validate email/pwd     │  │
│  │ {email, pwd}   ││         │ │ + generate JWT token     │  │
│  └────────────────┘│◀────────│ └──────────────────────────┘  │
│  Response:         │ Response│ Response: {token, user}       │
│  {token, user}     │         │                                │
│                    │         │                                │
│  ┌────────────────┐│         │ ┌──────────────────────────┐  │
│  │ POST /api/v1/  ││────────▶│ │ /api/v1/auth/signup      │  │
│  │ auth/signup    ││ Request │ │ + validate input         │  │
│  │ {email, pwd}   ││         │ │ + hash password          │  │
│  └────────────────┘│◀────────│ │ + save to storage        │  │
│  Response:         │ Response│ │ + generate JWT token     │  │
│  {token, user}     │         │ └──────────────────────────┘  │
│                    │         │                                │
│  ┌────────────────┐│         │ ┌──────────────────────────┐  │
│  │ GET /api/v1/   ││────────▶│ │ /api/v1/auth/profile     │  │
│  │ auth/profile   ││ Request │ │ (Protected endpoint)     │  │
│  │ Headers:       ││ + Bearer │ │ + verify JWT token       │  │
│  │ Auth: Bearer   ││  Token   │ │ + extract user from     │  │
│  │ <token>        ││         │ │   token claims          │  │
│  └────────────────┘│◀────────│ └──────────────────────────┘  │
│  Response:         │ Response│ Response: {user data}         │
│  {user data}       │         │                                │
│                    │         │                                │
│  CORS Preflight:   │         │ CORS Middleware:             │
│  OPTIONS request   │────────▶│ Allow-Origin: *              │
│  ◀─────────────────│Response │ Allow-Methods: GET,POST...   │
│                    │         │ Allow-Headers: *             │
└────────────────────┴─────────┴──────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────────┐
│           DATA STORAGE & PERSISTENCE LAYER                     │
│                                                                 │
│  Frontend Storage:           Backend Storage:                 │
│  ┌──────────────────────┐   ┌──────────────────────────┐     │
│  │ localStorage         │   │ Local File Storage       │     │
│  │                      │   │                          │     │
│  │ • authToken          │   │ • users.json             │     │
│  │ • userData           │   │ • JWT validation         │     │
│  │                      │   │ • User credentials       │     │
│  │ Persists:            │   │                          │     │
│  │ • Page reload        │   │ Persists:                │     │
│  │ • Browser session    │   │ • Server restart         │     │
│  │                      │   │ • Multiple users         │     │
│  └──────────────────────┘   └──────────────────────────┘     │
└────────────────────────────────────────────────────────────────┘
```

## 🏗️ Component Hierarchy

```
RootLayout
│
├─ ReduxProvider
│  │
│  └─ Body
│     │
│     ├─ Header
│     │  ├─ Logo
│     │  ├─ Navigation Items
│     │  ├─ Search
│     │  ├─ Cart Button
│     │  └─ Auth Button (Connected to Redux)
│     │     │
│     │     └─ AuthModal (Opens on Auth Button Click)
│     │        ├─ Login Tab (Redux Thunk: login)
│     │        │  ├─ Email Input
│     │        │  ├─ Password Input
│     │        │  └─ Submit Button
│     │        │
│     │        └─ Signup Tab (Redux Thunk: signup)
│     │           ├─ Email Input
│     │           ├─ Password Input
│     │           ├─ Confirm Password Input
│     │           └─ Submit Button
│     │
│     ├─ Hero Section
│     │  └─ CTA Buttons
│     │
│     ├─ Products Section
│     │  └─ Product Cards
│     │     └─ Add to Cart Button
│     │        (Protected - Shows Modal if Not Logged In)
│     │
│     ├─ Features Section
│     │
│     ├─ Newsletter Section
│     │
│     └─ Footer
```

## 🔄 State Flow: Login Process

```
1. User clicks "Login" in Header
   ↓
2. AuthModal opens with Login tab
   ↓
3. User enters email & password, clicks "Login"
   ↓
4. Login component validates input
   ↓
5. Dispatch Redux thunk: login({email, password})
   ↓
6. Redux thunk calls authService.login()
   ↓
7. Axios makes POST to /api/v1/auth/login
   ↓
8. Request Interceptor adds Authorization header
   ↓
9. Backend validates credentials
   ↓
10. Backend returns {token, user, role}
    ↓
11. Response Interceptor processes response
    ↓
12. Redux updates state:
    - user = {id, email, role}
    - token = jwt_token
    - isAuthenticated = true
    - error = null
    ↓
13. Token & user saved to localStorage
    ↓
14. AuthModal closes
    ↓
15. Header re-renders showing user email
    ↓
16. Home page displays "Welcome" message
```

## 🔄 State Flow: Protected Action (Add to Cart)

```
User clicks "Add" button on product
    ↓
Component checks: isAuthenticated?
    ↓
    ├─ YES → Add to cart
    │        cartCount++
    │
    └─ NO → Dispatch action to open AuthModal
           ↓
           User logs in (see Login Process above)
           ↓
           Redux updates state
           ↓
           Component re-renders
           ↓
           User can now add to cart
```

## 📦 Dependencies

```
Frontend Dependencies:
├─ next: 16.2.6 (Framework)
├─ react: 19.2.4 (UI Library)
├─ react-redux: 8.1.3 (Redux React Bindings)
├─ @reduxjs/toolkit: 1.9.7 (Redux State Management)
└─ axios: 1.6.5 (HTTP Client)

Backend Dependencies:
├─ crypto/sha256 (Password hashing)
├─ jwt-go (JWT Token generation)
├─ net/http (HTTP Server)
└─ encoding/json (JSON serialization)
```

## 🔐 Security Flow

```
Frontend:
1. User enters password → 2. Form validation → 3. Send via HTTPS (in prod)
4. Redux stores token → 5. Axios adds to headers → 6. Only stored in memory + localStorage

Backend:
1. Receive credentials → 2. Extract email/password from JSON → 3. Find user in storage
4. Compare password with bcrypt hash → 5. If valid, generate JWT → 6. Return token
7. Token includes: {user_id, email, role, exp} → 8. Signed with secret key

Protected Routes:
1. Request includes Bearer token → 2. Middleware extracts token
3. Validate signature with secret → 4. Check expiration → 5. Extract claims
6. If valid, attach to context → 7. Allow request → 8. If invalid, return 401
```

## 💾 localStorage Structure

```javascript
// After successful login/signup:

localStorage = {
  authToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidXNlcl8xMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJleHAiOjE3MTk0NTAwMDB9.sig",
  userData: '{"id":"user_1234567890","email":"test@example.com","role":"user"}'
}

// On page reload, Redux initializes from localStorage:

Redux state = {
  auth: {
    user: {id: "user_1234567890", email: "test@example.com", role: "user"},
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    isAuthenticated: true,
    isLoading: false,
    error: null
  }
}
```

## 🧪 Testing Flow

```
Test Signup:
  1. Click Login → Switch to Sign Up tab
  2. Enter: test@example.com / password123 / password123
  3. Click Sign Up
  4. Verify: Header shows email, Welcome message appears
  5. Check localStorage for authToken

Test Login:
  1. Click Logout
  2. Click Login tab
  3. Enter: test@example.com / password123
  4. Click Login
  5. Verify: Same as signup - header & welcome message

Test Protected Action:
  1. Logout
  2. Try to "Add" product
  3. Should prompt login instead
  4. After login, can add to cart

Test Token Persistence:
  1. Login successfully
  2. Refresh page (F5)
  3. Header should still show email
  4. Verify no new login required
```

---

**Legend:**
- 🟦 Frontend Components (Next.js/React)
- 🟩 Redux/State Management
- 🟨 Backend API (Go)
- 🟪 Network/HTTP
- 🟧 Storage/Persistence
