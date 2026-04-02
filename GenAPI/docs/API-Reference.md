# API Reference

GenAPI provides a structured way to handle HTTP requests.

## Endpoints (Current Placeholders)

- `GET /users`: Returns a list of placeholder users.

## Logging

The API uses structured JSON logging. Each request is logged with its status, method, path, latency, and client IP.

### Example log output:

```json
{"time":"2026-02-26T10:00:00Z","level":"INFO","msg":"request_completed","status":200,"method":"GET","path":"/users","latency":500000,"ip":"127.0.0.1"}
```
