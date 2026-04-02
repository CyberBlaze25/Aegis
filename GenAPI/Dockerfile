# --- STAGE 1: The "Kitchen" (Builder) ---
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Your cache trick (Keep this!)
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# We add two flags here:
# CGO_ENABLED=0 makes the binary "static" (it carries everything it needs inside it)
# GOOS=linux ensures it runs on Linux even if you build it on a Mac/Windows
RUN CGO_ENABLED=0 GOOS=linux go build -o genapi ./cmd/api/main.go


# --- STAGE 2: The "Dining Table" (Runner) ---
FROM alpine:latest

# Security tip: Don't run as "root" user in the real world, 
# but for now, let's keep it simple.
WORKDIR /root/

# This is the magic line. 
# We reach back to the "builder" stage and grab ONLY the binary.
COPY --from=builder /app/genapi .

# Also copy your config folder so the binary can find your .yml files
COPY --from=builder /app/configs ./configs

# Start the app
CMD ["./genapi"]
