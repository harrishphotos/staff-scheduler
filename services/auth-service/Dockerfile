FROM golang:1.24-alpine AS builder

# Install git for go mod download
RUN apk add --no-cache git

WORKDIR /app

# Copy shared module first (dependency)
COPY services/shared/ ./services/shared/

# Copy Auth Service files
COPY services/auth-service/go.mod services/auth-service/go.sum ./services/auth-service/

# Change to service directory and download dependencies
WORKDIR /app/services/auth-service
RUN go mod download

# Copy the source code
WORKDIR /app
COPY services/auth-service/ ./services/auth-service/

# Build the application
WORKDIR /app/services/auth-service
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd

# Production stage
FROM alpine:latest

# Install ca-certificates for HTTPS requests, tzdata for timezone, and wget for health checks
RUN apk --no-cache add ca-certificates tzdata wget

WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /app/services/auth-service/main .

# Expose port
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3004/health || exit 1

# Command to run
CMD ["./main"] 