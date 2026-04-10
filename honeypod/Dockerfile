FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY main.go .
RUN go build -o honeypod main.go

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/honeypod .
EXPOSE 4444 8081
CMD ["./honeypod"]
