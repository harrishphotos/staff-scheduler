package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/salobook/services/service-management/internal/model"
	"github.com/salobook/services/service-management/internal/service"
)

func SetupRoutes(app *fiber.App) {
	api := app.Group("/api")

	// Service Routes
	api.Post("/services", createService)
	api.Get("/services", getAllServices)
	api.Get("/services/:id", getServiceByID)
	api.Put("/services/:id", updateService)
	api.Delete("/services/:id", deleteService)

	// Category Routes
	api.Post("/categories", createCategory)
	api.Get("/categories", getAllCategories)
	api.Get("/categories/:id", getCategoryByID)
	api.Put("/categories/:id", updateCategory)
	api.Delete("/categories/:id", deleteCategory)

	// Package Routes
	api.Post("/packages", createPackage)
	api.Get("/packages", getAllPackages)
	api.Get("/packages/:id", getPackageByID)
	api.Put("/packages/:id", updatePackage)
	api.Delete("/packages/:id", deletePackage)
}

// ---- Service ----

func createService(c *fiber.Ctx) error {
	var s model.Service
	if err := c.BodyParser(&s); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	err := service.CreateService(&s)
	return jsonResult(c, err, s)
}

func getAllServices(c *fiber.Ctx) error {
	data, err := service.GetAllServices()
	return jsonResult(c, err, data)
}

func getServiceByID(c *fiber.Ctx) error {
	id := c.Params("id")
	data, err := service.GetServiceByID(id)
	return jsonResult(c, err, data)
}

func updateService(c *fiber.Ctx) error {
	id := c.Params("id")
	var s model.Service
	if err := c.BodyParser(&s); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	s.ServiceID, _ = uuid.Parse(id)
	err := service.UpdateService(&s)
	return jsonResult(c, err, s)
}

func deleteService(c *fiber.Ctx) error {
	id := c.Params("id")
	err := service.DeleteService(id)
	return jsonResult(c, err, fiber.Map{"deleted": true})
}

// ---- Category ----

func createCategory(c *fiber.Ctx) error {
	var cat model.Category
	if err := c.BodyParser(&cat); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	err := service.CreateCategory(&cat)
	return jsonResult(c, err, cat)
}

func getAllCategories(c *fiber.Ctx) error {
	data, err := service.GetAllCategories()
	return jsonResult(c, err, data)
}

func getCategoryByID(c *fiber.Ctx) error {
	id := c.Params("id")
	data, err := service.GetCategoryByID(id)
	return jsonResult(c, err, data)
}

func updateCategory(c *fiber.Ctx) error {
	id := c.Params("id")
	var cat model.Category
	if err := c.BodyParser(&cat); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	cat.CategoryID, _ = uuid.Parse(id)
	err := service.UpdateCategory(&cat)
	return jsonResult(c, err, cat)
}

func deleteCategory(c *fiber.Ctx) error {
	id := c.Params("id")
	err := service.DeleteCategory(id)
	return jsonResult(c, err, fiber.Map{"deleted": true})
}

// ---- Package ----

func createPackage(c *fiber.Ctx) error {
	var p model.Package
	if err := c.BodyParser(&p); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	err := service.CreatePackage(&p)
	return jsonResult(c, err, p)
}

func getAllPackages(c *fiber.Ctx) error {
	data, err := service.GetAllPackages()
	return jsonResult(c, err, data)
}

func getPackageByID(c *fiber.Ctx) error {
	id := c.Params("id")
	data, err := service.GetPackageByID(id)
	return jsonResult(c, err, data)
}

func updatePackage(c *fiber.Ctx) error {
	id := c.Params("id")
	var p model.Package
	if err := c.BodyParser(&p); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	p.PackageID, _ = uuid.Parse(id)
	err := service.UpdatePackage(&p)
	return jsonResult(c, err, p)
}

func deletePackage(c *fiber.Ctx) error {
	id := c.Params("id")
	err := service.DeletePackage(id)
	return jsonResult(c, err, fiber.Map{"deleted": true})
}

// Helper for consistent JSON response
func jsonResult(c *fiber.Ctx, err error, data interface{}) error {
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(data)
}
