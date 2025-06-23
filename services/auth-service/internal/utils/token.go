package utils

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"os"
	"time"

	"github.com/o1egl/paseto"
)

type TokenClaims struct {
	UserID    string `json:"user_id"`    // Changed to string to match UUID
	Username  string `json:"username"`
	Role      string `json:"role"`
	TokenType string `json:"token_type"` // "access" for access tokens
}

// CreateToken generates a new PASETO token with specified duration
func CreateToken(claims TokenClaims, duration time.Duration) (string, error) {
	v2 := paseto.NewV2()

	// Get PASETO secret key from environment
	secretKey := os.Getenv("PASETO_SECRET_KEY")
	if secretKey == "" {
		return "", fmt.Errorf("PASETO_SECRET_KEY not set")
	}

	// Convert hex string to bytes
	key, err := hex.DecodeString(secretKey)
	if err != nil {
		return "", fmt.Errorf("invalid hex format: %v", err)
	}

	if len(key) != 32 {
		return "", fmt.Errorf("invalid key length: got %d bytes, need 32", len(key))
	}

	// Token expires based on provided duration
	expiration := time.Now().Add(duration)

	// Create a JSONToken with proper expiration
	jsonToken := paseto.JSONToken{
		Expiration: expiration,
	}

	// Encrypt the token with the claims and expiration
	token, err := v2.Encrypt(key, claims, &jsonToken)
	if err != nil {
		return "", fmt.Errorf("failed to create token: %v", err)
	}

	return token, nil
}

// CreateAccessToken creates a short-lived access token (15 minutes by default)
func CreateAccessToken(userID, username, role string) (string, error) {
	claims := TokenClaims{
		UserID:    userID,
		Username:  username,
		Role:      role,
		TokenType: "access",
	}

	// Get token expiration from environment or use default
	accessTokenDuration := 15 * time.Minute
	if durationStr := os.Getenv("ACCESS_TOKEN_EXPIRATION"); durationStr != "" {
		if duration, err := time.ParseDuration(durationStr); err == nil {
			accessTokenDuration = duration
		}
	}

	return CreateToken(claims, accessTokenDuration)
}

// GenerateRefreshToken creates a cryptographically secure random string
// for use as a refresh token (doesn't encode any user information)
func GenerateRefreshToken() (string, error) {
	// Generate 32 bytes of random data
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}

	// Encode as Base64URL (URL-safe Base64)
	return base64.URLEncoding.EncodeToString(b), nil
}

// ValidateToken validates and decodes a PASETO token
func ValidateToken(tokenString string) (*TokenClaims, error) {
	v2 := paseto.NewV2()

	// Get PASETO secret key from environment
	secretKey := os.Getenv("PASETO_SECRET_KEY")
	if secretKey == "" {
		return nil, fmt.Errorf("PASETO_SECRET_KEY not set")
	}

	// Convert hex string to bytes
	key, err := hex.DecodeString(secretKey)
	if err != nil {
		return nil, fmt.Errorf("invalid hex format: %v", err)
	}

	if len(key) != 32 {
		return nil, fmt.Errorf("invalid key length: got %d bytes, need 32", len(key))
	}

	var claims TokenClaims
	// Create a footer validation rule with proper parsing
	var footer paseto.JSONToken

	// Decrypt with footer validation
	err = v2.Decrypt(tokenString, key, &claims, &footer)
	if err != nil {
		return nil, fmt.Errorf("invalid token: %v", err)
	}

	// Manually check expiration if needed
	if footer.Expiration.Before(time.Now()) {
		return nil, fmt.Errorf("token expired")
	}

	return &claims, nil
}

// GenerateVerificationToken generates a secure token for email verification
func GenerateVerificationToken() (string, error) {
	// Generate 32 bytes of random data
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}

	// Encode as hex string
	return hex.EncodeToString(b), nil
} 