package repository

import (
	"services/shared/db"
	"github.com/salobook/services/service-management/internal/model"
)

func CreateService(service *model.Service) error {
	return db.DB.Create(service).Error
}

func GetAllServices() ([]model.Service, error) {
	var services []model.Service
	err := db.DB.Preload("Categories").Find(&services).Error
	return services, err
}

func GetServiceByID(id string) (model.Service, error) {
	var service model.Service
	err := db.DB.Preload("Categories").First(&service, "service_id = ?", id).Error
	return service, err
}

func UpdateService(service *model.Service) error {
	return db.DB.Save(service).Error
}

func DeleteService(id string) error {
	return db.DB.Delete(&model.Service{}, "service_id = ?", id).Error
}

// Repeat for Category and Package below...

func CreateCategory(cat *model.Category) error {
	return db.DB.Create(cat).Error
}

func GetAllCategories() ([]model.Category, error) {
	var cats []model.Category
	err := db.DB.Find(&cats).Error
	return cats, err
}

func GetCategoryByID(id string) (model.Category, error) {
	var cat model.Category
	err := db.DB.First(&cat, "category_id = ?", id).Error
	return cat, err
}

func UpdateCategory(cat *model.Category) error {
	return db.DB.Save(cat).Error
}

func DeleteCategory(id string) error {
	return db.DB.Delete(&model.Category{}, "category_id = ?", id).Error
}

// Package CRUD

func CreatePackage(pkg *model.Package) error {
	return db.DB.Create(pkg).Error
}

func GetAllPackages() ([]model.Package, error) {
	var pkgs []model.Package
	err := db.DB.Preload("Categories").Preload("Services").Find(&pkgs).Error
	return pkgs, err
}

func GetPackageByID(id string) (model.Package, error) {
	var pkg model.Package
	err := db.DB.Preload("Categories").Preload("Services").First(&pkg, "package_id = ?", id).Error
	return pkg, err
}

func UpdatePackage(pkg *model.Package) error {
	return db.DB.Save(pkg).Error
}

func DeletePackage(id string) error {
	return db.DB.Delete(&model.Package{}, "package_id = ?", id).Error
}
