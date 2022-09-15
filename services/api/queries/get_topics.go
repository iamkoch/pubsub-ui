package queries

import (
	"cloud.google.com/go/pubsub"
	"context"
	log "github.com/sirupsen/logrus"
	"google.golang.org/api/iterator"
	"time"
)

type TopicModel struct {
	DisplayName string
	Id          string
}

type GetTopicsResponse struct {
	Topics []TopicModel
}

type GetTopicsQueryHandler func() (*GetTopicsResponse, error)

func NewGetTopicsQueryHandler(c *pubsub.Client) GetTopicsQueryHandler {
	return func() (*GetTopicsResponse, error) {

		topics := make([]TopicModel, 0)

		timeout, _ := context.WithTimeout(context.Background(), time.Second*5)

		it := c.Topics(timeout)

		for {
			topic, err := it.Next()

			if err == iterator.Done {
				break
			}

			if err != nil {
				log.WithError(err).Error("error iterating topics")
				return nil, err
			}

			topics = append(topics, TopicModel{
				DisplayName: topic.ID(),
				Id:          topic.String(),
			})
		}

		return &GetTopicsResponse{topics}, nil
	}
}
