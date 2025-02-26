# l1m Go SDK

A Go SDK for the l1m API, enabling you to extract structured data from text and images using LLMs.

## Installation

```bash
go get github.com/inferablehq/l1m/tree/main/sdk-go
```

## Usage

```go
package main

import (
    "github.com/inferablehq/l1m/tree/main/sdk-go"
)

func main() {
    // Initialize client
    client := l1m.NewClient(&l1m.ClientOptions{
        BaseURL: "https://api.l1m.io",
        Provider: &l1m.Provider{
            Model: "claude-3-5-sonnet-latest",
            URL:   "https://api.anthropic.com/v1/messages",
            Key:   "my_secret_key",
        },
    })

    // Extract structured data from text
    schema := map[string]interface{}{
        "type": "object",
        "properties": map[string]interface{}{
            "name":    map[string]interface{}{"type": "string"},
            "company": map[string]interface{}{"type": "string"},
            "contactInfo": map[string]interface{}{
                "type": "object",
                "properties": map[string]interface{}{
                    "email": map[string]interface{}{"type": "string"},
                    "phone": map[string]interface{}{"type": "string"},
                },
            },
        },
    }

    result, err := client.Structured(&l1m.StructuredRequest{
        Input:  "John Smith was born on January 15, 1980. He works at Acme Inc...",
        Schema: schema,
    }, nil)

    if err != nil {
        panic(err)
    }

    // Use result...
}
```

## Development

```bash
# Run tests
go test ./...
```