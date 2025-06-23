package repository

import (
	"services/shared/db"

	"github.com/salobook/services/employee-service/internal/model"

	"github.com/google/uuid"
)

// CreateEmployee creates a new employee in the database
func CreateEmployee(employee *model.Employee) error {
	// Generate a UUID if one isn't provided
	if employee.ID == uuid.Nil {
		employee.ID = uuid.New()
	}
	return db.DB.Create(employee).Error
}

// GetAllEmployees returns all employees from the database
func GetAllEmployees() ([]model.Employee, error) {
	var employees []model.Employee
	err := db.DB.Find(&employees).Error
	return employees, err
}

// GetEmployeeByID returns an employee by ID
func GetEmployeeByID(id uuid.UUID) (model.Employee, error) {
	var employee model.Employee
	err := db.DB.Where("id = ?", id).First(&employee).Error
	return employee, err
}

// GetEmployeeByEmail returns an employee by email
func GetEmployeeByEmail(email string) (model.Employee, error) {
	var employee model.Employee
	err := db.DB.Where("email = ?", email).First(&employee).Error
	return employee, err
}

// UpdateEmployee updates an employee in the database
func UpdateEmployee(employee *model.Employee) error {
	return db.DB.Save(employee).Error
}

// DeleteEmployee soft-deletes an employee
func DeleteEmployee(id uuid.UUID) error {
	return db.DB.Delete(&model.Employee{}, id).Error
} 