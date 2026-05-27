# Production Go Backend - Setup Guide

## Quick Start

### 1. Build the Application
```bash
cd backend
make install-deps
make build
```

### 2. Run the Application
```bash
./bin/server
```

The server will start on `http://localhost:8080`

### 3. Test the APIs
```bash
# Make the test script executable
chmod +x test-api.sh

# Run tests
./test-api.sh
```

## Running with Docker

```bash
# Build and run
docker-compose up

# Run in background
docker-compose up -d

# Stop
docker-compose down
```

## API Quick Reference

### Signup
```bash
curl -X POST http://localhost:8080/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword"
  }'
```

### Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword"
  }'
```

### Get Profile (Protected)
```bash
curl -X GET http://localhost:8080/api/v1/auth/profile \
  -H "Authorization: Bearer <access_token>"
```

## Project Structure Overview

```
├── cmd/server/              - Entry point
├── internal/
│   ├── auth/                - Auth business logic
│   ├── config/              - Configuration
│   ├── handlers/            - HTTP handlers
│   ├── middleware/          - HTTP middleware
│   ├── models/              - Data structures
│   ├── server/              - Server setup
│   └── storage/             - Data persistence
├── pkg/
│   ├── jwt/                 - JWT utilities
│   └── utils/               - Helper functions
└── [config files]
```

## Key Features

- ✅ JWT-based authentication
- ✅ Bcrypt password hashing
- ✅ Local file-based storage (easy to migrate to DB)
- ✅ Input validation
- ✅ CORS support
- ✅ Graceful shutdown
- ✅ Production code structure

## Environment Variables

```env
HOST=localhost              # Server host
PORT=8080                   # Server port
JWT_SECRET=your-key         # JWT signing key (change in production!)
STORAGE_PATH=./data         # Local storage path
```

Copy `.env.example` to `.env` and update.

## Database Migration

When ready to use a database:

1. Create new storage implementation: `internal/storage/postgres_storage.go` (or MySQL, MongoDB, etc.)
2. Implement the same interface as `local_storage.go`
3. Update `internal/server/server.go` to initialize the new storage
4. Update `internal/config/config.go` with DB credentials
5. No auth logic changes needed!

## Common Commands

```bash
make build          # Compile the application
make run            # Build and run
make dev            # Run with hot reload (requires air)
make test           # Run tests
make fmt            # Format code
make lint           # Run linter
make clean          # Clean build artifacts
```

## Security Notes

- 🔒 Passwords hashed with bcrypt (cost 12)
- 🔒 JWT expiration: 24 hours (configurable)
- 🔒 CORS enabled (restrict origins in production)
- 🔒 Passwords never exposed in API responses
- ⚠️ Change JWT_SECRET in production!

## Default Credentials for Testing

None - create your own via signup endpoint

## Next Steps

1. ✅ Test the API with `test-api.sh`
2. ✅ Review code structure in README.md
3. ⏳ Choose your database and migrate storage
4. ⏳ Add more endpoints as needed
5. ⏳ Deploy to production (update security settings)
