package main

import (
	"log"
	"notifications-service/internal/services"
	"notifications-service/models"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	envPath := os.Args[1]
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

	// Connect to Services
	redisService := services.NewRedisService(redisURL)
	defer redisService.Disconnect()

	var vehiclesHashMap = make(map[string]models.Vehicle)

	// Start the GetVehiclesHashMap function in goroutine
	go services.GetVehiclesHashMap(&vehiclesHashMap)

	// Start the NotificationsService function in main thread
	services.NotificationsService(redisService, &vehiclesHashMap)
}
