/**
 * Gets stops from API and stores stops in a hashmap.
 * The hashmap is used to retrieve stops by ID.
 * The hashmap is updated daily.
 */
package services

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"notifications-service/types"
	"time"
)

/**
 * Loop that runs every 12 hours to get stops from API and store them in a hashmap.
 * The hashmap is used to retrieve stops by pattern Id.
 */
func GetStopsHashMap(myHashMap *map[string]types.Stop) {
	ticker := time.NewTicker(12 * time.Hour)   
	defer ticker.Stop()                        // Ensures that the ticker stops when the function exits to free up resources
	
	//Run first time
	hashmap, err := getStopsHashMap()
	if err != nil {
		log.Println(err)
	}
	
	fmt.Printf("Found %d Stops \n", len(hashmap))
	*myHashMap = hashmap

	// This loop runs every time the ticker ticks
	for range ticker.C {
		hashmap, err := getStopsHashMap() // Call the function to execute cron jobs\
		if err != nil {
			log.Println(err)
		}

		fmt.Printf("Found %d Stops \n", len(hashmap))

		*myHashMap = hashmap
	}
}

/**
  * Gets stops from API and stores stops in a hashmap.
  * The hashmap is used to retrieve stops by pattern Id.
*/
func getStopsHashMap() (map[string]types.Stop, error) {
	stops, err := getStops()
	if err != nil {
		return nil, err
	}

	// Create a new map to store the stops by ID
	stopHashMap := make(map[string]types.Stop)
	for _, stop := range stops {
		stopHashMap[stop.Id] = stop
	}

	return stopHashMap, nil
}
 
/**
  * Gets stops from API
*/
func getStops() ([]types.Stop, error) {
	stops := []types.Stop{}

	// Make a GET request to the URL
	url :=  "https://api.carrismetropolitana.pt/v2/stops" //os.Getenv("")
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}

	// Check the status code of the response
	if resp.StatusCode != http.StatusOK {
	return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	// Decode the response body into a slice of Stops
	err = json.NewDecoder(resp.Body).Decode(&stops)
	if err != nil {
		return nil, err
	}

	defer resp.Body.Close() // Close the response body

	return stops, nil
}