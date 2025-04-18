.PHONY: patch-release test

# Get the current version by sorting sdk-go/ git tags and taking the last one
CURRENT_VERSION=$(git --no-pager tag | grep "^sdk-go/v" | sed 's/^sdk-go\///' | sort -V | tail -n 1 || echo "v0.0.0")
# Parse major, minor, and patch versions, stripping the 'v' prefix for calculations
MAJOR=$(shell echo $(CURRENT_VERSION) | sed 's/v//' | cut -d. -f1)
MINOR=$(shell echo $(CURRENT_VERSION) | cut -d. -f2)
PATCH=$(shell echo $(CURRENT_VERSION) | cut -d. -f3)
# Calculate new patch version
NEW_PATCH=$(shell echo $$(($(PATCH) + 1)))
NEW_VERSION=v$(MAJOR).$(MINOR).$(NEW_PATCH)

# Run tests before release
test:
	go test ./...

# Create a new patch release
patch-release: test
	@echo "Current version: $(CURRENT_VERSION)"
	@echo "New version: $(NEW_VERSION)"
	git tag -a sdk-go/$(NEW_VERSION) -m "Release sdk-go/$(NEW_VERSION)"
	git push origin sdk-go/$(NEW_VERSION)
	GOPROXY=proxy.golang.org go list -m github.com/inferablehq/l1m/sdk-go@$(NEW_VERSION)

# Show help
help:
	@echo "Available targets:"
	@echo "  patch-release  - Create a new patch release (v0.0.X)"
	@echo "  test          - Run tests"
	@echo "  help          - Show this help message" 