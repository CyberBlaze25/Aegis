package router

import (
	"net/http"

	config "gentools/genapi/configs"
	auth_m "gentools/genapi/internal/middleware/auth_m"
	logger_m "gentools/genapi/internal/middleware/logger"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type user struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

var users = []user{
	{ID: "1", Name: "11"},
	{ID: "2", Name: "22"},
	{ID: "3", Name: "33"},
}

func NewRouterRun(url string, dbpool *pgxpool.Pool, cfg *config.Config) {
	r := gin.New()

	r.Use(gin.Recovery())
	r.Use(logger_m.GenLogger())

	r.Use(auth_m.GenAuth(dbpool, cfg))

	r.GET("/users", get_users)
	r.Run(cfg.Server.Host + ":" + cfg.Server.Port)
}

func get_users(c *gin.Context) {
	c.IndentedJSON(http.StatusOK, users)
}
