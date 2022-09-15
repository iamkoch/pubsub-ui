package http

import (
	"api/models"
	"api/queries"
	"cloud.google.com/go/pubsub"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
)

func NewGetTopicsHandler(pubsubClient *pubsub.Client) echo.HandlerFunc {
	getTopics := queries.NewGetTopicsQueryHandler(pubsubClient)

	return func(c echo.Context) error {

		type topicModel struct {
			DisplayName string `json:"displayName"`
			Id          string `json:"id"`
		}

		t, e := getTopics()

		topics := make([]topicModel, 0)

		if e != nil {
			log.WithError(e).Error("retrieving topics")
			return c.JSON(500, models.ApiError{"ERROR_GET_TOPICS", e.Error()})
		}

		for _, topic := range t.Topics {
			topics = append(topics, topicModel{
				DisplayName: topic.DisplayName,
				Id:          topic.Id,
			})
		}

		return c.JSON(200, topics)
	}
}
