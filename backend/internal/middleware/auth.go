package middleware

import (
	"context"
	"log/slog"
	"net"
	"net/http"
	"time"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/service"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/pkg/utils"
)

// AuthMiddleware checks for valid JWT token
func AuthMiddleware(authService *service.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			access_token, err := r.Cookie("access_token")
			if err != nil {
				utils.WriteError(w, http.StatusUnauthorized, "unauthorized from middleware")
				return
			}
			claims, err := authService.VerifyToken(access_token.Value)
			if err != nil {
				utils.WriteError(w, http.StatusUnauthorized, "invalid or expired token")
				return
			}

			// Add claims to context
			ctx := context.WithValue(r.Context(), "claims", claims)
			if identity, ok := ctx.Value(requestIdentityKey{}).(*requestIdentity); ok {
				identity.userID = claims.UserID
			}
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequestLoggingMiddleware records request metadata without logging query parameters or credentials.
func RequestLoggingMiddleware(next http.Handler, logger *slog.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started := time.Now()
		response := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		identity := &requestIdentity{userID: "anonymous"}
		ctx := context.WithValue(r.Context(), requestIdentityKey{}, identity)
		defer func() {
			if recovered := recover(); recovered != nil {
				response.status = http.StatusInternalServerError
				logRequest(logger, r, response.status, time.Since(started), identity, true)
				panic(recovered)
			}
			logRequest(logger, r, response.status, time.Since(started), identity, false)
		}()
		next.ServeHTTP(response, r.WithContext(ctx))
	})
}

func logRequest(logger *slog.Logger, r *http.Request, status int, duration time.Duration, identity *requestIdentity, panicked bool) {
	clientIP, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		clientIP = r.RemoteAddr
	}

	attrs := []any{
		"method", r.Method,
		"path", r.URL.Path,
		"status", status,
		"duration_ms", duration.Milliseconds(),
		"user_id", identity.userID,
		"client_ip", clientIP,
		"user_agent", r.UserAgent(),
	}
	switch {
	case panicked || status >= http.StatusInternalServerError:
		attrs = append(attrs, "panicked", panicked)
		logger.Error("http request", attrs...)
	case status >= http.StatusBadRequest:
		logger.Warn("http request", attrs...)
	default:
		logger.Info("http request", attrs...)
	}
}

type requestIdentityKey struct{}

type requestIdentity struct{ userID any }

type statusRecorder struct {
	http.ResponseWriter
	status      int
	wroteHeader bool
}

func (w *statusRecorder) WriteHeader(status int) {
	if w.wroteHeader {
		return
	}
	w.status = status
	w.wroteHeader = true
	w.ResponseWriter.WriteHeader(status)
}

func (w *statusRecorder) Write(body []byte) (int, error) {
	if !w.wroteHeader {
		w.WriteHeader(http.StatusOK)
	}
	return w.ResponseWriter.Write(body)
}

func (w *statusRecorder) Unwrap() http.ResponseWriter { return w.ResponseWriter }

// OptionalAuthMiddleware exposes read-only routes to guests while attaching claims for signed-in users.
func OptionalAuthMiddleware(authService *service.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			cookie, err := r.Cookie("access_token")
			if err != nil {
				next.ServeHTTP(w, r)
				return
			}
			claims, err := authService.VerifyToken(cookie.Value)
			if err != nil {
				utils.WriteError(w, http.StatusUnauthorized, "invalid or expired token")
				return
			}
			ctx := context.WithValue(r.Context(), "claims", claims)
			if identity, ok := ctx.Value(requestIdentityKey{}).(*requestIdentity); ok {
				identity.userID = claims.UserID
			}
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// CORS middleware handles CORS headers
func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3001")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// Helper function
// response helper moved to pkg/utils
