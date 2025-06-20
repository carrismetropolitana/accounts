package services

import (
	"context"
	"encoding/json"
	"filter-service/internal/utils"
	"fmt"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/bson"
)

// Start Cron Job
func StartCronJobs(redisService *RedisService, mongoService *MongoService) {
	ticker := time.NewTicker(60 * time.Second) // Creates a new ticker that ticks every 60 seconds (1 minute)
	defer ticker.Stop()                        // Ensures that the ticker stops when the function exits to free up resources

	// Run first time
	runCronJobs(redisService, mongoService)

	// This loop runs every time the ticker ticks (i.e., every minute).
	for range ticker.C {
		runCronJobs(redisService, mongoService) // Call the function to execute cron jobs
	}
}

type Widget struct {
	Data bson.M `bson:"data"`
}
type Account struct {
	Widgets []Widget `bson:"widgets"`
}

/**
 * It finds keys in Redis matching the pattern "notification:*"
 * and checks if the current second of the day is within the range defined by the key.
 *
 * If a key is found, it retrieves the data associated with it and creates a new key with the prefix "processed:".
 * The new key is then set in Redis with the data retrieved from the original key.
 */
func runCronJobs(redisService *RedisService, mongoService *MongoService) {
	fmt.Println("⤷ Filtering started")

	timer := time.Now()
	currentSecond := utils.GetCurrentSecondInDay()
	weekDay := utils.GetCurrentWeekDay()

	// Find accounts with smart notifications that match the current time and day.
	filter := bson.M{
		"widgets": bson.M{
			"$elemMatch": bson.M{
				"data.type":       "smart_notifications",
				"data.week_days":  weekDay,
				"data.start_time": bson.M{"$lte": currentSecond},
				"data.end_time":   bson.M{"$gte": currentSecond},
			},
		},
	}

	cursor, err := mongoService.Find("accounts", filter)
	if err != nil {
		fmt.Printf("Error finding accounts in mongo: %v\n", err)
		return
	}
	defer cursor.Close(context.Background())

	var accounts []Account
	if err = cursor.All(context.Background(), &accounts); err != nil {
		fmt.Printf("Error decoding accounts: %v\n", err)
		return
	}

	// Clear Redis keys that match the pattern "processed:*" before proceeding.
	err = utils.ClearCollectionByPattern(redisService.Client(), "processed:*")
	if err != nil {
		// If there's an error clearing the collection, print the error and return early.
		fmt.Printf("Error clearing collection: %v\n", err)
		return
	}

	// Create Go routines to process each key concurrently
	var wg sync.WaitGroup
	errChan := make(chan error, len(accounts))

	// Iterate over each key found in the range.
	for _, account := range accounts {
		for _, widget := range account.Widgets {
			// Increment the WaitGroup counter
			wg.Add(1)

			// Launch a goroutine to process each key concurrently
			go func(widgetData bson.M) {
				defer wg.Done()

				if t, ok := widgetData["type"].(string); !ok || t != "smart_notifications" {
					return
				}

				// Check time range
				startTime, stOK := widgetData["start_time"].(int32)
				endTime, etOK := widgetData["end_time"].(int32)
				if !stOK || !etOK {
					return
				}
				if !(int(startTime) <= currentSecond && currentSecond <= int(endTime)) {
					return
				}

				// Check weekday
				weekDays, wdOK := widgetData["week_days"].(bson.A)
				if !wdOK {
					return
				}
				dayMatch := false
				for _, dayIntf := range weekDays {
					if dayStr, dOK := dayIntf.(string); dOK && dayStr == weekDay {
						dayMatch = true
						break
					}
				}
				if !dayMatch {
					return
				}

				dataBytes, err := json.Marshal(widgetData)
				if err != nil {
					errChan <- fmt.Errorf("error marshalling widget data: %v", err)
					return
				}

				// The old key was notification:<weekday>:<start>:<end>:<id>
				// The new key will be processed:<weekday>:<start>:<end>:<id>
				key := fmt.Sprintf("processed:%s:%v:%v:%v",
					weekDay,
					widgetData["start_time"],
					widgetData["end_time"],
					widgetData["id"],
				)

				err = redisService.Set(key, string(dataBytes))
				if err != nil {
					// Send an error to the channel if setting the new key fails
					errChan <- fmt.Errorf("error setting key %s in Redis: %v", key, err)
				}
			}(widget.Data)
		}
	}

	wg.Wait()      // Wait for all goroutines to complete
	close(errChan) // Close the error channel as no more errors will be sent

	// Print all errors captured in the error channel
	for err := range errChan {
		fmt.Println(err)
	}

	// Print the total time taken to complete the filtering operation
	fmt.Printf("Filtering completed in %v\n", time.Since(timer))
}
