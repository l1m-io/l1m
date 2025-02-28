.PHONY: patch-release test build prepare-release install

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

# Prepare go.mod for release by updating the replace directive
prepare-release:
	@echo "Preparing go.mod for release..."
	@# Get the latest sdk-go version
	@SDK_VERSION=$$(git --no-pager tag | grep "^sdk-go/v" | sed 's/^sdk-go\///' | sort -V | tail -n 1) && \
	if [ -z "$$SDK_VERSION" ]; then \
		echo "No sdk-go version found, using v0.0.0"; \
		SDK_VERSION="v0.0.0"; \
	fi && \
	echo "Using sdk-go version: $$SDK_VERSION" && \
	sed -i.bak 's|require github.com/inferablehq/l1m/sdk-go.*|require github.com/inferablehq/l1m/sdk-go '$$SDK_VERSION'|' go.mod && \
	sed -i.bak '/replace github.com\/inferablehq\/l1m\/sdk-go/d' go.mod && \
	rm -f go.mod.bak && \
	go mod tidy

# Run tests
test: prepare-release
	go test ./...

# Build the CLI binary
build: prepare-release
	go build -ldflags "-X main.Version=$(CURRENT_VERSION)" -o l1m .

# Install the CLI binary
install: build
	cp l1m $$(go env GOPATH)/bin/l1m

# Create a new patch release
patch-release: test
	@echo "Current version: $(CURRENT_VERSION)"
	@echo "New version: $(NEW_VERSION)"
	@# Commit the changes to go.mod and go.sum
	git add go.mod go.sum
	git commit -m "Release cli/$(NEW_VERSION): Update dependencies"
	git tag -a cli/$(NEW_VERSION) -m "Release cli/$(NEW_VERSION)"
	git push origin cli/$(NEW_VERSION)
	git push origin HEAD
	GOPROXY=proxy.golang.org go list -m github.com/inferablehq/l1m/cli@$(NEW_VERSION)
	go build -ldflags "-X main.Version=$(NEW_VERSION)" -o l1m .
	@echo "Built CLI binary with version $(NEW_VERSION)"
	@# Restore the replace directive for local development
	@echo "Restoring go.mod for local development..."
	@sed -i.bak 's|require github.com/inferablehq/l1m/sdk-go.*|require github.com/inferablehq/l1m/sdk-go v0.0.0|' go.mod && \
	echo 'replace github.com/inferablehq/l1m/sdk-go => ../sdk-go' >> go.mod && \
	rm -f go.mod.bak && \
	go mod tidy

# Show help
help:
	@echo "Available targets:"
	@echo "  patch-release  - Create a new patch release (v0.0.X)"
	@echo "  build         - Build the CLI binary"
	@echo "  test          - Run tests"
	@echo "  prepare-release - Prepare go.mod for release"
	@echo "  install       - Install the CLI binary to GOPATH/bin"
	@echo "  help          - Show this help message" 