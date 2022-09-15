package commands

import (
	"cloud.google.com/go/pubsub"
	"context"
	"encoding/json"
	"fmt"
	log "github.com/sirupsen/logrus"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"os/user"
	"time"
)

type ReceivedMessage map[string]interface{}

type SubscribeToTopicCommand struct {
	Topic                 string
	TopicId               string
	EnableMessageOrdering bool
	Messages              chan ReceivedMessage
}

type UnableToCreateSubscription struct {
	Err error
}

func (e *UnableToCreateSubscription) Error() string {
	return "couldn't create a subscription: " + e.Err.Error()
}

type SubscribeToTopic func(q SubscribeToTopicCommand) error

func NewSubscribeToTopicQuery(c *pubsub.Client) SubscribeToTopic {
	return func(q SubscribeToTopicCommand) error {
		t := c.Topic(q.TopicId)

		timeout, cancel := context.WithTimeout(context.Background(), time.Second*5)
		defer cancel()
		currentUser, err := user.Current()

		if err != nil {
			log.WithError(err).Error("couldn't get current user")
			return err
		}

		username := currentUser.Username

		subscriptionName := fmt.Sprintf("%s-pubsub_ui-%s", t.ID(), username)

		log.WithFields(log.Fields{
			subscriptionName: subscriptionName,
			"topic":          t.ID(),
			"username":       username,
		}).Info("creating subscription")

		s, e := c.CreateSubscription(timeout, subscriptionName, pubsub.SubscriptionConfig{
			Topic:                 t,
			EnableMessageOrdering: q.EnableMessageOrdering,
		})

		if e != nil {
			if status.Code(e) == codes.AlreadyExists {
				s = c.Subscription(subscriptionName)
			} else {
				log.WithError(e).WithField("sub", subscriptionName).Error("error creating subscription")
				return &UnableToCreateSubscription{e}
			}
		} else {
			log.WithFields(log.Fields{
				"topic":             t.ID(),
				"subscription_name": subscriptionName,
			}).Info("created subscription")
		}

		go func() {
			e := s.Receive(context.Background(), func(ctx context.Context, msg *pubsub.Message) {
				var result map[string]interface{}
				// Unmarshal or Decode the JSON to the interface.
				if e := json.Unmarshal([]byte(string(msg.Data)), &result); e != nil {
					log.WithFields(log.Fields{"sub": s.String()}).WithError(e).Error("error unmarshalling json")
					msg.Ack()
				} else {
					log.WithField("msg", result).Info("received message from pubsub. sending to channel")
					q.Messages <- result
					msg.Ack()
				}
			})

			if e != nil {
				log.WithError(e).Error("error subscribing!")
			}
		}()

		return nil
	}
}
