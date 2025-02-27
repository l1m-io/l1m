# l1m Node SDK

Node.js SDK for the [l1m API](https://l1m.io), enabling you to extract structured, typed data from text and images using LLMs.

By default, the [managed l1m](https://l1m.io) service is used, [self-hosting details are available here](https://github.com/inferablehq/l1m/blob/main/local.md).

## Installation

```bash
npm install l1m
```

## Usage

```javascript
import L1M from 'l1m';
import { z } from 'zod';


const l1m = new L1M({
  //baseUrl: "http://localhost:10337", Optional if self-hosting l1m server
  provider: {
    model: "claude-3-opus-20240229",
    url: "https://api.anthropic.com/v1/messages",
    key: "your-api-key"
  }
});

// Extract structured data
const result = await l1m.structured({
  input: "John Smith was born on January 15, 1980. He works at Acme Inc. as a Senior Engineer and can be reached at john.smith@example.com or by phone at (555) 123-4567.",
  // OR  input: "<BASE64_ENCODED_IMAGE>",
  instruction: "Extract details from the provided text", // Optional
  schema: z.object({
    name: z.string(),
    company: z.string(),
    contactInfo: z.object({
      email: z.string(),
      phone: z.string()
    })
  })
}, {
    cacheTTL: 60 // Optional
});
```

## Development

```bash
# Build the SDK
npm run build

# Run tests
npm run test
```
