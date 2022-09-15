package main

import (
	"api/http"
	"cloud.google.com/go/pubsub"
	"context"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	log "github.com/sirupsen/logrus"
	"os"
)

var (
	ProjectId = os.Getenv("PROJECT_ID")
)

func main() {
	ctx := context.Background()

	e := echo.New()
	e.Use(middleware.CORSWithConfig(middleware.DefaultCORSConfig))

	pc, err := pubsub.NewClient(ctx, ProjectId)

	if err != nil {
		log.WithError(err).WithField("project", ProjectId).Error("unable to create client")
		panic("couldn't create client")
	}

	e.GET("/topics", http.NewGetTopicsHandler(pc))
	e.POST("/topics", http.NewCreateTopicHandler(pc))
	e.POST("/topics/:topic_name", http.NewPostMessageToTopicHandler(ctx, pc))
	e.POST("/topics/:topic/subscriptions", http.NewSubscribeToTopicHandler(ctx, pc))
	e.GET("/topics/:topic/subscriptions/:id", http.NewGetSubscriptionHandler(pc))

	e.Logger.Fatal(e.Start(":8080"))
}
