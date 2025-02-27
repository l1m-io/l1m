# l1m API

This directory contains the API implementation for l1m. For general information about l1m, please see the [main README](../README.md).

## API Endpoints

### Structured

```
POST /structured
```

Extracts structured data from content according to the provided schema.

**Request Body:**

- `input` (string): Text content or base64 encoded image data
- `schema` (object): JSON Schema defining the structure to extract

For detailed information about headers, supported image formats, and example requests, see the [main README](../README.md#-documentation).

## Environment Variables

- `REDIS_URL`: The URL of the Redis cache (optional, caching is disabled if not set)

## Development

```bash
# Start development server with hot reload
npm run dev

# Run tests (Against groq)
export TEST_PROVIDER_MODEL="llama-3.2-90b-vision-preview"
export TEST_PROVIDER_URL="https://api.groq.com/openai/v1"
export TEST_PROVIDER_KEY="" # Get your API key from https://console.groq.com/
npm run test

# Run tests (Against OpenRouter)
export TEST_PROVIDER_MODEL="openai/gpt-4o"
export TEST_PROVIDER_URL="https://openrouter.ai/api/v1"
export TEST_PROVIDER_KEY="" # Get your API key from https://openrouter.ai
npm run test

# Run tests (Against OpenAI)
export TEST_PROVIDER_MODEL="gpt-4o-mini"
export TEST_PROVIDER_URL="https://api.openai.com/v1"
export TEST_PROVIDER_KEY="" # Get your API key from https://platform.openai.com
npm run test

# Run tests (Against Anthropic)
export TEST_PROVIDER_MODEL="claude-3-7-sonnet-20250219"
export TEST_PROVIDER_URL="https://api.anthropic.com/v1/messages"
export TEST_PROVIDER_KEY="" # Get your API key from https://console.anthropic.com
npm run test
```
