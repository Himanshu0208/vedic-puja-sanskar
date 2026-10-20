package utils

import (
	"mime/multipart"
	"path/filepath"
	"strings"
	"time"
	"fmt"
	"os"
	"io"
	"net/http"
)

func SaveProductImage(file multipart.File, header *multipart.FileHeader, uploadsDir string) (string, error) {
	ext := filepath.Ext(header.Filename)
	allowedExts := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true}
	if !allowedExts[strings.ToLower(ext)] {
		return "", fmt.Errorf("invalid file type, allowed: jpg, jpeg, png, gif, webp")
	}

	filename := fmt.Sprintf("product_%d%s", time.Now().UnixNano(), ext)
	filePath := filepath.Join(uploadsDir, filename)

	dst, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		return "", fmt.Errorf("failed to save file: %w", err)
	}

	return "/uploads/" + filename, nil
}

func ServeImage(uploadsDir string) http.HandlerFunc {
	absUploadsDir, _ := filepath.Abs(uploadsDir)
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		filename := strings.TrimPrefix(r.URL.Path, "/uploads/")
		absFilePath, err := filepath.Abs(filepath.Join(absUploadsDir, filename))
		if(err != nil) {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		if !strings.HasPrefix(absFilePath, absUploadsDir) {
			w.WriteHeader(http.StatusForbidden)
			return
		}

		http.ServeFile(w, r, absFilePath)
	}
}
func SaveReturnMedia(file multipart.File, header *multipart.FileHeader, uploadsDir string) (string, error) {
	ext := filepath.Ext(header.Filename)
	// ponytail: video support limited to mp4/webm; extend allowedExts if needed
	allowedExts := map[string]bool{
		".jpg": true, ".jpeg": true, ".png": true, ".webp": true,
		".mp4": true, ".webm": true,
	}
	if !allowedExts[strings.ToLower(ext)] {
		return "", fmt.Errorf("invalid file type; allowed: jpg, jpeg, png, webp, mp4, webm")
	}
	filename := fmt.Sprintf("return_%d%s", time.Now().UnixNano(), ext)
	filePath := filepath.Join(uploadsDir, filename)
	dst, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()
	if _, err := io.Copy(dst, file); err != nil {
		return "", fmt.Errorf("failed to save file: %w", err)
	}
	return "/uploads/" + filename, nil
}
