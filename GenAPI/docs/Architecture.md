# Project Architecture

GenAPI follows a modular architecture to facilitate easy extension and maintainability.

## Directory Structure

- `cmd/api/`: Application entry point.
- `configs/`: Configuration files (e.g., `config.yml`).
- `internal/core/`: Essential infrastructure components (DB, Logger, Router).
- `internal/middleware/`: Custom Gin middlewares.
- `internal/modules/`: Domain-specific business logic. This is where you should add new features.
- `pkg/`: Publicly exportable utility packages.
