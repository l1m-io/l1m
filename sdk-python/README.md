# L1M Python SDK

Python SDK for interacting with the L1M API.

## Installation

```bash
pip install l1m-dot-io
```

## Usage

```python
from pydantic import BaseModel
from l1m import L1M, ClientOptions, ProviderOptions

class ContactDetails(BaseModel):
  email: str
  phone: str

class UserProfile(BaseModel):
  name: str
  company: str
  contactInfo: ContactDetails


client = L1M(
  options=ClientOptions(
    provider=ProviderOptions(
      model="gpt-4",
      url="https://api.openai.com/v1/chat/completions",
      key="your-openai-key"
    )
  )
)

# Generate a structured response
user_profile = client.structured(
  input="John Smith was born on January 15, 1980. He works at Acme Inc. as a Senior Engineer and can be reached at john.smith@example.com or by phone at (555) 123-4567.",
  schema=UserProfile
)
```

## Development

```bash
# Run tests
pytest
```
