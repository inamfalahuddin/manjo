package config

import (
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func SetupDatabase() *gorm.DB {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL not set in environment")
	}

	// Coba koneksi berulang kali (penting untuk Docker Compose)
	var db *gorm.DB
	var err error
	maxRetries := 5
	
	for i := 0; i < maxRetries; i++ {
		db, err = gorm.Open(postgres.Open(dbURL), &gorm.Config{})
		if err == nil {
			log.Println("Database connection successful")
			return db
		}
		log.Printf("Failed to connect to database (Attempt %d/%d): %v", i+1, maxRetries, err)
		time.Sleep(5 * time.Second) // Tunggu 5 detik sebelum coba lagi
	}

	log.Fatalf("Exceeded max database connection retries. Final error: %v", err)
	return nil // Tidak akan tercapai
}