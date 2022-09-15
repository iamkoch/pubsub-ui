package http

import (
	"api/commands"
	"api/models"
	"api/subscriptions"
	"cloud.google.com/go/pubsub"
	"context"
	"fmt"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
)

type locationResponse struct {
	Location string `json:"location"`
}

type subscribeRequestModel struct {
	EnableMessageOrdering bool `json:"enable_message_ordering"`
}

func NewSubscribeToTopicHandler(ctx context.Context, pc *pubsub.Client) echo.HandlerFunc {
	handler := commands.NewSubscribeToTopicQuery(pc)

	return func(c echo.Context) error {
		topicName := c.Param("topic")

		var req subscribeRequestModel

		if e := c.Bind(&req); e != nil {
			return c.JSON(400, e)
		}

		sub, exists := subscriptions.ForTopic(topicName)

		if exists {
			log.WithFields(log.Fields{
				"topic":  topicName,
				"sub_id": sub.Id().String(),
			}).Info("subscription already exists")

			location := fmt.Sprintf("/topics/%s/subscriptions/%s", topicName, sub.Id().String())
			c.Response().Header().Set("location", location)
			return c.JSON(201, locationResponse{location})
		}

		ch := make(chan commands.ReceivedMessage)

		q := commands.SubscribeToTopicCommand{
			Topic:                 topicName,
			TopicId:               topicName,
			EnableMessageOrdering: req.EnableMessageOrdering,
			Messages:              ch,
		}

		e := handler(q)

		if e != nil {
			return c.JSON(400, models.ApiError{
				Code: "ERROR_SUBSCRIBING_TO_TOPIC",
				Msg:  e.Error()})
		}

		sub = subscriptions.NewSubscription(topicName, ch)

		location := fmt.Sprintf("/topics/%s/subscriptions/%s", topicName, sub.Id().String())
		c.Response().Header().Set("location", location)
		return c.JSON(201, locationResponse{location})

	}
}
