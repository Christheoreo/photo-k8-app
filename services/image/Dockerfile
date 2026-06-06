# Build stage
FROM golang:1.25-alpine AS builder

RUN apk add --no-cache protobuf protobuf-dev git

WORKDIR /app

RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
RUN go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Generate proto files
RUN protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    proto/image.proto

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -o image-service .

# Production stage — tiny final image
FROM alpine:latest

WORKDIR /app
COPY --from=builder /app/image-service .

EXPOSE 50051
CMD ["./image-service"]