# l1m Node SDK

A simple Node.js SDK for the l1m API, enabling you to extract structured, typed data from text and images using LLMs.

## Installation

```bash
npm install l1m
```

## Usage

```javascript
import { L1M } from 'l1m';
import { z } from 'zod';


const l1m = new L1M({
  baseUrl: "http://localhost:10337",
  provider: {
    model: "claude-3-opus-20240229",
    url: "https://api.anthropic.com/v1/messages",
    key: "your-api-key"
  }
});

// Extract structured data from text
const result = await l1m.structured({
  input: "John Smith was born on January 15, 1980. He works at Acme Inc. as a Senior Engineer and can be reached at john.smith@example.com or by phone at (555) 123-4567.",
  instructions: "Extract details from the provided text", // Optional
  schema: z.object({
    name: z.string(),
    company: z.string(),
    contactInfo: z.object({
      email: z.string(),
      phone: z.string()
    })
  })
});

// Extract structured data from an image
const result = await l1m.structured({
  input: "<BASE64_ENCODED_IMAGE>",
  instructions: "Extract the name of the character in the image", // Optional
  schema: z.object({
    character: z.string()
  })
});

// Cache enabled
const result = await client.structured({
  input: "Some text content",
  schema: z.object({ /* your schema */ })
}, {
  cacheTTL: 60
});
```

## Development

```bash
# Build the SDK
npm run build

# Run tests
npm run test
```
