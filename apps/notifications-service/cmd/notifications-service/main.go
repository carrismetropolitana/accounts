package main

import (
	"log"
	"notifications-service/internal/services"
	"notifications-service/models"
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
		"REDIS_URL":                 os.Getenv("REDIS_URL"),
		// "FIREBASE_CREDENTIALS_PATH": os.Getenv("FIREBASE_CREDENTIALS_PATH"),
	}

	// Validate required environment variables
	for name, value := range requiredEnvVars {
		if value == "" {
			log.Fatalf("Error: %s environment variable is not set", name)
		}
	}

	redisURL := requiredEnvVars["REDIS_URL"]
	// firebaseCredentialsPath := requiredEnvVars["FIREBASE_CREDENTIALS_PATH"]

	// Connect to Services
	redisService := services.NewRedisService(redisURL)
	defer redisService.Disconnect()
	// firebaseService := services.NewFirebaseService(firebaseCredentialsPath)

	var vehiclesHashMap = make(map[string][]models.Vehicle)

	// Start the GetVehiclesHashMap function in goroutine
	go services.GetVehiclesHashMap(&vehiclesHashMap)

	// Start the NotificationsService function in main thread
	services.NotificationsService(redisService, &vehiclesHashMap)
}
