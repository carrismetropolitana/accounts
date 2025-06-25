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
				for _, coordinate := range notification.GeoJSON.Geometry.Coordinates[0] {
					polygon = append(polygon, models.Point{X: coordinate[0], Y: coordinate[1]})
				}

				//Check if the bus is in the radius of stop
				if utils.PointInPolygon(point, polygon) {
					if notification.SentVehicleId == nil {
						fmt.Printf("Bus %s is in a radius of %v %s Stop %s\n", vehicle.Id, notification.Distance, notification.DistanceUnit, notification.StopId)

						// Send a message to Firebase Messaging Service to topic notification.id
						title := "Bus Approaching"
						body := fmt.Sprintf("Bus %s is approaching stop %s", vehicle.Id, notification.StopId)
						err := firebaseService.SendToTopic(notification.Id, title, body)
						if err != nil {
							fmt.Printf("Error sending notification: %v\n", err)
						} else {
							fmt.Printf("Notification sent for vehicle %s and stop %s\n", vehicle.Id, notification.StopId)
							notification.SentVehicleId = &vehicle.Id
							notificationJSON, err := json.Marshal(notification)
							if err != nil {
								fmt.Printf("Error marshalling notification: %v\n", err)
							} else {
								err := RedisService.Set(key, string(notificationJSON))
								if err != nil {
									fmt.Printf("Error updating notification in Redis: %v\n", err)
								}
							}
						}
					}
				} else {
					if notification.SentVehicleId != nil && *notification.SentVehicleId == vehicle.Id {
						// Bus is out of the polygon, reset the Sent flag
						notification.SentVehicleId = nil
						notificationJSON, err := json.Marshal(notification)
						if err != nil {
							fmt.Printf("Error marshalling notification: %v\n", err)
						} else {
							err := RedisService.Set(key, string(notificationJSON))
							if err != nil {
								fmt.Printf("Error updating notification in Redis: %v\n", err)
							} else {
								fmt.Printf("Notification flag reset for vehicle %s and stop %s\n", vehicle.Id, notification.StopId)
							}
						}
					}
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