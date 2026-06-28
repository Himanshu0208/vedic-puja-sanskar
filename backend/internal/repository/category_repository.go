package repository

import (
	"database/sql"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/models"
)

type CategoryRepository struct {
	db *sql.DB
}

func NewCategoryRepository(db *sql.DB) *CategoryRepository {
	return &CategoryRepository{db: db}
}

func (cr *CategoryRepository) GetAllCategories() ([]*models.Category, error) {
	rows, err := cr.db.Query(
		`SELECT id, name
		FROM categories ORDER BY id ASC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []*models.Category
	for rows.Next() {
		category := &models.Category{}
		if err := rows.Scan(&category.ID, &category.Name); err != nil {
			return nil, err
		}
		categories = append(categories, category)
	}

	return categories, rows.Err()
}

func (cr *CategoryRepository) GetCategoryByID(id int) (*models.Category, error) {
	row := cr.db.QueryRow(
		`SELECT id, name, created_at, updated_at
		FROM categories WHERE id = $1`,
		id,
	)

	category := &models.Category{}
	err := row.Scan(&category.ID, &category.Name, &category.CreatedAt, &category.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	} else if err != nil {
		return nil, err
	}

	return category, nil
}
