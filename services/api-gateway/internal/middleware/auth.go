package middleware

import (
	"encoding/json"
	"net/http"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
)

type ValidateResponse struct {
	Valid  bool   `json:"valid"`
	UserID string `json:"user_id"`
	Role   string `json:"role"`
}

// AuthMiddleware validates access tokens by calling the auth service
func AuthMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Extract token from Authorization header
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(401).JSON(fiber.Map{
				"error": "missing authorization header",
			})
		}

		// Check if token has Bearer prefix
		if !strings.HasPrefix(authHeader, "Bearer ") {
			return c.Status(401).JSON(fiber.Map{
				"error": "invalid authorization format. Use Bearer <token>",
			})
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")
		if token == "" {
			return c.Status(401).JSON(fiber.Map{
				"error": "missing access token",
			})
		}

		// Get auth service URL
		authServiceURL := os.Getenv("AUTH_SERVICE_URL")
		if authServiceURL == "" {
			authServiceURL = "http://localhost:3005"
		}

		// Create request to validate token with auth service
		req, err := http.NewRequest("POST", authServiceURL+"/api/auth/validate", nil)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "failed to create validation request",
			})
		}

		// Forward the Authorization header to auth service
		req.Header.Set("Authorization", authHeader)
		req.Header.Set("Content-Type", "application/json")

		// Make request to auth service
		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "auth service unavailable",
			})
		}
		defer resp.Body.Close()

		// Check if token is valid
		if resp.StatusCode != 200 {
			return c.Status(401).JSON(fiber.Map{
				"error": "invalid or expired access token",
			})
		}

		// Parse validation response
		var validateResp ValidateResponse
		if err := json.NewDecoder(resp.Body).Decode(&validateResp); err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "invalid auth service response",
			})
		}

		// Double check the valid flag
		if !validateResp.Valid {
			return c.Status(401).JSON(fiber.Map{
				"error": "access token validation failed",
			})
		}

		// Add user information to request context for downstream services
		c.Locals("user_id", validateResp.UserID)
		c.Locals("user_role", validateResp.Role)

		// Continue to the next handler
		return c.Next()
	}
}
