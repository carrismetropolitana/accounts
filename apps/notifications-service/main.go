package main

import (
	"fmt"
	"notifications-service/services"
	"notifications-service/types"
)

func main() {
	fmt.Println("Starting Notifications Service")
	
	// Get Vehicles HashMap
	var vehiclesHashMap = make(map[string][]types.Vehicle)
   	go services.GetVehiclesHashMap(&vehiclesHashMap)

	// Get Active Notifications
	var activeNotifications = make([]types.NotificationWidget, 0)
	go services.GetActiveNotifications(&activeNotifications)

	// Send Notifications
	services.NotificationSenderService(&activeNotifications, &vehiclesHashMap)
}