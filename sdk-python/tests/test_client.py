"""Tests for the L1M client."""

import base64
import os

import pytest
import requests
from dotenv import load_dotenv
from pydantic import BaseModel

from l1m import ClientOptions, L1M, L1MError, ProviderOptions

# Load environment variables from .env file
load_dotenv()

class CharacterSchema(BaseModel):
    """Schema for character recognition test."""

    character: str

class ContactDetails(BaseModel):
  email: str
  phone: str

class UserProfile(BaseModel):
    """Schema for user profile extraction test."""
    name: str
    company: str
    contactInfo: ContactDetails

def test_call_structured():
    """Test structured method with Pydantic model."""
    # Skip if environment variables are not set
    if not all([
        os.environ.get("TEST_PROVIDER_MODEL"),
        os.environ.get("TEST_PROVIDER_KEY"),
        os.environ.get("TEST_PROVIDER_URL")
    ]):
        pytest.skip("Missing required TEST_PROVIDER environment variables")

    l1m = L1M(
        options=ClientOptions(
            provider=ProviderOptions(
                model=os.environ["TEST_PROVIDER_MODEL"],
                key=os.environ["TEST_PROVIDER_KEY"],
                url=os.environ["TEST_PROVIDER_URL"],
            )
        )
    )

    # Fetch image and convert to base64
    url = "https://upload.wikimedia.org/wikipedia/en/4/4d/Shrek_%28character%29.png"
    response = requests.get(url)
    response.raise_for_status()
    image_data = response.content
    input_data = base64.b64encode(image_data).decode("utf-8")

    # Call the API
    result = l1m.structured(
        input=input_data,
        schema=CharacterSchema
    )

    print("Result:", result)

    # Verify the result
    assert result.character == "Shrek"


def test_readme_example():
    """Test the example from the README."""
    # Skip if environment variables are not set
    if not all([
        os.environ.get("TEST_PROVIDER_MODEL"),
        os.environ.get("TEST_PROVIDER_KEY"),
        os.environ.get("TEST_PROVIDER_URL")
    ]):
        pytest.skip("Missing required TEST_PROVIDER environment variables")

    # Initialize the client as shown in the README
    client = L1M(
        options=ClientOptions(
            provider=ProviderOptions(
                model=os.environ["TEST_PROVIDER_MODEL"],
                key=os.environ["TEST_PROVIDER_KEY"],
                url=os.environ["TEST_PROVIDER_URL"],
            )
        )
    )

    # Generate a structured response using the example from the README
    user_profile = client.structured(
        input="John Smith was born on January 15, 1980. He works at Acme Inc. as a Senior Engineer and can be reached at john.smith@example.com or by phone at (555) 123-4567.",
        schema=UserProfile
    )

    print("User Profile:", user_profile)

    # Verify the result matches expected output
    assert user_profile.name == "John Smith"
    assert user_profile.company == "Acme Inc."
    assert user_profile.contactInfo.email == "john.smith@example.com"
    assert user_profile.contactInfo.phone == "(555) 123-4567"


def test_invalid_api_key():
    """Test that invalid API key raises appropriate error."""
    # Skip if environment variables are not set
    if not all([
        os.environ.get("TEST_PROVIDER_MODEL"),
        os.environ.get("TEST_PROVIDER_URL")
    ]):
        pytest.skip("Missing required TEST_PROVIDER environment variables")

    l1m = L1M(
        options=ClientOptions(
            provider=ProviderOptions(
                model=os.environ["TEST_PROVIDER_MODEL"],
                key="INVALID",
                url=os.environ["TEST_PROVIDER_URL"],
            )
        )
    )

    # Fetch image and convert to base64
    url = "https://upload.wikimedia.org/wikipedia/en/4/4d/Shrek_%28character%29.png"
    response = requests.get(url)
    response.raise_for_status()
    image_data = response.content
    input_data = base64.b64encode(image_data).decode("utf-8")

    # Call the API and expect it to fail
    with pytest.raises(L1MError) as excinfo:
        l1m.structured(
            input=input_data,
            schema=CharacterSchema
        )

    error = excinfo.value
    print("Error:", error)

    assert error.status_code == 401
    assert error.message == "Failed to call provider"
