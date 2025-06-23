# API Gateway Service

This service acts as a gateway/proxy for all backend services in the Salo application. It routes incoming requests from frontend applications to the appropriate backend services.

## How It Works

The API Gateway serves as a single entry point for all frontend requests. It:

1. Receives requests from frontend applications
2. Determines which backend service should handle the request based on the URL path
3. Forwards the request to the appropriate service
4. Returns the response from the backend service to the client

## Current Routes

- `/health` - Health check endpoint for the gateway itself
- `/api/employees/*` - All requests are forwarded to the Employee Service

## Environment Variables

- `GATEWAY_PORT` - Port on which the gateway listens (default: 8080)
- `EMPLOYEE_SERVICE_URL` - URL of the Employee Service (default: http://localhost:3002)
- `BOOKING_SERVICE_URL` - URL of the Booking Service (default: http://localhost:3001)
- `SERVICE_MANAGEMENT_SERVICE_URL` - URL of the Service Management Service (default: http://localhost:3003)

## Running the Service

```bash
# Build the service
go build -o bin/api-gateway cmd/main.go

# Run the service
./bin/api-gateway
```

## Adding New Services

To add a new service to the gateway:

1. Add a new forwarding function in `internal/proxy/proxy.go`
2. Register the routes in `internal/handler/routes.go`
3. Update the environment variables to include the new service URL

## Future Enhancements

- Authentication middleware
- Request rate limiting
- Response caching
- Circuit breaking for resilience
- Request/response transformation
- Metrics collection
