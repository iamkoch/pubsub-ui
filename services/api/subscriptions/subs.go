package subscriptions

import (
	"api/commands"
	"api/models"
	"github.com/rs/xid"
	log "github.com/sirupsen/logrus"
)

var (
	trackedSubscriptions = make(map[string]*Subscription)
)

type Subscription struct {
	id       xid.ID
	messages []models.Json
}

func (s *Subscription) Id() xid.ID {
	return s.id
}

func (s *Subscription) Messages() []models.Json {
	return s.messages
}

func (s *Subscription) MessageCount() int {
	return len(s.messages)
}

func (s *Subscription) Add(newMsg map[string]interface{}) {
	s.messages = append(s.messages, newMsg)
}

func (s *Subscription) Watch(c chan commands.ReceivedMessage) {
loop:
	for {
		select {
		case newMsg, ok := <-c:
			if !ok {
				log.Error("channel closed")
				break loop
			} else {
				log.WithField("msg", newMsg).Info("msg received from channel")
				s.Add(newMsg)
			}
		}
	}
}

func NewSubscription(topicName string, c chan commands.ReceivedMessage) *Subscription {
	sub := &Subscription{
		id:       xid.New(),
		messages: make([]models.Json, 0),
	}

	trackedSubscriptions[topicName] = sub

	go sub.Watch(c)

	return sub
}

func ForTopic(topic string) (*Subscription, bool) {
	s, e := trackedSubscriptions[topic]
	return s, e
}
