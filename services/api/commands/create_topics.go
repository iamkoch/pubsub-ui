package commands

import (
	"cloud.google.com/go/pubsub"
	"context"
)

type CreateTopicCommand struct {
	TopicName string
}

type CreateTopicResult struct {
	ID string
}

type CreateTopicCommandHandler func(c CreateTopicCommand) (*CreateTopicResult, error)

func NewCreateTopicCommandHandler(c *pubsub.Client) CreateTopicCommandHandler {
	return func(cmd CreateTopicCommand) (*CreateTopicResult, error) {
		topic, err := c.CreateTopicWithConfig(context.Background(), cmd.TopicName, &pubsub.TopicConfig{})

		if err != nil {
			return nil, err
		}

		return &CreateTopicResult{topic.String()}, nil
	}
}
