# l1m 🚀

[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Homepage](https://img.shields.io/badge/homepage-l1m.io-blue)](https://l1m.io)
[![Go Reference](https://pkg.go.dev/badge/github.com/inferablehq/l1m/sdk-go.svg)](https://pkg.go.dev/github.com/inferablehq/l1m/sdk-go)
[![npm](https://img.shields.io/npm/v/l1m)](https://www.npmjs.com/package/l1m)
[![PyPI](https://img.shields.io/pypi/v/l1m-dot-io)](https://pypi.org/project/l1m-dot-io/)

> A Proxy to extract structured data from text and images using LLMs.

## 🌟 Why l1m?

l1m is the easiest way to get structured data from unstructured text or images using LLMs. No prompt engineering, no chat history, just a simple API to extract structured JSON from text or images.

## ✨ Features

- **📋 Simple Schema-First Approach:** Define your data structure in JSON Schema, get back exactly what you need
- **🎯 Zero Prompt Engineering:** No need to craft complex prompts or chain multiple calls. Add context as JSON schema descriptions
- **🔄 Provider Flexibility:** Bring your own provider, supports any OpenAI compatible or Anthropic provider and Anthropic models
- **⚡ Caching:** Built-in caching, with `x-cache-ttl` (seconds) header to use l1m.io as a cache for your LLM requests
- **🔓 Open Source:** Open-source, no vendor lock-in. Or use the hosted version with free-tier and high availability
- **🔒 Privacy First:** We don't store your data, unless you use the `x-cache-ttl` header
- **⚡️ Works Locally:** Use l1m locally with Ollama or any other OpenAI compatible model provider

## 🚀 Quick Start

### Curl Example

```bash
curl -X POST https://api.l1m.io/structured \
-H "Content-Type: application/json" \
-H "X-Provider-Url: demo" \
-H "X-Provider-Key: demo" \
-H "X-Provider-Model: demo" \
-d '{
  "input": "A particularly severe crisis in 1907 led Congress to enact the Federal Reserve Act in 1913",
  "schema": {
    "type": "object",
    "properties": {
      "items": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "year": { "type": "number" }
          }
        }
      }
    }
  }
}'
```

### TypeScript Example

```typescript
import { L1M } from 'l1m';
import { z } from 'zod';

// Initialize the client
const client = new L1M({
  provider: {
    model: 'gpt-4',
    url: 'https://api.openai.com/v1',
    key: 'your-api-key'
  }
});

// Define your schema using Zod
const schema = z.object({
  items: z.array(z.object({
    name: z.string(),
    year: z.number()
  }))
});

// Extract structured data
const result = await client.structured({
  input: "A particularly severe crisis in 1907 led Congress to enact the Federal Reserve Act in 1913",
  schema
});

console.log(result);
```

### Python Example

```python
from l1m import L1M, ClientOptions, ProviderOptions
from pydantic import BaseModel
from typing import List

# Define your schema using Pydantic
class Item(BaseModel):
    name: str
    year: float

class Response(BaseModel):
    items: List[Item]

# Initialize the client
client = L1M(ClientOptions(
    provider=ProviderOptions(
        model="gpt-4",
        url="https://api.openai.com/v1",
        key="your-api-key"
    )
))

# Extract structured data
result = client.structured(
    input="A particularly severe crisis in 1907 led Congress to enact the Federal Reserve Act in 1913",
    schema=Response
)

print(result)
```

### Go Example

```go
package main

import (
    "fmt"
    "github.com/inferablehq/l1m/sdk-go"
)

func main() {
    // Initialize the client
    client := l1m.NewClient(&l1m.ClientOptions{
        Provider: &l1m.Provider{
            Model: "gpt-4",
            URL:   "https://api.openai.com/v1",
            Key:   "your-api-key",
        },
    })

    // Define your schema
    schema := map[string]interface{}{
        "type": "object",
        "properties": map[string]interface{}{
            "items": map[string]interface{}{
                "type": "array",
                "items": map[string]interface{}{
                    "type": "object",
                    "properties": map[string]interface{}{
                        "name":  map[string]interface{}{"type": "string"},
                        "year": map[string]interface{}{"type": "number"},
                    },
                },
            },
        },
    }

    // Extract structured data
    result, err := client.Structured(&l1m.StructuredRequest{
        Input:  "A particularly severe crisis in 1907 led Congress to enact the Federal Reserve Act in 1913",
        Schema: schema,
    }, nil)

    if err != nil {
        panic(err)
    }

    fmt.Printf("%+v\n", result)
}
```

## 📚 Documentation

### API Headers

- `x-provider-model` (optional): Custom LLM model to use
- `x-provider-url` (optional): Custom LLM provider URL (OpenAI compatible or Anthropic API)
- `x-provider-key` (optional): API key for custom LLM provider
- `x-cache-ttl` (optional): Cache TTL in seconds
  - Cache key (generated) = hash(input + schema + x-provider-key + x-provider-model)

### Supported Image Formats

- `image/jpeg`
- `image/png`

## 🛠️ SDKs

Official SDKs are available for:

- [Node.js](https://github.com/inferablehq/l1m/tree/main/sdk-node)
- [Python](https://github.com/inferablehq/l1m/tree/main/sdk-python)
- [Go](https://github.com/inferablehq/l1m/tree/main/sdk-go)

## ⚡️ Running Locally

See [local.md](local.md) for instructions on running l1m locally (and using with Ollama).

## 🔔 Stay Updated

Join our [waitlist](https://docs.google.com/forms/d/1R3AsXBlHjsxh3Mafz1ziji7IUDojlHeSRjpWHroBF-o/viewform) to get early access to the production release of our hosted version.

## 📚 Acknowledgements

- [Zod](https://github.com/colinhacks/zod)
- [ts-rest](https://github.com/ts-rest/ts-rest)
- [ajv](https://ajv.js.org/)

## 🏢 About

Built by [Inferable](https://github.com/inferablehq/inferable).