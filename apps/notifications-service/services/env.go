package services

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

func GetEnv(key string) string {
	envPath := ""
	if len(os.Args) > 1 {
		envPath = os.Args[1]
	}

	// Load environment variables from .env file
	if err := godotenv.Load(envPath); err != nil {
		log.Printf("Warning: Error loading .env file: %v\n", err)
	}

	// Get required environment variables
	requiredEnvVars := map[string]string{
		"DATABASE_URI": os.Getenv("DATABASE_URI"),
	}

	// Validate required environment variables
	for name, value := range requiredEnvVars {
		if value == "" {
			log.Fatalf("Error: %s environment variable is not set", name)
		}
	}

	return requiredEnvVars[key]
}