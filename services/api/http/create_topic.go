package http

import (
	"api/commands"
	"api/models"
	"cloud.google.com/go/pubsub"
	"github.com/labstack/echo/v4"
)

func NewCreateTopicHandler(pc *pubsub.Client) echo.HandlerFunc {
	handler := commands.NewCreateTopicCommandHandler(pc)

	return func(c echo.Context) error {
		type createTopicRequest struct {
			TopicName string `json:"topicName"`
		}

		r := new(createTopicRequest)
		if err := c.Bind(&r); err != nil {
			return c.JSON(400, &models.ApiError{
				Code: "ERROR_READING_CREATE_TOPIC_CONTENT",
				Msg:  "An error occurred reading the create topic content: " + err.Error(),
			})
		}

		cmd := commands.CreateTopicCommand{TopicName: r.TopicName}

		creatTopicResult, err := handler(cmd)

		if err != nil {
			return c.JSON(400, &models.ApiError{
				Code: "ERROR_CREATING_TOPIC",
				Msg:  "An error occurred creating the topic: " + err.Error(),
			})
		}

		return c.JSON(200, creatTopicResult)
	}
}
