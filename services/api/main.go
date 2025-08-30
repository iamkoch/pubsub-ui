package main

import (
	"api/http"
	"cloud.google.com/go/pubsub"
	"context"
	"database/sql"
	"embed"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	_ "github.com/mattn/go-sqlite3"
	log "github.com/sirupsen/logrus"
	"io/fs"
	"os"
)

var (
	ProjectId = os.Getenv("PROJECT_ID")
	//go:embed ui/build
	staticFiles embed.FS
)

func main() {
	ctx := context.Background()

	log.WithFields(log.Fields{
		"project": ProjectId,
	}).Infof("starting server...")

	e := echo.New()
	e.Use(middleware.CORSWithConfig(middleware.DefaultCORSConfig))
	sub, _ := fs.Sub(staticFiles, "ui/build")
	subFS := echo.MustSubFS(sub, "")
	e.StaticFS("/", subFS)
	pc, err := pubsub.NewClient(ctx, ProjectId)

	if err != nil {
		log.WithError(err).WithField("project", ProjectId).Error("unable to create client")
		panic("couldn't create client")
	}

	db, err := sql.Open("sqlite3", "./pubsubui.db")

	if err != nil {
		log.WithError(err).Error("unable to open db")
		panic("couldn't open db")
	}

	_, err = db.Exec("CREATE TABLE `sent` (`msg_id` INTEGER PRIMARY KEY AUTOINCREMENT, `payload` text NOT NULL)")

	if err != nil {
		log.WithError(err).Error("unable to create table")
	}

	e.GET("/topics", http.NewGetTopicsHandler(pc))
	e.POST("/topics", http.NewCreateTopicHandler(pc))
	e.POST("/topics/:topic_name", http.NewPostMessageToTopicHandler(ctx, pc, db))
	e.POST("/topics/:topic/subscriptions", http.NewSubscribeToTopicHandler(ctx, pc))
	e.GET("/topics/:topic/subscriptions/:id", http.NewGetSubscriptionHandler(pc))

	e.GET("/history/sent", http.NewGetSentMessagesHandler(db))
    port := os.Getenv("PORT")
    if port == "" {
        port = "6969"
    }
    e.Logger.Fatal(e.Start(":"+port))
}
