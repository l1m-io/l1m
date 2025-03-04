.PHONY: all build test clean fmt lint

all: fmt lint test build

build:
	go build ./...

test:
	go test -v ./...

clean:
	go clean
	rm -rf bin/

fmt:
	go fmt ./...

lint:
	go vet ./...

deps:
	go mod tidy
	go mod download

.PHONY: help
help:
	@echo "Available targets:"
	@echo "  all    - Format, lint, test, and build"
	@echo "  build  - Build the package"
	@echo "  test   - Run tests"
	@echo "  clean  - Clean build artifacts"
	@echo "  fmt    - Format code"
	@echo "  lint   - Run linter"
	@echo "  deps   - Update and download dependencies" 