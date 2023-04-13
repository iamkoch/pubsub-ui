package http

import (
	"api/models"
	"api/subscriptions"
	"cloud.google.com/go/pubsub"
	"database/sql"
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

func NewGetSentMessagesHandler(db *sql.DB) echo.HandlerFunc {
	type (
		SentMessageResponseModel struct {
			Id      int    `json:"id"`
			Payload string `json:"payload"`
		}

		SentMessagesResponseModel struct {
			Messages []SentMessageResponseModel `json:"messages"`
		}
	)
	return func(e echo.Context) error {
		rows, err := db.Query("SELECT * FROM sent")
		if err != nil {
			log.WithError(err).Error("unable to query db")
			return e.JSON(500, models.ApiError{
				Code: "DB_ERROR",
				Msg:  "Unable to query db",
			})
		}
		res := make([]SentMessageResponseModel, 0)

		for rows.Next() {
			s := SentMessageResponseModel{}
			err = rows.Scan(&s.Id, &s.Payload)
			if err != nil {
				log.WithError(err).Error("unable to scan row")
			} else {
				res = append(res, s)
			}
		}

		rows.Close()

		return e.JSON(200, res)
	}
}
