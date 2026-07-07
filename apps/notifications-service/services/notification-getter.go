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
	
	fmt.Printf("Found %d Notification Widgets \n", len(notifications))
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
	mongoService := NewMongoService(GetEnv("DATABASE_URI"), GetEnv("production"))

	
	// Build pipeline
	pipeline := mongo.Pipeline{
		// Unwind widgets
		bson.D{{Key: "$unwind", Value: "$widgets"}},
		// Match widgets with conditions
		bson.D{{Key: "$match", Value: bson.D{
			{Key: "widgets.type", Value: "smart_notification"},
			{Key: "widgets.properties.weekdays", Value: lib.GetCurrentWeekDay()},
			{Key: "widgets.properties.start_time", Value: bson.D{{Key: "$lte", Value: lib.GetCurrentSecondInDay()}}},
			{Key: "widgets.properties.end_time", Value: bson.D{{Key: "$gte", Value: lib.GetCurrentSecondInDay()}}},
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

	notifications := []types.NotificationWidget{}
	if err := cursor.All(context.Background(), &notifications); err != nil {
		return nil, err
	}

	return notifications, nil
}