"""Client module for the L1M Python SDK."""

from dataclasses import dataclass
from typing import Any, Optional, Type, TypeVar

import requests
from pydantic import BaseModel


class L1MError(Exception):
    """Error returned by the L1M API."""

    def __init__(self, message: str, status_code: Optional[int] = None, body: Any = None):
        """Initialize a new L1M error.

        Args:
            message: Error message
            status_code: HTTP status code
            body: Response body
        """
        super().__init__(message)
        self.name = "L1MError"
        self.message = message
        self.status_code = status_code
        self.body = body


@dataclass
class ProviderOptions:
    """Provider options for the L1M API."""

    model: str
    url: str
    key: str


@dataclass
class ClientOptions:
    """Options for the L1M client."""

    base_url: str = "https://api.l1m.io"
    provider: Optional[ProviderOptions] = None


@dataclass
class RequestOptions:
    """Options for a request to the L1M API."""

    provider: ProviderOptions
    cache_ttl: Optional[int] = None


T = TypeVar("T", bound=BaseModel)


class L1M:
    """L1M API Client."""

    def __init__(self, options: Optional[ClientOptions] = None):
        """Initialize a new L1M client.

        Args:
            options: Client options
        """
        if options is None:
            options = ClientOptions()

        self.base_url = options.base_url
        self.provider = options.provider

        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json"
        })

    def structured(
        self,
        input: str,
        schema: Type[T],
        options: Optional[RequestOptions] = None
    ) -> T:
        """Generate a structured response from the L1M API.

        Args:
            input: Input text (Base64 encoded if image data)
            schema: Pydantic model to validate the response against
            options: Request options

        Returns:
            Structured response from the L1M API

        Raises:
            L1MError: If the request fails
        """
        cache_ttl = options.cache_ttl if options else None

        provider = self.provider if self.provider else (options.provider if options else None)

        if not provider:
            raise L1MError("No provider specified")

        try:
            # Convert Pydantic model to JSON schema
            schema_dict = schema.model_json_schema()
            headers = {
                "x-provider-model": provider.model,
                "x-provider-url": provider.url,
                "x-provider-key": provider.key,
            }

            if cache_ttl:
                headers["x-cache-ttl"] = cache_ttl

            response = self.session.post(
                f"{self.base_url}/structured",
                headers=headers,
                json={
                    "input": input,
                    "schema": schema_dict
                }
            )

            response.raise_for_status()
            data = response.json()

            # Parse the response with the provided schema
            return schema.model_validate(data["data"])

        except requests.exceptions.HTTPError as e:
            # For HTTP errors, we can directly access the response
            status_code = e.response.status_code

            try:
                body = e.response.json()
                message = body.get("message", str(e))
            except Exception:
                body = e.response.text
                message = str(e)

            raise L1MError(message, status_code, body) from e

        except requests.exceptions.RequestException as e:
            # For other request exceptions
            status_code = None
            if hasattr(e, "response") and e.response:
                status_code = e.response.status_code

            body = None
            message = str(e)
            if hasattr(e, "response") and e.response:
                try:
                    body = e.response.json()
                    message = body.get("message", str(e))
                except Exception:
                    body = e.response.text

            raise L1MError(message, status_code, body) from e

        except Exception as e:
            raise e
