# Development Guide

This guide explains how to extend GenAPI with new features and customize its behavior.

## Adding a New Module

1. Create a new directory under `internal/modules/` (e.g., `internal/modules/my_feature`).
2. Implement your handlers, services, and models within that directory.
3. Register your routes in `internal/core/router/gin.go` (or create a registration mechanism in your module and call it from the core router).

## Modifying the Logger

The logger is initialized in `internal/core/logger/logger.go`. You can customize the output format or level there.
