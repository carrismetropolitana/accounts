package services

import (
	"context"
	"encoding/json"
	"fmt"
	"notifications-service/internal/utils"
	"notifications-service/models"
	"sync"
	"time"
)

func NotificationsService(redisService *RedisService, firebaseService *FirebaseService, vehiclesHashMap *map[string][]models.Vehicle) {
	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()

	notificationService(redisService, firebaseService, vehiclesHashMap) // Run immediately notificationService

	// This loop runs every time the ticker ticks
	for range ticker.C {
		notificationService(redisService, firebaseService, vehiclesHashMap) // Call the function to execute cron jobs
	}
}

func notificationService(RedisService *RedisService, firebaseService *FirebaseService, vehiclesHashMap *map[string][]models.Vehicle) {

	fmt.Println("⤷ Checking for notifications")

	// If the vehicles hashmap is empty, return
	if len(*vehiclesHashMap) == 0 {
		fmt.Println("Vehicles hashmap is empty")
		return
	}

	notifications, err := getNotifications(RedisService)
	if err != nil {
		fmt.Printf("Error getting notifications: %v\n", err)
		return
	}

	// Create Go routines to process each notification concurrently
	var wg sync.WaitGroup
	errChan := make(chan error, len(notifications))

	for key, notification := range notifications {
		wg.Add(1)

		go func(key string, notification models.Notification) {
			defer wg.Done() // Decrement the counter when the goroutine completes
			vehicles, ok := (*vehiclesHashMap)[notification.PatternId]
			if !ok {
				fmt.Printf("Vehicle with PatternId %s not found\n", notification.PatternId)
				return
			}

			// Define a point and a polygon
			for _, vehicle := range vehicles {
				point := models.Point{X: vehicle.Lon, Y: vehicle.Lat}
				polygon := []models.Point{}
				
				if len(notification.GeoJSON.Geometry.Coordinates) <= 0 {
					fmt.Printf("Notification %s has no polygon\n", notification.Id)
					continue
				}

				for _, coordinate := range notification.GeoJSON.Geometry.Coordinates[0] {
					polygon = append(polygon, models.Point{X: coordinate[0], Y: coordinate[1]})
				}

				// Check if the bus is within the polygon (stop area)
				inPolygon := utils.PointInPolygon(point, polygon)

				// Handle bus entering the polygon (send notification if not already sent)
				if inPolygon  {
					processed, _ := RedisService.Get(fmt.Sprintf("sent:%s", key))
					if processed != "" {
						continue
					}

					fmt.Printf("Bus %s is within %v %s of Stop %s\n", vehicle.Id, notification.Distance, notification.DistanceUnit, notification.StopId)

					// Send notification to firebase
					title := "OLHÓ Autocarro 👀 🚌 "
					body := fmt.Sprintf("O autocarro %s está a chegar à paragem %s", vehicle.LineId, notification.StopId)
					err := firebaseService.SendToTopic(notification.Id, title, body)
					if err != nil {
						fmt.Printf("Error sending notification for vehicle %s and stop %s: %v\n", vehicle.Id, notification.StopId, err)
						return
					}

					fmt.Printf("Notification sent for vehicle %s and stop %s\n", vehicle.Id, notification.StopId)
					RedisService.Set(fmt.Sprintf("sent:%s", key), vehicle.Id)
				}

				// Handle bus leaving the polygon (reset notification flag if it was set for this vehicle)
				if !inPolygon {
					RedisService.Del(fmt.Sprintf("sent:%s", key))
				}
			}
		}(key, notification)
	}

	wg.Wait()      // Wait for all goroutines to complete
	close(errChan) // Close the error channel as no more errors will be sent
} 
func getNotifications(redisService *RedisService) (map[string]models.Notification, error) {
	notificationsMap := make(map[string]models.Notification)

	// Get keys from redis processed:*
	keys, err := redisService.Client().Keys(context.Background(), "processed:*").Result()
	if err != nil {
		fmt.Printf("Error getting notification keys from redis: %v\n", err)
		return notificationsMap, err
	}

	if len(keys) == 0 {
		return notificationsMap, nil
	}

	// Get Notifications from redis
	values, err := redisService.Client().MGet(context.Background(), keys...).Result()
	if err != nil {
		fmt.Printf("Error getting notifications from redis: %v\n", err)
		return notificationsMap, err
	}

	//Cast values to Notification
	for i, value := range values {
		if value == nil {
			continue
		}
		notificationWrapper := models.Notification{}
		err = json.Unmarshal([]byte(value.(string)), &notificationWrapper)
		if err != nil {
			fmt.Printf("Error unmarshalling notification: %v\n", err)
			continue
		}

		notificationsMap[keys[i]] = notificationWrapper
	}

	return notificationsMap, nil
}