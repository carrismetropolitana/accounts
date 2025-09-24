package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
)

func SendToExpoPushToken(expoPushToken string, title string, body string, data map[string]string) error {
	ctx := context.Background()

	message := map[string]interface{}{
		"to": expoPushToken,
		"title": title,
		"body": body,
		"data": data,
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "https://exp.host/--/api/v2/push/send", bytes.NewBuffer(messageBytes))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to send notification, status code: %d", resp.StatusCode)
	}

	return nil
}
