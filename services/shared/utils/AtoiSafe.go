package utils

import (
	"strconv"
)

func AtoiSafe(s string) (int, error) {
	return strconv.Atoi(s)
}
