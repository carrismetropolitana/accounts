package services

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

func GetEnv(key string) string {
	// Load environment variables from .env file if specified
	if len(os.Args) > 1 {
		envPath := os.Args[1]
		if err := godotenv.Load(envPath); err != nil {
			log.Printf("Warning: Error loading .env file: %v\n", err)
		}
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

	if value, ok := requiredEnvVars[key]; ok {
		return value
	}

	return os.Getenv(key)
}

func GetDatabaseName() string {
	if dbName := os.Getenv("MONGODB_DATABASE"); dbName != "" {
		return dbName
	}

	if dbName := os.Getenv("production"); dbName != "" {
		return dbName
	}

	return "production"
}