package services

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
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
	client, err := mongo.Connect(context.Background(), clientOptions)
	if err != nil {
		panic(err)
	}
	
	database := client.Database(dbName)
	return &MongoService{
		client:   client,
		database: database,
	}
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

/**
 * Inserts a document into a collection.
 * @param collection The collection name.
 * @param document The document to insert.
 * @returns A promise that resolves to the result of the operation.
 */
func (m *MongoService) InsertOne(collection string, document interface{}) (*mongo.InsertOneResult, error) {
	coll := m.database.Collection(collection)
	return coll.InsertOne(context.Background(), document)
}

/**
 * Inserts multiple documents into a collection.
 * @param collection The collection name.
 * @param documents The documents to insert.
 * @returns A promise that resolves to the result of the operation.
 */
func (m *MongoService) InsertMany(collection string, documents []interface{}) (*mongo.InsertManyResult, error) {
	coll := m.database.Collection(collection)
	return coll.InsertMany(context.Background(), documents)
}

/**
 * Finds a single document in a collection.
 * @param collection The collection name.
 * @param filter The filter to apply.
 * @returns A promise that resolves to the result of the operation.
 */
func (m *MongoService) FindOne(collection string, filter bson.M) *mongo.SingleResult {
	coll := m.database.Collection(collection)
	return coll.FindOne(context.Background(), filter)
}

/**
 * Finds multiple documents in a collection.
 * @param collection The collection name.
 * @param filter The filter to apply.
 * @returns A promise that resolves to the result of the operation.
 */
func (m *MongoService) Find(collection string, filter bson.M) (*mongo.Cursor, error) {
	coll := m.database.Collection(collection)
	return coll.Find(context.Background(), filter)
}

/**
 * Updates a single document in a collection.
 * @param collection The collection name.
 * @param filter The filter to apply.
 * @param update The update operations.
 * @returns A promise that resolves to the result of the operation.
 */
func (m *MongoService) UpdateOne(collection string, filter bson.M, update bson.M) (*mongo.UpdateResult, error) {
	coll := m.database.Collection(collection)
	return coll.UpdateOne(context.Background(), filter, update)
}

/**
 * Updates multiple documents in a collection.
 * @param collection The collection name.
 * @param filter The filter to apply.
 * @param update The update operations.
 * @returns A promise that resolves to the result of the operation.
 */
func (m *MongoService) UpdateMany(collection string, filter bson.M, update bson.M) (*mongo.UpdateResult, error) {
	coll := m.database.Collection(collection)
	return coll.UpdateMany(context.Background(), filter, update)
}

/**
 * Deletes a single document from a collection.
 * @param collection The collection name.
 * @param filter The filter to apply.
 * @returns A promise that resolves to the result of the operation.
 */
func (m *MongoService) DeleteOne(collection string, filter bson.M) (*mongo.DeleteResult, error) {
	coll := m.database.Collection(collection)
	return coll.DeleteOne(context.Background(), filter)
}

/**
 * Deletes multiple documents from a collection.
 * @param collection The collection name.
 * @param filter The filter to apply.
 * @returns A promise that resolves to the result of the operation.
 */
func (m *MongoService) DeleteMany(collection string, filter bson.M) (*mongo.DeleteResult, error) {
	coll := m.database.Collection(collection)
	return coll.DeleteMany(context.Background(), filter)
}

/**
 * Returns the MongoDB client.
 * @returns The MongoDB client.
 */
func (m *MongoService) Client() *mongo.Client {
	return m.client
}

/**
 * Returns the MongoDB database.
 * @returns The MongoDB database.
 */
func (m *MongoService) Database() *mongo.Database {
	return m.database
}

/**
 * Returns a specific collection.
 * @param name The collection name.
 * @returns The MongoDB collection.
 */
func (m *MongoService) Collection(name string) *mongo.Collection {
	return m.database.Collection(name)
}