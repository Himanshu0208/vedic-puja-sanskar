.PHONY: help build run dev clean test fmt lint install-deps

help:
	@echo "Available commands:"
	@echo "  make install-deps    Install Go dependencies"
	@echo "  make build           Build the application"
	@echo "  make run             Run the application"
	@echo "  make dev             Run in development mode with hot reload"
	@echo "  make test            Run tests"
	@echo "  make fmt             Format code"
	@echo "  make lint            Run linter"
	@echo "  make clean           Clean build artifacts"

install-deps:
	go mod download
	go mod tidy

build:
	@mkdir -p bin
	go build -o bin/server ./cmd/server

run: build
	./bin/server

dev:
	@command -v air > /dev/null || go install github.com/cosmtrek/air@latest
	air

test:
	go test -v ./...

fmt:
	go fmt ./...

lint:
	@command -v golangci-lint > /dev/null || go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	golangci-lint run

clean:
	rm -rf bin/
	rm -rf data/
