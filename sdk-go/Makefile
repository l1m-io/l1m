.PHONY: patch-release test

# Get the current version
CURRENT_VERSION=$(shell git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
# Parse major, minor, and patch versions
MAJOR=$(shell echo $(CURRENT_VERSION) | cut -d. -f1)
MINOR=$(shell echo $(CURRENT_VERSION) | cut -d. -f2)
PATCH=$(shell echo $(CURRENT_VERSION) | cut -d. -f3)
# Calculate new patch version
NEW_PATCH=$(shell echo $$(($(PATCH) + 1)))
NEW_VERSION=$(MAJOR).$(MINOR).$(NEW_PATCH)

# Run tests before release
test:
	go test ./...

# Create a new patch release
patch-release: test
	@echo "Current version: $(CURRENT_VERSION)"
	@echo "New version: $(NEW_VERSION)"
	git tag -a $(NEW_VERSION) -m "Release $(NEW_VERSION)"
	git push origin $(NEW_VERSION)
	GOPROXY=proxy.golang.org go list -m github.com/inferablehq/l1m@$(NEW_VERSION)

# Show help
help:
	@echo "Available targets:"
	@echo "  patch-release  - Create a new patch release (v0.0.X)"
	@echo "  test          - Run tests"
	@echo "  help          - Show this help message" 