package main

import (
	"filter-service/internal/services"
	"log"
	"os"

	"github.com/joho/godotenv"
)

func main() {
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
		"REDIS_URL": os.Getenv("REDIS_URL"),
		"MONGO_URL": os.Getenv("TML_INTERFACE_AUTH"),
	}

	// Validate required environment variables
	for name, value := range requiredEnvVars {
		if value == "" {
			log.Fatalf("Error: %s environment variable is not set", name)
		}
	}

	redisURL := requiredEnvVars["REDIS_URL"]
	mongoURL := requiredEnvVars["MONGO_URL"]

	// Connect to Services
	mongoService := services.NewMongoService(mongoURL, "production")
	defer mongoService.Disconnect()

	redisService := services.NewRedisService(redisURL)
	defer redisService.Disconnect()

	// Start Cron Jobs
	services.StartCronJobs(redisService, mongoService)
}
