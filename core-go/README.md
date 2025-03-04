# L1M Core Go Package

This package provides core functionality for the L1M API in Go. It includes utilities for:

- Base64 encoding/decoding and MIME type detection
- JSON Schema validation and manipulation
- Structured data processing with AI models

## Installation

```bash
go get github.com/inferablehq/l1m/core-go
```

## Usage

### Base64 Utilities

```go
import "github.com/inferablehq/l1m/core-go/base64"

// Check if a string is valid base64
isValid := base64.IsBase64("SGVsbG8gV29ybGQ=")

// Infer MIME type from base64 data
mimeType, err := base64.InferType("SGVsbG8gV29ybGQ=")
```

### Schema Validation

```go
import "github.com/inferablehq/l1m/core-go/schema"

// Validate data against a JSON schema
schema := map[string]interface{}{
    "type": "object",
    "properties": map[string]interface{}{
        "name": map[string]interface{}{"type": "string"},
        "age": map[string]interface{}{"type": "integer"},
    },
    "required": []string{"name", "age"},
}

data := map[string]interface{}{
    "name": "John",
    "age": 30,
}

valid, errors := schema.ValidateResult(schema, data)
```

### Model Integration

```go
import "github.com/inferablehq/l1m/core-go/model"

// Process structured data with AI models
result, err := model.Structured(model.StructuredParams{
    Input: "Generate a person profile",
    Schema: personSchema,
    Provider: model.ProviderConfig{
        URL: "https://api.openai.com/v1",
        Key: "your-api-key",
        Model: "gpt-4",
    },
})
```

## Development

```bash
# Install dependencies
make deps

# Run tests
make test

# Format code
make fmt

# Build
make build
```

## License

See the LICENSE file in the repository root. 