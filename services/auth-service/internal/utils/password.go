package utils

import (
	"github.com/alexedwards/argon2id"
)

// HashPassword hashes a plain text password using Argon2id
func HashPassword(password string) (string, error) {
	// Create hash with default parameters
	hash, err := argon2id.CreateHash(password, argon2id.DefaultParams)
	if err != nil {
		return "", err
	}
	return hash, nil
}

// ComparePasswords compares a plain text password with a hashed password
func ComparePasswords(plainPassword, hashedPassword string) (bool, error) {
	match, err := argon2id.ComparePasswordAndHash(plainPassword, hashedPassword)
	if err != nil {
		return false, err
	}
	return match, nil
} 