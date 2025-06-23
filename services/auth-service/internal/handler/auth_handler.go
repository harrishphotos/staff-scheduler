package handler

import (
	"strings"
	"time"

	"services/shared/db"
	"services/shared/utils"

	"github.com/salobook/services/auth-service/internal/model"
	authUtils "github.com/salobook/services/auth-service/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email"`
}

type ResetPasswordRequest struct {
	Token       string `json:"token"`
	NewPassword string `json:"new_password"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token"`
}

func Register(c *fiber.Ctx) error {
	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot parse JSON",
		})
	}

	// Basic validation
	if req.Email == "" || req.Username == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Email, username, and password are required",
		})
	}

	hashedPassword, err := authUtils.HashPassword(req.Password)
	if err != nil {
		utils.Error("Password hashing failed: " + err.Error())
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Something went wrong. Please try again later.",
		})
	}

	token, err := authUtils.GenerateVerificationToken()
	if err != nil {
		utils.Error("Failed to generate verification token: " + err.Error())
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Something went wrong. Please try again later.",
		})
	}

	expiresAt := time.Now().Add(24 * time.Hour)
	tx := db.DB.Begin()
	defer tx.Rollback()

	user := model.User{
		Email:             req.Email,
		Username:          req.Username,
		Password:          hashedPassword,
		Role:              "user",
		IsVerified:        false,
		VerificationToken: token,
		TokenExpiresAt:    expiresAt,
	}

	if err := tx.Create(&user).Error; err != nil {
		utils.Error("User creation failed: " + err.Error())
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not create user",
		})
	}

	// Send verification email
	if err := authUtils.SendVerificationEmail(user.Email, user.Username, token); err != nil {
		utils.Error("Failed to send verification email: " + err.Error())
		// Don't fail the registration if email fails, but log the error
	}

	if err := tx.Commit().Error; err != nil {
		utils.Error("Transaction commit failed: " + err.Error())
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Something went wrong. Please try again later.",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "User registered successfully. Please check your email for verification.",
	})
}

func Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot parse JSON",
		})
	}

	var user model.User
	if err := db.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid credentials",
		})
	}

	if !user.IsVerified {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":              "Please verify your email before logging in",
			"needsVerification": true,
		})
	}

	match, err := authUtils.ComparePasswords(req.Password, user.Password)
	if err != nil || !match {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid credentials",
		})
	}

	// Generate access token
	accessToken, err := authUtils.CreateAccessToken(user.ID.String(), user.Username, user.Role)
	if err != nil {
		utils.Error("Failed to create access token: " + err.Error())
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not create access token",
		})
	}

	// Generate refresh token
	refreshToken, err := authUtils.GenerateRefreshToken()
	if err != nil {
		utils.Error("Failed to generate refresh token: " + err.Error())
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not create refresh token",
		})
	}

	// Store refresh token in the database
	refreshExpiresAt := time.Now().Add(7 * 24 * time.Hour) // 7 days
	user.RefreshToken = refreshToken
	user.RefreshExpiresAt = refreshExpiresAt

	if err := db.DB.Save(&user).Error; err != nil {
		utils.Error("Failed to save refresh token: " + err.Error())
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not save refresh token",
		})
	}

	// Set refresh token as HttpOnly cookie
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Expires:  refreshExpiresAt,
		HTTPOnly: true,
		Secure:   false, // Set to false for development
		SameSite: "lax",
		Path:     "/api/auth",
	})

	return c.JSON(fiber.Map{
		"access_token": accessToken,
		"expires_in":   900, // 15 minutes in seconds
		"user": fiber.Map{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
			"role":     user.Role,
		},
	})
}

func RefreshToken(c *fiber.Ctx) error {
	// Get refresh token from cookie
	refreshToken := c.Cookies("refresh_token")
	if refreshToken == "" {
		// Also try to get from request body
		var req RefreshTokenRequest
		if err := c.BodyParser(&req); err == nil && req.RefreshToken != "" {
			refreshToken = req.RefreshToken
		} else {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Refresh token required",
			})
		}
	}

	var user model.User
	if err := db.DB.Where("refresh_token = ? AND refresh_expires_at > ?", refreshToken, time.Now()).First(&user).Error; err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid or expired refresh token",
		})
	}

	// Generate new access token
	accessToken, err := authUtils.CreateAccessToken(user.ID.String(), user.Username, user.Role)
	if err != nil {
		utils.Error("Failed to create access token: " + err.Error())
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not create access token",
		})
	}

	// Generate new refresh token
	newRefreshToken, err := authUtils.GenerateRefreshToken()
	if err != nil {
		utils.Error("Failed to generate refresh token: " + err.Error())
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not create refresh token",
		})
	}

	// Update refresh token in database
	refreshExpiresAt := time.Now().Add(7 * 24 * time.Hour)
	user.RefreshToken = newRefreshToken
	user.RefreshExpiresAt = refreshExpiresAt

	if err := db.DB.Save(&user).Error; err != nil {
		utils.Error("Failed to save refresh token: " + err.Error())
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not save refresh token",
		})
	}

	// Set new refresh token as cookie
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    newRefreshToken,
		Expires:  refreshExpiresAt,
		HTTPOnly: true,
		Secure:   false,
		SameSite: "lax",
		Path:     "/api/auth",
	})

	return c.JSON(fiber.Map{
		"access_token": accessToken,
		"expires_in":   900, // 15 minutes in seconds
	})
}

func Logout(c *fiber.Ctx) error {
	refreshToken := c.Cookies("refresh_token")
	if refreshToken != "" {
		// Clear refresh token from database
		db.DB.Model(&model.User{}).Where("refresh_token = ?", refreshToken).Updates(map[string]interface{}{
			"refresh_token":     "",
			"refresh_expires_at": time.Now(),
		})
	}

	// Clear refresh token cookie
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Expires:  time.Now().Add(-1 * time.Hour),
		HTTPOnly: true,
		Secure:   false,
		SameSite: "lax",
		Path:     "/api/auth",
	})

	return c.JSON(fiber.Map{
		"message": "Logged out successfully",
	})
}

func VerifyEmail(c *fiber.Ctx) error {
	token := c.Query("token")
	if token == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Verification token required",
		})
	}

	var user model.User
	if err := db.DB.Where("verification_token = ? AND token_expires_at > ?", token, time.Now()).First(&user).Error; err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid or expired verification token",
		})
	}

	// Update user as verified
	user.IsVerified = true
	user.VerificationToken = ""
	user.TokenExpiresAt = time.Now()

	if err := db.DB.Save(&user).Error; err != nil {
		utils.Error("Failed to verify user: " + err.Error())
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not verify email",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Email verified successfully. You can now log in.",
	})
}

func ForgotPassword(c *fiber.Ctx) error {
	var req ForgotPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot parse JSON",
		})
	}

	var user model.User
	if err := db.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		// Don't reveal if email exists or not
		return c.JSON(fiber.Map{
			"message": "If your email exists in our system, you will receive a password reset link.",
		})
	}

	// Generate reset token
	resetToken, err := authUtils.GenerateVerificationToken()
	if err != nil {
		utils.Error("Failed to generate reset token: " + err.Error())
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Something went wrong. Please try again later.",
		})
	}

	// Update user with reset token
	user.ResetPasswordToken = resetToken
	user.ResetTokenExpiresAt = time.Now().Add(1 * time.Hour) // 1 hour expiry

	if err := db.DB.Save(&user).Error; err != nil {
		utils.Error("Failed to save reset token: " + err.Error())
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Something went wrong. Please try again later.",
		})
	}

	// Send password reset email
	if err := authUtils.SendPasswordResetEmail(user.Email, user.Username, resetToken); err != nil {
		utils.Error("Failed to send password reset email: " + err.Error())
		// Don't fail the request if email fails, but log the error
	}

	return c.JSON(fiber.Map{
		"message": "If your email exists in our system, you will receive a password reset link.",
	})
}

func ResetPassword(c *fiber.Ctx) error {
	var req ResetPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot parse JSON",
		})
	}

	var user model.User
	if err := db.DB.Where("reset_password_token = ? AND reset_token_expires_at > ?", req.Token, time.Now()).First(&user).Error; err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid or expired reset token",
		})
	}

	// Hash new password
	hashedPassword, err := authUtils.HashPassword(req.NewPassword)
	if err != nil {
		utils.Error("Password hashing failed: " + err.Error())
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Something went wrong. Please try again later.",
		})
	}

	// Update user password and clear reset token
	user.Password = hashedPassword
	user.ResetPasswordToken = ""
	user.ResetTokenExpiresAt = time.Now()

	if err := db.DB.Save(&user).Error; err != nil {
		utils.Error("Failed to reset password: " + err.Error())
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not reset password",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Password reset successfully. You can now log in with your new password.",
	})
}

// ValidateToken validates a token and returns user info (for API Gateway)
func ValidateToken(c *fiber.Ctx) error {
	// Extract token from Authorization header
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(401).JSON(fiber.Map{
			"valid": false,
			"error": "missing authorization header",
		})
	}

	token := strings.TrimPrefix(authHeader, "Bearer ")

	// Validate token
	claims, err := authUtils.ValidateToken(token)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{
			"valid": false,
			"error": "invalid token",
		})
	}

	// Parse UUID
	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{
			"valid": false,
			"error": "invalid user ID",
		})
	}

	return c.JSON(fiber.Map{
		"valid":   true,
		"user_id": userID,
		"role":    claims.Role,
	})
} 