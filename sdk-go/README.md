# l1m Go SDK

Go SDK for the [l1m API](https://l1m.io), enabling you to extract structured, typed data from text and images using LLMs.

By default, the [managed l1m](https://l1m.io) service is used, [self-hosting details are available here](https://github.com/inferablehq/l1m/blob/main/local.md).

## Installation

```bash
go get github.com/inferablehq/l1m/sdk-go
```

## Usage

```go
package main

import (
    "github.com/inferablehq/l1m/sdk-go"
)

func main() {
    // Initialize client
    client := l1m.NewClient(&l1m.ClientOptions{
        //BaseURL: "http://localhost:10337", Optional if self-hosting l1m server
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
