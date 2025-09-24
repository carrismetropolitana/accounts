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

const (
	cronInterval       = 10 * time.Second
	processedKeyPrefix = "processed:"
	smartNotificationType = "smart_notifications"
)

// Widget represents a widget configuration stored in the database
type Widget struct {
	Data bson.M `bson:"data"`
}

// Device represents a device with an associated push token
type Device struct {
	PushToken string `bson:"push_token"`
}

// Account represents an account with associated widgets
type Account struct {
	Widgets []Widget `bson:"widgets"`
	Devices []Device `bson:"devices"`
}

// SmartNotificationConfig represents the configuration for smart notifications
type SmartNotificationConfig struct {
	Type      string   `json:"type"`
	WeekDays  []string `json:"week_days"`
	StartTime int32    `json:"start_time"`
	EndTime   int32    `json:"end_time"`
	ID        string   `json:"id"`
	PushToken string   `json:"push_token"`
}

// StartCronJobs initializes and runs the cron job scheduler
func StartCronJobs(redisService *RedisService, mongoService *MongoService) {
	ticker := time.NewTicker(cronInterval)
	defer ticker.Stop()

	fmt.Printf("Starting cron jobs with %v interval\n", cronInterval)
	
	// Run immediately on startup
	processSmartNotifications(redisService, mongoService)

	// Process notifications on every tick
	for range ticker.C {
		processSmartNotifications(redisService, mongoService)
	}
}

// processSmartNotifications finds and processes smart notification widgets that match current time
func processSmartNotifications(redisService *RedisService, mongoService *MongoService) {
	fmt.Println("⤷ Processing smart notifications")
	startTime := time.Now()

	currentSecond := utils.GetCurrentSecondInDay()
	weekDay := utils.GetCurrentWeekDay()

	fmt.Printf("Current time: %d seconds, Day: %s\n", currentSecond, weekDay)

	// Find matching accounts
	accounts, err := findAccountsWithActiveNotifications(mongoService, currentSecond, weekDay)
	if err != nil {
		fmt.Printf("Error finding accounts: %v\n", err)
		return
	}

	if len(accounts) == 0 {
		fmt.Println("No active smart notifications found")
		return
	}

	fmt.Printf("Found %d accounts with active notifications\n", len(accounts))

	// Clear previous processed notifications
	if err := clearProcessedNotifications(redisService); err != nil {
		fmt.Printf("Error clearing processed notifications: %v\n", err)
		return
	}

	// Process notifications concurrently
	processNotificationsConcurrently(redisService, accounts, currentSecond, weekDay)

	fmt.Printf("Processing completed in %v\n", time.Since(startTime))
}

// findAccountsWithActiveNotifications queries MongoDB for accounts with smart notifications
// that match the current time and day
func findAccountsWithActiveNotifications(mongoService *MongoService, currentSecond int, weekDay string) ([]Account, error) {
	filter := bson.M{
		"widgets": bson.M{
			"$elemMatch": bson.M{
				"data.type":       smartNotificationType,
				"data.week_days":  weekDay,
				"data.start_time": bson.M{"$lte": currentSecond},
				"data.end_time":   bson.M{"$gte": currentSecond},
			},
		},
	}

	cursor, err := mongoService.Find("accounts", filter)
	if err != nil {
		return nil, fmt.Errorf("failed to query accounts: %w", err)
	}
	defer cursor.Close(context.Background())

	var accounts []Account
	if err := cursor.All(context.Background(), &accounts); err != nil {
		return nil, fmt.Errorf("failed to decode accounts: %w", err)
	}

	return accounts, nil
}

// clearProcessedNotifications removes all previously processed notification keys from Redis
func clearProcessedNotifications(redisService *RedisService) error {
	pattern := processedKeyPrefix + "*"
	if err := utils.ClearCollectionByPattern(redisService.Client(), pattern); err != nil {
		return fmt.Errorf("failed to clear processed notifications: %w", err)
	}
	return nil
}

// processNotificationsConcurrently processes notification widgets using goroutines
func processNotificationsConcurrently(redisService *RedisService, accounts []Account, currentSecond int, weekDay string) {
	var wg sync.WaitGroup
	errChan := make(chan error, 100) // Buffered channel to prevent blocking

	// Process each widget concurrently
	for _, account := range accounts {
		for _, widget := range account.Widgets {
			wg.Add(1)
			for _, pushToken := range account.Devices {
				go processWidget(redisService, widget.Data, currentSecond, weekDay, &wg, errChan, pushToken.PushToken)
			}
		}
	}

	// Wait for all goroutines to complete
	wg.Wait()
	close(errChan)

	// Report any errors
	errorCount := 0
	for err := range errChan {
		fmt.Printf("Processing error: %v\n", err)
		errorCount++
	}

	if errorCount > 0 {
		fmt.Printf("Completed with %d errors\n", errorCount)
	}
}

// processWidget processes a single widget and stores it in Redis if it matches criteria
func processWidget(redisService *RedisService, widgetData bson.M, currentSecond int, weekDay string, wg *sync.WaitGroup, errChan chan<- error, pushToken string) {
	defer wg.Done()

	config, err := parseSmartNotificationConfig(widgetData, pushToken)
	if err != nil {
		errChan <- fmt.Errorf("failed to parse widget config: %w", err)
		return
	}

	// Skip if not a smart notification
	if config.Type != smartNotificationType {
		return
	}

	// Validate time range
	if !isTimeInRange(currentSecond, int(config.StartTime), int(config.EndTime)) {
		return
	}

	// Validate weekday
	if !isValidWeekDay(weekDay, config.WeekDays) {
		return
	}

	// Store processed notification in Redis
	if err := storeProcessedNotification(redisService, config, widgetData); err != nil {
		errChan <- err
	}
}

// parseSmartNotificationConfig extracts and validates smart notification configuration
func parseSmartNotificationConfig(widgetData bson.M, pushToken string) (*SmartNotificationConfig, error) {
	config := &SmartNotificationConfig{}

	// Extract type
	if t, ok := widgetData["type"].(string); ok {
		config.Type = t
	} else {
		return nil, fmt.Errorf("invalid or missing type field")
	}

	// Extract time range
	if startTime, ok := widgetData["start_time"].(int32); ok {
		config.StartTime = startTime
	} else {
		return nil, fmt.Errorf("invalid or missing start_time field")
	}

	if endTime, ok := widgetData["end_time"].(int32); ok {
		config.EndTime = endTime
	} else {
		return nil, fmt.Errorf("invalid or missing end_time field")
	}

	config.PushToken = pushToken

	// Extract weekdays
	if weekDays, ok := widgetData["week_days"].(bson.A); ok {
		for _, dayIntf := range weekDays {
			if dayStr, ok := dayIntf.(string); ok {
				config.WeekDays = append(config.WeekDays, dayStr)
			}
		}
	}

	// Extract ID
	if id, ok := widgetData["id"]; ok {
		config.ID = fmt.Sprintf("%v", id)
	}

	return config, nil
}

// isTimeInRange checks if the current second falls within the specified time range
func isTimeInRange(currentSecond, startTime, endTime int) bool {
	return startTime <= currentSecond && currentSecond <= endTime
}

// isValidWeekDay checks if the current weekday is in the list of valid weekdays
func isValidWeekDay(currentWeekDay string, validWeekDays []string) bool {
	for _, day := range validWeekDays {
		if day == currentWeekDay {
			return true
		}
	}
	return false
}

// storeProcessedNotification serializes and stores the notification data in Redis
func storeProcessedNotification(redisService *RedisService, config *SmartNotificationConfig, widgetData bson.M) error {
	// Serialize widget data
	dataBytes, err := json.Marshal(widgetData)
	if err != nil {
		return fmt.Errorf("failed to marshal widget data: %w", err)
	}

	// Generate Redis key
	key := generateProcessedKey(config)

	// Store in Redis
	if err := redisService.Set(key, string(dataBytes)); err != nil {
		return fmt.Errorf("failed to store key %s in Redis: %w", key, err)
	}

	return nil
}

// generateProcessedKey creates a Redis key for processed notifications
func generateProcessedKey(config *SmartNotificationConfig) string {
	weekDay := ""
	if len(config.WeekDays) > 0 {
		weekDay = config.WeekDays[0] // Use first weekday for key generation
	}

	return fmt.Sprintf("%s%s:%d:%d:%s:%s",
		processedKeyPrefix,
		weekDay,
		config.StartTime,
		config.EndTime,
		config.ID,
		config.PushToken,
	)
}