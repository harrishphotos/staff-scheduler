package handler

import (
	"services/api-gateway/internal/middleware"
	"services/api-gateway/internal/proxy"

	"github.com/gofiber/fiber/v2"
)

// SetupRoutes configures all the routes for the API Gateway
func SetupRoutes(app *fiber.App) {
	// Health check endpoint
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "UP",
			"service": "api-gateway",
		})
	})

	// Auth service routes - unprotected (no middleware)
	auth := app.Group("/api/auth")
	auth.Post("/register", proxy.ForwardToAuthService)
	auth.Post("/login", proxy.ForwardToAuthService)
	auth.Get("/verify-email", proxy.ForwardToAuthService)
	auth.Post("/refresh", proxy.ForwardToAuthService)
	auth.Post("/forgot-password", proxy.ForwardToAuthService)
	auth.Post("/reset-password", proxy.ForwardToAuthService)
	auth.Post("/logout", proxy.ForwardToAuthService)
	auth.Post("/validate", proxy.ForwardToAuthService)

	// Protected routes - require authentication
	protected := app.Group("/api", middleware.AuthMiddleware())

	// Employee Management Routes - all forwarded to employee service
	employees := protected.Group("/employees")
	employees.Get("/", proxy.ForwardToEmployeeService)        // GET /api/employees/ -> /employees
	employees.Post("/", proxy.ForwardToEmployeeService)       // POST /api/employees/ -> /employees
	employees.Get("/:id", proxy.ForwardToEmployeeService)     // GET /api/employees/:id -> /employees/:id
	employees.Put("/:id", proxy.ForwardToEmployeeService)     // PUT /api/employees/:id -> /employees/:id
	employees.Delete("/:id", proxy.ForwardToEmployeeService)  // DELETE /api/employees/:id -> /employees/:id

	// Employee-Service Association Routes - forwarded to employee service
	employeeServices := protected.Group("/employee-services")
	employeeServices.Get("/", proxy.ForwardToEmployeeService)        // GET /api/employee-services/ -> /employee-services
	employeeServices.Post("/", proxy.ForwardToEmployeeService)       // POST /api/employee-services/ -> /employee-services
	employeeServices.Get("/:id", proxy.ForwardToEmployeeService)     // GET /api/employee-services/:id -> /employee-services/:id
	employeeServices.Delete("/:id", proxy.ForwardToEmployeeService)  // DELETE /api/employee-services/:id -> /employee-services/:id

	// Schedule Management Routes - forwarded to employee service
	schedules := protected.Group("/schedules")
	schedules.Get("/", proxy.ForwardToEmployeeService)        // GET /api/schedules/ -> /schedules
	schedules.Post("/", proxy.ForwardToEmployeeService)       // POST /api/schedules/ -> /schedules
	schedules.Get("/:id", proxy.ForwardToEmployeeService)     // GET /api/schedules/:id -> /schedules/:id
	schedules.Put("/:id", proxy.ForwardToEmployeeService)     // PUT /api/schedules/:id -> /schedules/:id
	schedules.Delete("/:id", proxy.ForwardToEmployeeService)  // DELETE /api/schedules/:id -> /schedules/:id

	// One-time Block Management Routes - forwarded to employee service
	onetimeBlocks := protected.Group("/onetime-blocks")
	onetimeBlocks.Get("/", proxy.ForwardToEmployeeService)        // GET /api/onetime-blocks/ -> /onetime-blocks
	onetimeBlocks.Post("/", proxy.ForwardToEmployeeService)       // POST /api/onetime-blocks/ -> /onetime-blocks
	onetimeBlocks.Get("/:id", proxy.ForwardToEmployeeService)     // GET /api/onetime-blocks/:id -> /onetime-blocks/:id
	onetimeBlocks.Put("/:id", proxy.ForwardToEmployeeService)     // PUT /api/onetime-blocks/:id -> /onetime-blocks/:id
	onetimeBlocks.Delete("/:id", proxy.ForwardToEmployeeService)  // DELETE /api/onetime-blocks/:id -> /onetime-blocks/:id

	// Recurring Break Management Routes - forwarded to employee service
	recurringBreaks := protected.Group("/recurring-breaks")
	recurringBreaks.Get("/", proxy.ForwardToEmployeeService)        // GET /api/recurring-breaks/ -> /recurring-breaks
	recurringBreaks.Post("/", proxy.ForwardToEmployeeService)       // POST /api/recurring-breaks/ -> /recurring-breaks
	recurringBreaks.Get("/:id", proxy.ForwardToEmployeeService)     // GET /api/recurring-breaks/:id -> /recurring-breaks/:id
	recurringBreaks.Put("/:id", proxy.ForwardToEmployeeService)     // PUT /api/recurring-breaks/:id -> /recurring-breaks/:id
	recurringBreaks.Delete("/:id", proxy.ForwardToEmployeeService)  // DELETE /api/recurring-breaks/:id -> /recurring-breaks/:id

	// Future routes for additional services can be added here
}
