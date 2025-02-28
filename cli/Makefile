.PHONY: patch-release test build

# Get the current version by sorting cli/ git tags and taking the last one
CURRENT_VERSION=$(shell git --no-pager tag | grep "^cli/v" | sed 's/^cli\///' | sort -V | tail -n 1)
# Default to v0.0.0 if no tags found
ifeq ($(CURRENT_VERSION),)
CURRENT_VERSION=v0.0.0
endif
# Parse major, minor, and patch versions, stripping the 'v' prefix for calculations
MAJOR=$(shell echo $(CURRENT_VERSION) | sed 's/v//' | cut -d. -f1)
MINOR=$(shell echo $(CURRENT_VERSION) | sed 's/v//' | cut -d. -f2)
PATCH=$(shell echo $(CURRENT_VERSION) | sed 's/v//' | cut -d. -f3)
# Calculate new patch version
NEW_PATCH=$(shell echo $$(($(PATCH) + 1)))
NEW_VERSION=v$(MAJOR).$(MINOR).$(NEW_PATCH)

# Run tests before release
test:
	go test ./...

# Build the CLI binary
build:
	go build -ldflags "-X main.Version=$(CURRENT_VERSION)" -o l1m .

# Create a new patch release
patch-release: test
	@echo "Current version: $(CURRENT_VERSION)"
	@echo "New version: $(NEW_VERSION)"
	git tag -a cli/$(NEW_VERSION) -m "Release cli/$(NEW_VERSION)"
	git push origin cli/$(NEW_VERSION)
	GOPROXY=proxy.golang.org go list -m github.com/inferablehq/l1m/cli@$(NEW_VERSION)
	go build -ldflags "-X main.Version=$(NEW_VERSION)" -o l1m .
	@echo "Built CLI binary with version $(NEW_VERSION)"

# Show help
help:
	@echo "Available targets:"
	@echo "  patch-release  - Create a new patch release (v0.0.X)"
	@echo "  build         - Build the CLI binary"
	@echo "  test          - Run tests"
	@echo "  help          - Show this help message" 