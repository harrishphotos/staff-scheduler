FROM golang:1.24-alpine AS builder

# Install git for go mod download
RUN apk add --no-cache git

WORKDIR /app

# Copy shared module first (dependency)
COPY services/shared/ ./services/shared/

# Copy Employee Service files
COPY services/employee-service/go.mod services/employee-service/go.sum ./services/employee-service/

# Change to service directory and download dependencies
WORKDIR /app/services/employee-service
RUN go mod download

# Copy the source code
WORKDIR /app
COPY services/employee-service/ ./services/employee-service/

# Build the application
WORKDIR /app/services/employee-service
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd

# Production stage
FROM alpine:latest

# Install ca-certificates for HTTPS requests, tzdata for timezone, and wget for health checks
RUN apk --no-cache add ca-certificates tzdata wget

WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /app/services/employee-service/main .

# Expose port
EXPOSE 3002

# Health check - use PORT environment variable or fallback to 3002
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3002}/health || exit 1

# Command to run
CMD ["./main"] 