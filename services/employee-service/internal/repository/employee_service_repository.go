package repository

import (
	"services/shared/db"

	"github.com/google/uuid"
	"github.com/salobook/services/employee-service/internal/model"
)

// CreateEmployeeService creates a new employee-service association
func CreateEmployeeService(employeeService *model.EmployeeService) error {
	// Generate a UUID if one isn't provided
	if employeeService.ID == uuid.Nil {
		employeeService.ID = uuid.New()
	}
	return db.DB.Create(employeeService).Error
}

// GetAllEmployeeServices returns all employee-service associations
func GetAllEmployeeServices() ([]model.EmployeeService, error) {
	var employeeServices []model.EmployeeService
	err := db.DB.Find(&employeeServices).Error
	return employeeServices, err
}

// GetEmployeeServiceByID returns an employee-service association by ID
func GetEmployeeServiceByID(id uuid.UUID) (model.EmployeeService, error) {
	var employeeService model.EmployeeService
	err := db.DB.Where("id = ?", id).First(&employeeService).Error
	return employeeService, err
}

// GetEmployeeServicesByEmployeeID returns all services associated with an employee
func GetEmployeeServicesByEmployeeID(employeeID uuid.UUID) ([]model.EmployeeService, error) {
	var employeeServices []model.EmployeeService
	err := db.DB.Where("employee_id = ?", employeeID).Find(&employeeServices).Error
	return employeeServices, err
}

// GetEmployeeServicesByServiceID returns all employees associated with a service
func GetEmployeeServicesByServiceID(serviceID uuid.UUID) ([]model.EmployeeService, error) {
	var employeeServices []model.EmployeeService
	err := db.DB.Where("service_id = ?", serviceID).Find(&employeeServices).Error
	return employeeServices, err
}

// GetFilteredEmployeeServices returns employee-service associations based on filter criteria
func GetFilteredEmployeeServices(employeeID *uuid.UUID, serviceID *uuid.UUID) ([]model.EmployeeService, error) {
	query := db.DB.Model(&model.EmployeeService{})
	
	// Filter by employee ID if provided
	if employeeID != nil {
		query = query.Where("employee_id = ?", *employeeID)
	}
	
	// Filter by service ID if provided
	if serviceID != nil {
		query = query.Where("service_id = ?", *serviceID)
	}
	
	var employeeServices []model.EmployeeService
	err := query.Find(&employeeServices).Error
	return employeeServices, err
}

// CheckDuplicateEmployeeService checks if an association already exists
func CheckDuplicateEmployeeService(employeeID uuid.UUID, serviceID uuid.UUID) (bool, error) {
	var count int64
	err := db.DB.Model(&model.EmployeeService{}).
		Where("employee_id = ? AND service_id = ?", employeeID, serviceID).
		Count(&count).Error
	return count > 0, err
}

// DeleteEmployeeService deletes an employee-service association
func DeleteEmployeeService(id uuid.UUID) error {
	return db.DB.Delete(&model.EmployeeService{}, id).Error
} 