package auth_m

import (
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	config "gentools/genapi/configs"
	"gentools/genapi/internal/core/logger"
)

func GenAuth(dbpool *pgxpool.Pool, cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		api_key := c.GetHeader("API-KEY")
		clientIP := c.ClientIP()
		ctx := c.Request.Context()

		// Error log for missing API key
		if api_key == "" {
			// Log a warning to the system(Docker) logs.
			logger.Log.Warn(
				"Request missing API key",
				slog.String("ip", c.ClientIP()),
				slog.String("path", c.Request.URL.Path),
			)

			// Send a JSON response to the client with http.StatusUnauthorized
			c.JSON(http.StatusUnauthorized, gin.H{"error": "API key Required"})
			c.Abort()
			return
		}

		// Database check
		var registeredIP string
		err := dbpool.QueryRow(ctx, "SELECT ip_addr FROM api_keys WHERE key_value = $1", api_key).Scan(&registeredIP)
		if err != nil {
			logger.Log.Error(
				"Invalid API key attempt",
				slog.String("key", api_key),
				slog.String("ip", clientIP),
			)

			c.AbortWithStatusJSON(
				http.StatusUnauthorized,
				gin.H{
					"error": "Invalid API key",
				},
			)
			return
		}

		// Optional IP restriction
		// Only the registeredIP can make calls with the assigned api_key
		// This prevents api key sharing
		// Disabled by default
		if cfg.Auth.EnforceIP {
			if registeredIP != "" && registeredIP != clientIP {
				logger.Log.Warn(
					"IP Mismatch",
					slog.String("expected", registeredIP),
					slog.String("got", clientIP),
				)

				c.AbortWithStatusJSON(
					http.StatusForbidden,
					gin.H{
						"error": "IP address not allowed",
					},
				)
			}
		}

		c.Next()
	}
}
