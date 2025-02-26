# L1M Python SDK

Python SDK for interacting with the L1M API.

## Installation

```bash
pip install l1m
```

## Usage

```python
from pydantic import BaseModel
from l1m import L1M, ClientOptions, ProviderOptions

# Define a schema for the response
class UserProfile(BaseModel):
    name: str
    age: int
    bio: str

# Initialize the client
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
    input="Extract a user profile from this text: John Smith is a 30 year old software engineer who loves hiking and coding.",
    schema=UserProfile
)

print(user_profile.name)  # John Smith
print(user_profile.age)   # 30
print(user_profile.bio)   # Software engineer who loves hiking and coding.
```

## Development

```bash
# Run tests
pytest
```
