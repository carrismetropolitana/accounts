package services

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type MongoService struct {
	client   *mongo.Client
	database *mongo.Database
}

/**
 * Creates a new MongoService instance.
 * @param url The MongoDB connection URL.
 * @param dbName The database name.
 * @returns A new MongoService instance.
 */
func NewMongoService(url, dbName string) *MongoService {
	clientOptions := options.Client().ApplyURI(url)
	client, err := mongo.Connect(clientOptions)
	if err != nil {
		fmt.Printf("Error connecting to MongoDB: %v\n", err)
		return nil
	}
	return &MongoService{client: client, database: client.Database("production")}
}

/**
 * Disconnects from MongoDB.
 */
func (m *MongoService) Disconnect() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	
	if err := m.client.Disconnect(ctx); err != nil {
		fmt.Printf("⤷ ERROR: Failed to disconnect from MongoDB: %v\n", err)
	} else {
		fmt.Println("⤷ Disconnected from MongoDB.")
	}
}

func (m *MongoService) Aggregate(collection string, pipeline interface{}) (*mongo.Cursor, error) {
	return m.database.Collection(collection).Aggregate(context.Background(), pipeline)
}