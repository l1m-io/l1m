# inferableghq/llm

A TypeScript/Node.js API extracts structured data from text and images using LLMs.


## API Endpoints

### Structured

```
POST /structured
```

Extracts structured data from content according to the provided schema.

**Headers:**
- `x-provider-model` (optional): Custom LLM model to use
- `x-provider-url` (optional): Custom LLM provider URL
- `x-provider-key` (optional): API key for custom LLM provider
- `x-cache-key` (optional): Custom cache key

**Note:** If any `x-provider-*` header is set, all three must be provided.

**Request Body:**
- `raw` (string, optional): Raw text content, base64 in the case of image / audio
- `url` (string, optional): URL to fetch content from
- `type` (string, default: "text/plain"): Content MIME type (this is inferred from the URL content if provided)
- `schema` (object): JSON Schema defining the structure to extract

**Note:** Either `raw` or `url` must be provided, but not both.

**Supported MIME Types:**
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
    "type": "text/plain",
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
- `DEFAULT_BEDROCK_MODEL`: The default AWS Bedrock model to use if no custom provider is specified
- `AWS_REGION`: The AWS region to use for Bedrock
- `AWS_ACCESS_KEY_ID`: The AWS access key ID to use for Bedrock
- `AWS_SECRET_ACCESS_KEY`: The AWS secret access key to use for Bedrock

## Development

```bash
# Start development server with hot reload
npm run dev

# Run tests (Against default LLM provider)
npm run test

export TEST_PROVIDER_MODEL="llama-3.2-90b-vision-preview"
export TEST_PROVIDER_URL="https://api.groq.com/openai/v1"
export TEST_PROVIDER_KEY="" # Get your API key from https://console.groq.com/

# Run tests (Against groq)
npm run test

export TEST_PROVIDER_MODEL="openai/gpt-4o"
export TEST_PROVIDER_URL="https://openrouter.ai/api/v1"
export TEST_PROVIDER_KEY="" # Get your API key from https://openrouter.ai

# Run tests (Against groq)
npm run test
```
