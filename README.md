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

### Text Example

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
            "price": { "type": "number" }
          }
        }
      }
    }
  }
}'
```

### Image Example

```bash
curl -X POST https://api.l1m.io/structured \
-H "Content-Type: application/json" \
-H "X-Provider-Url: demo" \
-H "X-Provider-Key: demo" \
-H "X-Provider-Model: demo" \
-d '{
  "input": "'$(curl -s https://public.l1m.io/menu.jpg | base64)'",
  "schema": {
    "type": "object",
    "properties": {
      "items": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "price": { "type": "number" }
          }
        }
      }
    }
  }
}'
```

### Node.js Example

See [sdk-node](https://github.com/inferablehq/l1m/tree/main/sdk-node) for a complete example.

### Python Example

See [sdk-python](https://github.com/inferablehq/l1m/tree/main/sdk-python) for a complete example.

### Go Example

See [sdk-go](https://github.com/inferablehq/l1m/tree/main/sdk-go) for a complete example.

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

- [BAML](https://github.com/boundaryml/baml)
- [Zod](https://github.com/colinhacks/zod)
- [ts-rest](https://github.com/ts-rest/ts-rest)
- [ajv](https://ajv.js.org/)

## 🏢 About

Built by [Inferable](https://github.com/inferablehq/inferable).