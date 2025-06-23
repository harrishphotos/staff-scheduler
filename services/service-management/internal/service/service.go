package service

import (
	"github.com/salobook/services/service-management/internal/model"
	"github.com/salobook/services/service-management/internal/repository"
)

// Service
func CreateService(s *model.Service) error {
	return repository.CreateService(s)
}

func GetAllServices() ([]model.Service, error) {
	return repository.GetAllServices()
}

func GetServiceByID(id string) (model.Service, error) {
	return repository.GetServiceByID(id)
}

func UpdateService(s *model.Service) error {
	return repository.UpdateService(s)
}

func DeleteService(id string) error {
	return repository.DeleteService(id)
}

// Category
func CreateCategory(c *model.Category) error {
	return repository.CreateCategory(c)
}

func GetAllCategories() ([]model.Category, error) {
	return repository.GetAllCategories()
}

func GetCategoryByID(id string) (model.Category, error) {
	return repository.GetCategoryByID(id)
}

func UpdateCategory(c *model.Category) error {
	return repository.UpdateCategory(c)
}

func DeleteCategory(id string) error {
	return repository.DeleteCategory(id)
}

// Package
func CreatePackage(p *model.Package) error {
	return repository.CreatePackage(p)
}

func GetAllPackages() ([]model.Package, error) {
	return repository.GetAllPackages()
}

func GetPackageByID(id string) (model.Package, error) {
	return repository.GetPackageByID(id)
}

func UpdatePackage(p *model.Package) error {
	return repository.UpdatePackage(p)
}

func DeletePackage(id string) error {
	return repository.DeletePackage(id)
}
