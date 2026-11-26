package middleware

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const (
	UserIDKey   contextKey = "user_id"
	UserRoleKey contextKey = "user_role"
)

type AuthGuard struct {
	JWTSecret      string
	SupabaseURL    string
	ServiceRoleKey string
}

func (g *AuthGuard) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, `{"error":"token tidak ditemukan"}`, http.StatusUnauthorized)
			return
		}
		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("metode signing tidak didukung: %v", t.Header["alg"])
			}
			return []byte(g.JWTSecret), nil
		})

		var userID string
		if err == nil && token != nil && token.Valid {
			if claims, ok := token.Claims.(jwt.MapClaims); ok {
				userID, _ = claims["sub"].(string)
			}
		}

		// Fallback ke Supabase Auth (/auth/v1/user) jika token memakai ES256/RS256 (JWKS) atau JWT secret berbeda
		if userID == "" {
			uid, vErr := g.verifyTokenViaSupabase(r.Context(), tokenStr)
			if vErr != nil || uid == "" {
				http.Error(w, `{"error":"sesi tidak valid"}`, http.StatusUnauthorized)
				return
			}
			userID = uid
		}

		// Ambil role asli langsung dari tabel profiles memakai Service Role Key
		role, err := g.fetchProfileRole(r.Context(), userID)
		if err != nil {
			http.Error(w, `{"error":"gagal memverifikasi role akun"}`, http.StatusForbidden)
			return
		}

		ctx := context.WithValue(r.Context(), UserIDKey, userID)
		ctx = context.WithValue(ctx, UserRoleKey, role)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (g *AuthGuard) RequireRoles(allowed ...string) func(http.Handler) http.Handler {
	allowedSet := make(map[string]bool)
	for _, r := range allowed {
		allowedSet[r] = true
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role, _ := r.Context().Value(UserRoleKey).(string)
			if !allowedSet[role] {
				http.Error(w, `{"error":"akses ditolak untuk role ini"}`, http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func (g *AuthGuard) verifyTokenViaSupabase(ctx context.Context, accessToken string) (string, error) {
	url := strings.TrimRight(g.SupabaseURL, "/") + "/auth/v1/user"
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("apikey", g.ServiceRoleKey)
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return "", fmt.Errorf("auth user status %d", resp.StatusCode)
	}

	var user struct {
		ID string `json:"id"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil || user.ID == "" {
		return "", fmt.Errorf("user id kosong")
	}
	return user.ID, nil
}

func (g *AuthGuard) fetchProfileRole(ctx context.Context, userID string) (string, error) {
	url := fmt.Sprintf("%s/rest/v1/profiles?id=eq.%s&select=role", g.SupabaseURL, userID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("apikey", g.ServiceRoleKey)
	req.Header.Set("Authorization", "Bearer "+g.ServiceRoleKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var rows []struct {
		Role string `json:"role"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&rows); err != nil || len(rows) == 0 {
		return "", fmt.Errorf("profil tidak ditemukan")
	}
	return rows[0].Role, nil
}