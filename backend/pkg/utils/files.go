package utils

import (
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const MaxImageUploadSize int64 = 1 << 20

func saveUploadedFile(file multipart.File, filePath string, maxSize int64) error {
	dst, err := os.Create(filePath)
	if err != nil {
		return fmt.Errorf("failed to create file: %w", err)
	}
	reader := io.Reader(file)
	if maxSize > 0 {
		reader = io.LimitReader(file, maxSize+1)
	}
	written, copyErr := io.Copy(dst, reader)
	closeErr := dst.Close()
	if copyErr != nil {
		_ = os.Remove(filePath)
		return fmt.Errorf("failed to save file: %w", copyErr)
	}
	if maxSize > 0 && written > maxSize {
		_ = os.Remove(filePath)
		return fmt.Errorf("image must be 5 MB or smaller")
	}
	if closeErr != nil {
		_ = os.Remove(filePath)
		return fmt.Errorf("failed to save file: %w", closeErr)
	}
	return nil
}

func SaveProductImage(file multipart.File, header *multipart.FileHeader, uploadsDir string) (string, error) {
	ext := filepath.Ext(header.Filename)
	allowedExts := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true}
	if !allowedExts[strings.ToLower(ext)] {
		return "", fmt.Errorf("invalid file type, allowed: jpg, jpeg, png, gif, webp")
	}

	filename := fmt.Sprintf("product_%d%s", time.Now().UnixNano(), ext)
	filePath := filepath.Join(uploadsDir, filename)
	if err := saveUploadedFile(file, filePath, MaxImageUploadSize); err != nil {
		return "", err
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
		if err != nil {
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
	maxSize := int64(0)
	if strings.ToLower(ext) != ".mp4" && strings.ToLower(ext) != ".webm" {
		maxSize = MaxImageUploadSize
	}
	if err := saveUploadedFile(file, filePath, maxSize); err != nil {
		return "", err
	}
	return "/uploads/" + filename, nil
}
