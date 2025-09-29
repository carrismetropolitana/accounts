package services

import (
	"fmt"
	"notifications-service/lib"
	"notifications-service/types"
	"sync"
	"time"
)

var seenVehicles sync.Map // thread-safe global map

func NotificationSenderService(notificationWidgets *[]types.NotificationWidget, vehiclesHashMap *map[string][]types.Vehicle) {
	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()

	notificationSenderService(notificationWidgets, vehiclesHashMap)

	for range ticker.C {
		notificationSenderService(notificationWidgets, vehiclesHashMap)
	}
}

func notificationSenderService(notificationWidgets *[]types.NotificationWidget, vehiclesHashMap *map[string][]types.Vehicle) {
	fmt.Println("⤷ Checking for notifications")

	if len(*vehiclesHashMap) == 0 {
		fmt.Println("Vehicles hashmap is empty")
		return
	}

	if len(*notificationWidgets) == 0 {
		fmt.Println("Notification widgets is empty")
		return
	}

	var wg sync.WaitGroup
	errChan := make(chan error, len(*notificationWidgets))

	for _, widget := range *notificationWidgets {
		wg.Add(1)

		go func(widget types.NotificationWidget) {
			defer wg.Done()

			vehicles, ok := (*vehiclesHashMap)[widget.PatternId]
			if !ok {
				fmt.Printf("Vehicle with PatternId %s not found\n", widget.PatternId)
				return
			}

			for _, vehicle := range vehicles {
				point := types.Point{X: vehicle.Lon, Y: vehicle.Lat}
				polygon := []types.Point{}

				if len(widget.GeoJSON.Geometry.Coordinates) <= 0 {
					fmt.Printf("Notification %s has no polygon\n", widget.Id)
					continue
				}

				for _, coordinate := range widget.GeoJSON.Geometry.Coordinates[0] {
					polygon = append(polygon, types.Point{X: coordinate[0], Y: coordinate[1]})
				}

				inPolygon := lib.PointInPolygon(point, polygon)

				if vehicle.Timestamp < time.Now().Add(-2*time.Minute).Unix() {
					continue
				}

				if inPolygon {
					// check in sync.Map
					_, exists := seenVehicles.Load(vehicle.Id)
					if exists {
						continue
					}

					seenVehicles.Store(vehicle.Id, true)

					fmt.Printf("Bus %s is within %v %s of Stop %s\n", vehicle.Id, widget.Distance, "m", widget.StopId)

					title := "Olha o autocarro! 👀 🚌 "
					body := fmt.Sprintf("O autocarro %s está a chegar à paragem %s", vehicle.LineId, widget.StopId)
					fmt.Println("Sending notification to expo push token:", widget.PushTokens)
					for _, pushToken := range widget.PushTokens {
						err := SendToExpoPushToken(pushToken, title, body, map[string]string{"vehicle_id": vehicle.Id})
						if err != nil {
							fmt.Printf("Error sending notification for vehicle %s and stop %s: %v\n", vehicle.Id, widget.StopId, err)
							return
						}
					}
				}

				if !inPolygon {
					seenVehicles.Delete(vehicle.Id) // reset when bus leaves
				}
			}
		}(widget)
	}

	wg.Wait()
	close(errChan)
}