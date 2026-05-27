# Vedic Puja Sanskar - Backend

A production-grade Go backend for the Vedic Puja Sanskar application with JWT-based authentication.

## Features

- ✅ User signup and login
- ✅ JWT token-based authentication
- ✅ Password hashing with bcrypt
- ✅ Local file-based storage (easily switchable to any database)
- ✅ Input validation
- ✅ CORS support
- ✅ Production-ready code structure

## Project Structure

```
├── cmd/
│   └── server/
│       └── main.go              # Application entry point
├── internal/
│   ├── config/                  # Configuration management
│   │   └── config.go
│   ├── auth/                    # Authentication service
│   │   └── service.go
│   ├── models/                  # Data models
│   │   └── user.go
│   ├── handlers/                # HTTP handlers
│   │   └── auth.go
│   ├── middleware/              # HTTP middleware
│   │   └── auth.go
│   ├── server/                  # Server initialization
│   │   └── server.go
│   └── storage/                 # Data storage layer
│       └── local_storage.go
├── pkg/
│   ├── jwt/                     # JWT utilities
│   │   └── token.go
│   └── utils/                   # Utility functions
│       ├── password.go
│       └── validator.go
├── go.mod                       # Go module definition
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore rules
├── Makefile                     # Build and run commands
└── README.md                    # This file
```

## Prerequisites

- Go 1.21 or higher
- Make (optional, for using Makefile commands)

## Setup

### 1. Clone and Install Dependencies

```bash
cd backend
make install-deps
# or
go mod download
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```env
HOST=localhost
PORT=8080
JWT_SECRET=your-super-secret-key
STORAGE_PATH=./data
```

### 3. Build the Application

```bash
make build
# or
go build -o bin/server ./cmd/server
```

### 4. Run the Application

```bash
make run
# or
./bin/server
```

The server will start on `http://localhost:8080`

## API Endpoints

### Public Endpoints

#### Signup
**POST** `/api/v1/auth/signup`

Request:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

Response (201 Created):
```json
{
  "id": "user_1234567890",
  "email": "user@example.com",
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 86400
}
```

#### Login
**POST** `/api/v1/auth/login`

Request:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

Response (200 OK):
```json
{
  "id": "user_1234567890",
  "email": "user@example.com",
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 86400
}
```

#### Health Check
**GET** `/api/v1/health`

Response (200 OK):
```json
{
  "status": "ok"
}
```

### Protected Endpoints

All protected endpoints require the `Authorization` header:
```
Authorization: Bearer <access_token>
```

#### Get User Profile
**GET** `/api/v1/auth/profile`

Response (200 OK):
```json
{
  "id": "user_1234567890",
  "email": "user@example.com"
}
```

## Error Handling

All error responses follow this format:

```json
{
  "error": "Unauthorized",
  "message": "invalid or expired token"
}
```

Common status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid credentials or token)
- `500` - Internal Server Error

## Development

### Run with Hot Reload

```bash
make dev
```

This requires `air` to be installed. It will automatically install it if not found.

### Format Code

```bash
make fmt
```

### Run Linter

```bash
make lint
```

This requires `golangci-lint` to be installed.

### Run Tests

```bash
make test
```

## Switching Database

Currently, the application uses local file-based storage. To switch to a database:

1. Create a new storage implementation in `internal/storage/` (e.g., `mysql_storage.go`)
2. Implement the storage interface used by `auth.Service`
3. Update `internal/server/server.go` to initialize the new storage
4. Update `internal/config/config.go` with database configuration

The `auth.Service` in `internal/auth/service.go` uses the storage interface, so no authentication logic needs to change.

## Password Requirements

- Minimum 6 characters
- Maximum 100 characters

## Email Validation

Follows standard email format validation.

## Security Considerations

- Passwords are hashed with bcrypt (cost factor: 12)
- JWT tokens have a default expiration of 24 hours
- Tokens are signed with HS256 algorithm
- Password is never exposed in API responses
- CORS is enabled with permissive defaults (should be restricted in production)

## Build for Production

```bash
# Build the binary
make build

# Or manually
go build -ldflags="-s -w" -o bin/server ./cmd/server
```

## Clean Up

```bash
make clean
```

This removes the build artifacts and data directory.

## Troubleshooting

### "address already in use"
The port 8080 is already in use. Either:
- Kill the process using that port
- Change the `PORT` environment variable

### "failed to create storage directory"
Ensure the application has write permissions in the directory where it's running.

### "invalid or expired token"
- Token may have expired (default: 24 hours)
- Token may be malformed
- Try logging in again to get a new token

## Future Enhancements

- [ ] Add database support (PostgreSQL, MongoDB, etc.)
- [ ] Add email verification
- [ ] Add password reset functionality
- [ ] Add refresh token mechanism
- [ ] Add rate limiting
- [ ] Add logging
- [ ] Add request/response middleware
- [ ] Add automated tests
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Add user profile update endpoint
- [ ] Add role-based access control (RBAC)

## License

MIT License
