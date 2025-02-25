# l1m Node SDK

A simple Node.js SDK for the l1m API, enabling you to extract structured data from text and images using LLMs.

## Installation

```bash
npm install l1m
```

## Usage

```javascript
import { L1M } from 'l1m';

// Initialize with default options (localhost:3000)
const client = new L1M();

// Or with custom base URL
const client = new L1M({ baseUrl: 'https://your-l1m-api-url.com' });

// Extract structured data from text
const result = await client.structured({
  raw: "John Smith was born on January 15, 1980. He works at Acme Inc. as a Senior Engineer and can be reached at john.smith@example.com or by phone at (555) 123-4567.",
  schema: {
    type: "object",
    properties: {
      name: { type: "string" },
      company: { type: "string" },
      contactInfo: {
        type: "object",
        properties: {
          email: { type: "string" },
          phone: { type: "string" }
        }
      }
    }
  }
});

// Extract structured data from an image URL
const result = await client.structured({
  url: "https://example.com/image.png",
  schema: {
    type: "object",
    properties: {
      character: { type: "string" }
    }
  }
});

// Use a custom LLM provider
const result = await client.structured({
  raw: "Some text content",
  schema: { /* your schema */ }
}, {
  provider: {
    model: "claude-3-opus-20240229",
    url: "https://api.anthropic.com/v1/messages",
    key: "your-api-key"
  }
});

// Use a custom cache key
const result = await client.structured({
  raw: "Some text content",
  schema: { /* your schema */ }
}, {
  cacheKey: "custom-cache-key"
});
```

## API

### L1M Class

#### Constructor

```typescript
new L1M(options?: ClientOptions)
```

- `options.baseUrl` (optional): Custom base URL for the l1m API. Defaults to 'http://localhost:3000'.

#### Methods

##### structured(input, options?)

Extracts structured data from content according to the provided schema.

```typescript
async structured(
  input: StructuredRequestInput, 
  options?: RequestOptions
): Promise<unknown>
```

**Parameters:**

- `input`: Object containing:
  - `raw` (string, optional): Raw text content, base64 in the case of image/audio
  - `url` (string, optional): URL to fetch content from
  - `schema` (object): JSON Schema defining the structure to extract
  
- `options` (optional): Object containing:
  - `provider` (optional): Custom LLM provider details
    - `model`: LLM model to use
    - `url`: LLM provider URL (OpenAI compatible or Anthropic API)
    - `key`: API key for the LLM provider
  - `cacheKey` (optional): Custom cache key

**Returns:**

- The structured data extracted according to the provided schema

## Development

```bash
# Build the SDK
npm run build

# Run tests
npm run test
```