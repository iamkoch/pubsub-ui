package http

import (
	"cloud.google.com/go/pubsub"
	"context"
	"database/sql"
	"encoding/json"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
)

type Message struct {
	Payload interface{} `json:"payload"`
}

func NewPostMessageToTopicHandler(
	ctx context.Context,
	pc *pubsub.Client,
	db *sql.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		msg := new(Message)
		err := c.Bind(&msg)
		if err != nil {
			log.WithError(err).Error("unable to bind request model")
			return c.NoContent(400)
		}

		topic := pc.Topic(c.Param("topic_name"))
		//topic.EnableMessageOrdering = true

		p, err := json.Marshal(msg.Payload)

		if err != nil {
			log.WithError(err).Error("error unmarshalling payload")
		}

		r := topic.Publish(ctx, &pubsub.Message{
			Data: []byte(p),
			//OrderingKey: "123",

		})

		if _, err := r.Get(ctx); err != nil {
			log.WithError(err).Error("error returned when retrieving publish result")
			return c.NoContent(500)
		}

		stmt, err := db.Prepare("INSERT INTO sent (payload) VALUES (?)")
		_, err = stmt.Exec(string(p))

		log.WithField("msg", msg).WithField("topic", topic).Info("posted message to topic")

		return c.NoContent(204)
	}
}
