package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"notifications-service/lib"
	"notifications-service/types"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

/**
 * Loop that runs every 9 seconds to get vehicles from API and store them in a hashmap.
 * The hashmap is used to retrieve vehicles by pattern Id.
 */
 func GetActiveNotifications(myNotifications *[]types.NotificationWidget) {
	ticker := time.NewTicker(9 * time.Second)   
	defer ticker.Stop()                        // Ensures that the ticker notifications when the function exits to free up resources
	
	//Run first time
	notifications, err := getActiveNotifications()
	if err != nil {
		log.Println(err)
	}
	
	fmt.Printf("(FIRST TIME) Found %d Notification Widgets \n", len(notifications))
	*myNotifications = notifications


	// This loop runs every time the ticker ticks
	for range ticker.C {
		notifications, err := getActiveNotifications() // Call the function to execute cron jobs\
		if err != nil {
			log.Println(err)
		}
		
		fmt.Printf("Found %d Notification Widgets \n", len(notifications))
		*myNotifications = notifications
	}
}

func getActiveNotifications() ([]types.NotificationWidget, error) {
	dbName := GetDatabaseName()
	mongoService := GetMongoService()
	if mongoService == nil {
		return nil, fmt.Errorf("failed to connect to MongoDB database %q", dbName)
	}

	currentWeekday := lib.GetCurrentWeekDay()
	currentSecond := lib.GetCurrentSecondInDay()
	fmt.Printf(
		"Querying database %q with weekday=%s second=%d\n",
		dbName,
		currentWeekday,
		currentSecond,
	)

	// Build pipeline
	pipeline := mongo.Pipeline{
		// Unwind widgets
		bson.D{{Key: "$unwind", Value: "$widgets"}},
		// Match widgets with conditions
		bson.D{{Key: "$match", Value: bson.D{
			{Key: "widgets.type", Value: "smart_notification"},
			{Key: "widgets.properties.weekdays", Value: currentWeekday},
			{Key: "widgets.properties.start_time", Value: bson.D{{Key: "$lte", Value: currentSecond}}},
			{Key: "widgets.properties.end_time", Value: bson.D{{Key: "$gte", Value: currentSecond}}},
			{Key: "widgets.status.code", Value: "complete"},
		}}},
		// Project widget fields + account id + push tokens
		bson.D{{Key: "$project", Value: bson.D{
			{Key: "_id", Value: "$widgets._id"},
			{Key: "account_id", Value: "$_id"},
			{Key: "distance", Value: "$widgets.properties.distance"},
			{Key: "end_time", Value: "$widgets.properties.end_time"},
			{Key: "geojson", Value: "$widgets.properties.geojson"},
			{Key: "pattern_id", Value: "$widgets.properties.pattern_id"},
			{Key: "start_time", Value: "$widgets.properties.start_time"},
			{Key: "stop_id", Value: "$widgets.properties.stop_id"},
			{Key: "stop_sequence", Value: "$widgets.properties.stop_sequence"},
			{Key: "weekdays", Value: "$widgets.properties.weekdays"},
			{Key: "push_tokens", Value: bson.D{
				{Key: "$filter", Value: bson.D{
					{Key: "input", Value: bson.D{
						{Key: "$map", Value: bson.D{
							{Key: "input", Value: "$devices"},
							{Key: "as", Value: "device"},
							{Key: "in", Value: "$$device.push_token"},
						}},
					}},
					{Key: "as", Value: "token"},
					{Key: "cond", Value: bson.D{
						{Key: "$ne", Value: bson.A{"$$token", nil}},
					}},
				}},
			}},
		}}},
	}

	// Print Pipeline ready to copy and paste into MongoDB Compass
	fmt.Println("pipeline: \n", pipeline)
	pipelineJSON, err := json.Marshal(pipeline)
	if err != nil {
		return nil, err
	}
	fmt.Println("pipelineJSON: ", string(pipelineJSON))

	cursor, err := mongoService.Aggregate("accounts", pipeline)
	if err != nil {
		return nil, err
	}

	rawResults := []bson.M{}
	if err := cursor.All(context.Background(), &rawResults); err != nil {
		return nil, err
	}

	fmt.Printf("MongoDB returned %d raw documents\n", len(rawResults))

	notifications := make([]types.NotificationWidget, 0, len(rawResults))
	for i, raw := range rawResults {
		notification, err := decodeNotificationWidget(raw)
		if err != nil {
			log.Printf("Failed to decode notification widget %d: %v (raw: %+v)", i, err, raw)
			continue
		}
		notifications = append(notifications, notification)
	}

	fmt.Printf("Found %d Notification Widgets \n", len(notifications))

	return notifications, nil
}

func decodeNotificationWidget(raw bson.M) (types.NotificationWidget, error) {
	var notification types.NotificationWidget

	data, err := bson.Marshal(raw)
	if err != nil {
		return notification, err
	}

	if err := bson.Unmarshal(data, &notification); err != nil {
		return notification, err
	}

	if accountID, ok := raw["account_id"]; ok {
		notification.AccountId = bsonValueToString(accountID)
	}

	if id, ok := raw["_id"]; ok {
		notification.Id = bsonValueToString(id)
	}

	return notification, nil
}

func bsonValueToString(value interface{}) string {
	switch v := value.(type) {
	case string:
		return v
	case bson.ObjectID:
		return v.Hex()
	default:
		return fmt.Sprint(v)
	}
}