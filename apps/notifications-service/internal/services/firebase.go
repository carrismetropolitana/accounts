package services

import (
	"context"
	"log"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/messaging"
	"google.golang.org/api/option"
)

type FirebaseService struct {
	app *firebase.App
}

func NewFirebaseService(credentialsPath string) *FirebaseService {
	opt := option.WithCredentialsFile(credentialsPath)
	app, err := firebase.NewApp(context.Background(), nil, opt)
	if err != nil {
		log.Fatalf("error initializing app: %v\n", err)
	}

	return &FirebaseService{app: app}
}

func (s *FirebaseService) SendToTopic(topic string, title string, body string, data string) error {
	ctx := context.Background()
	client, err := s.app.Messaging(ctx)
	if err != nil {
		return err
	}

	message := &messaging.Message{
		Notification: &messaging.Notification{
			Title: title,
			Body:  body,
		},
		Topic: topic,
		Data: map[string]string{
			"vehicle_id": data,
		},
	}

	_, err = client.Send(ctx, message)
	return err
} 