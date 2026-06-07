# Build stage
FROM golang:1.25-alpine AS builder

RUN apk add --no-cache git

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -o image-service .

# Production stage — tiny final image
FROM alpine:latest

WORKDIR /app
COPY --from=builder /app/image-service .

EXPOSE 50051
CMD ["./image-service"]