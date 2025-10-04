package util

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"os"
)

// GenerateHMACSHA256 menghasilkan signature dari data (body request)
// menggunakan secret key dari environment variable HMAC_SECRET.
func GenerateHMACSHA256(data string) string {
	// Ambil secret key dari environment variable yang diset di docker-compose.yml
	secret := os.Getenv("HMAC_SECRET")

	// Inisialisasi HMAC dengan SHA256 dan secret key
	h := hmac.New(sha256.New, []byte(secret))

	// Tulis data (body request)
	h.Write([]byte(data))

	// Hasilnya di-encode ke Base64 string
	return base64.StdEncoding.EncodeToString(h.Sum(nil))
}

// ValidateHMACSHA256 memvalidasi signature yang diterima (header)
// terhadap signature yang diharapkan (dihitung dari body).
func ValidateHMACSHA256(signature string, data string) bool {
	expectedSignature := GenerateHMACSHA256(data)

	// Membandingkan signature yang diterima dengan yang dihitung
	return signature == expectedSignature
}
