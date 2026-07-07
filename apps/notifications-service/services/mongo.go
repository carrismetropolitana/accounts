package services

import (
	"context"
	"fmt"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

var (
	sharedMongoService *MongoService
	mongoServiceOnce   sync.Once
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
func GetMongoService() *MongoService {
	mongoServiceOnce.Do(func() {
		dbName := GetDatabaseName()
		sharedMongoService = NewMongoService(GetEnv("DATABASE_URI"), dbName)
	})
	return sharedMongoService
}

func NewMongoService(url, dbName string) *MongoService {
	if dbName == "" {
		dbName = "production"
	}

	clientOptions := options.Client().ApplyURI(url)
	client, err := mongo.Connect(clientOptions)
	if err != nil {
		fmt.Printf("Error connecting to MongoDB: %v\n", err)
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := client.Ping(ctx, nil); err != nil {
		fmt.Printf("Error pinging MongoDB: %v\n", err)
		return nil
	}

	fmt.Printf("Connected to MongoDB database: %s\n", dbName)
	return &MongoService{client: client, database: client.Database(dbName)}
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