# l1m

A low-level API to extract structured data from text and images using LLMs.

## API Endpoints

### Structured

```
POST /structured
```

Extracts structured data from content according to the provided schema.

**Headers:**
- `x-provider-model` (optional): Custom LLM model to use
- `x-provider-url` (optional): Custom LLM provider URL (OpenAI compatiable or Anthropic API)
- `x-provider-key` (optional): API key for custom LLM provider
- `x-cache-key` (optional): Custom cache key

**Request Body:**
- `raw` (string, optional): Raw text content, base64 in the case of image / audio
- `url` (string, optional): URL to fetch content from
- `schema` (object): JSON Schema defining the structure to extract

**Note:** Either `raw` or `url` must be provided, but not both.

**Supported URL MIME Types:**
- `text/plain`
- `application/json`
- `image/jpeg`
- `image/png`

**Example Request (raw text):**
```bash
curl -X POST http://localhost:3000/structured \
  -H "Content-Type: application/json" \
  -d '{
    "raw": "John Smith was born on January 15, 1980. He works at Acme Inc. as a Senior Engineer and can be reached at john.smith@example.com or by phone at (555) 123-4567.",
    "schema": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "company": { "type": "string" },
        "contactInfo": {
          "type": "object",
          "properties": {
            "email": { "type": "string" },
            "phone": { "type": "string" }
          }
        }
      }
    }
  }'
```

**Example Request (Image via URL):**
```bash
curl -X POST http://localhost:3000/structured \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://upload.wikimedia.org/wikipedia/en/4/4d/Shrek_%28character%29.png",
    "schema": {
      "type": "object",
      "properties": {
        "character": { "type": "string" }
      }
    }
  }'
```

## Environment Variables

- `REDIS_URL`: The URL of the Redis cache (optional, caching is disabled if not set)

## Development

```bash
# Start development server with hot reload
npm run dev

# Run tests (Against default LLM provider)
npm run test

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
