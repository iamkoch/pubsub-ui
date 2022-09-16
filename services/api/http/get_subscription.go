package http

import (
	"api/models"
	"api/subscriptions"
	"cloud.google.com/go/pubsub"
	"fmt"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
)

func NewGetSubscriptionHandler(pubsubClient *pubsub.Client) echo.HandlerFunc {
	return func(e echo.Context) error {
		topicName := e.Param("topic")

		log.WithField("topic", topicName).Info("getting subscription")

		sub, exists := subscriptions.ForTopic(topicName)

		if !exists {
			log.WithField("topic", topicName).Info("subscription does not exist")
			return e.JSON(404, models.ApiError{
				Code: "NON_EXISTENT_TOPIC",
				Msg:  fmt.Sprintf("The topic you requested '%s' does not exist", topicName),
			})
		}

		if sub.Id().String() != e.Param("id") {
			return e.JSON(404, models.ApiError{
				Code: "NON_EXISTENT_SUBSCRIPTION",
				Msg:  fmt.Sprintf("The subscription you requested '%s' does not exist", sub.Id().String()),
			})
		}

		log.WithField("topic", topicName).WithField("count", sub.MessageCount()).Debug("retrieving messages for topic")

		return e.JSON(200, sub.Messages())
	}
}
