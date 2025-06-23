package utils

import (
	"fmt"
	"net/smtp"
	"os"
	"strings"
)

// SendVerificationEmail sends an email verification link to the user
func SendVerificationEmail(to, username, token string) error {
	// Get SMTP configuration from environment
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUsername := os.Getenv("SMTP_USERNAME")
	smtpPassword := os.Getenv("SMTP_PASSWORD")
	smtpFrom := os.Getenv("SMTP_FROM")
	appURL := os.Getenv("APP_URL")

	// Skip email sending if SMTP is not configured
	if smtpHost == "" || smtpPort == "" || smtpUsername == "" || smtpPassword == "" {
		fmt.Printf("SMTP not configured. Verification email for %s with token: %s\n", to, token)
		return nil
	}

	// Create verification URL
	verificationURL := fmt.Sprintf("%s/api/auth/verify-email?token=%s", appURL, token)

	// Email content
	subject := "Verify Your Email - Salo"
	body := fmt.Sprintf(`
Hello %s,

Thank you for registering with Salo! Please click the link below to verify your email address:

%s

This link will expire in 24 hours.

If you didn't create an account with us, please ignore this email.

Best regards,
The Salo Team
`, username, verificationURL)

	// Compose email
	message := fmt.Sprintf("To: %s\r\n", to)
	message += fmt.Sprintf("From: %s\r\n", smtpFrom)
	message += fmt.Sprintf("Subject: %s\r\n", subject)
	message += "Content-Type: text/plain; charset=UTF-8\r\n"
	message += "\r\n"
	message += body

	// SMTP authentication
	auth := smtp.PlainAuth("", smtpUsername, smtpPassword, smtpHost)

	// Send email
	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, smtpFrom, []string{to}, []byte(message))
	if err != nil {
		return fmt.Errorf("failed to send verification email: %v", err)
	}

	fmt.Printf("Verification email sent successfully to %s\n", to)
	return nil
}

// SendPasswordResetEmail sends a password reset link to the user
func SendPasswordResetEmail(to, username, token string) error {
	// Get SMTP configuration from environment
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUsername := os.Getenv("SMTP_USERNAME")
	smtpPassword := os.Getenv("SMTP_PASSWORD")
	smtpFrom := os.Getenv("SMTP_FROM")
	appURL := os.Getenv("APP_URL")

	// Skip email sending if SMTP is not configured
	if smtpHost == "" || smtpPort == "" || smtpUsername == "" || smtpPassword == "" {
		fmt.Printf("SMTP not configured. Password reset email for %s with token: %s\n", to, token)
		return nil
	}

	// Create reset URL (you'll need to create a frontend page for this)
	resetURL := fmt.Sprintf("%s/reset-password?token=%s", strings.TrimSuffix(appURL, "/api"), token)

	// Email content
	subject := "Reset Your Password - Salo"
	body := fmt.Sprintf(`
Hello %s,

You requested to reset your password for your Salo account. Please click the link below to reset your password:

%s

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email.

Best regards,
The Salo Team
`, username, resetURL)

	// Compose email
	message := fmt.Sprintf("To: %s\r\n", to)
	message += fmt.Sprintf("From: %s\r\n", smtpFrom)
	message += fmt.Sprintf("Subject: %s\r\n", subject)
	message += "Content-Type: text/plain; charset=UTF-8\r\n"
	message += "\r\n"
	message += body

	// SMTP authentication
	auth := smtp.PlainAuth("", smtpUsername, smtpPassword, smtpHost)

	// Send email
	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, smtpFrom, []string{to}, []byte(message))
	if err != nil {
		return fmt.Errorf("failed to send password reset email: %v", err)
	}

	fmt.Printf("Password reset email sent successfully to %s\n", to)
	return nil
} 