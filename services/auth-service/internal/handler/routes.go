package handler

import (
	"github.com/gofiber/fiber/v2"
)

// SetupRoutes configures all routes for the auth service
func SetupRoutes(app *fiber.App) {
	// Health check endpoint
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "UP",
			"service": "auth-service",
		})
	})

	// Auth routes - unprotected
	auth := app.Group("/api/auth")

	auth.Post("/register", Register)
	auth.Post("/login", Login)
	auth.Get("/verify-email", VerifyEmail)
	auth.Post("/refresh", RefreshToken)
	auth.Post("/forgot-password", ForgotPassword)
	auth.Post("/reset-password", ResetPassword)
	auth.Post("/logout", Logout)

	// Token validation endpoint for API Gateway
	auth.Post("/validate", ValidateToken)
} 