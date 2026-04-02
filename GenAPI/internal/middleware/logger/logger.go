package middleware

import (
	"time"

	"gentools/genapi/internal/core/logger"

	"github.com/gin-gonic/gin"
)

func GenLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()

		logger.Log.Info(
			"request_completed",
			"status", status,
			"method", c.Request.Method,
			"path", path,
			"latency", latency,
			"ip", c.ClientIP(),
		)
	}
}
