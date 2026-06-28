package service

import (
	"fmt"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/dto"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/repository"
)

type CategoryService struct {
	categoryRepo *repository.CategoryRepository
}

func NewCategoryService(categoryRepo *repository.CategoryRepository) *CategoryService {
	return &CategoryService{
		categoryRepo: categoryRepo,
	}
}

func (s *CategoryService) GetAllCategories() (*dto.CategoryListResponse, error) {
	categories, err := s.categoryRepo.GetAllCategories()
	if err != nil {
		return nil, fmt.Errorf("failed to get categories: %w", err)
	}

	categoriesDTO := make([]*dto.Category, len(categories))
	for i, category := range categories {
		categoriesDTO[i] = &dto.Category{
			ID:   category.ID,
			Name: category.Name,
		}
	}

	return &dto.CategoryListResponse{
		Categories: categoriesDTO,
		TotalCount: len(categories),
	}, nil
}
