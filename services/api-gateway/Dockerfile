FROM golang:1.24-alpine AS builder

# Install git for go mod download
RUN apk add --no-cache git

WORKDIR /app

# Copy shared module first (dependency)
COPY services/shared/ ./services/shared/

# Copy API Gateway files
COPY services/api-gateway/go.mod services/api-gateway/go.sum ./services/api-gateway/

# Change to service directory and download dependencies
WORKDIR /app/services/api-gateway
RUN go mod download

# Copy the source code
WORKDIR /app
COPY services/api-gateway/ ./services/api-gateway/

# Build the application
WORKDIR /app/services/api-gateway
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd

# Production stage
FROM alpine:latest

# Install ca-certificates for HTTPS requests, tzdata for timezone, and wget for health checks
RUN apk --no-cache add ca-certificates tzdata wget

WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /app/services/api-gateway/main .

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8081/health || exit 1

# Command to run
CMD ["./main"] 