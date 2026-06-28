package dto

type Category struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type CategoryListResponse struct {
	Categories []*Category `json:"categories"`
	TotalCount int         `json:"totalCount"`
}
