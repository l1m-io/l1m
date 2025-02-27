# Running L1M API Locally with Docker

This guide explains how to run the L1M API service locally using Docker and connect it to OpenAI-compatible API endpoints.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your system
- Access to an OpenAI-compatible API endpoint

## Setup Instructions

### Pulling the Docker Image

The easiest way to get started is to pull the pre-built Docker image from the public registry:

```bash
# Pull the latest image
docker pull inferable/l1m:latest

# Run the container
docker run -p 10337:10337 inferable/l1m:latest
```

## Using with OpenAI-Compatible API

You can use the L1M API with any OpenAI-compatible API endpoint:

### Make API Requests

```bash
curl -X POST http://localhost:10337/structured \
-H "Content-Type: application/json" \
-H "X-Provider-Url: $PROVIDER_URL" \
-H "X-Provider-Key: $PROVIDER_KEY" \
-H "X-Provider-Model: $PROVIDER_MODEL" \
-d '{
  "input": "A particularly severe crisis in 1907 led Congress to enact the Federal Reserve Act in 1913",
  "schema": {
    "type": "object",
    "properties": {
      "year": {
        "type": "number",
        "description": "The year of the federal reserve act"
      }
    }
  }
}'
```

## Using with Ollama (Local LLMs)

As an alternative to cloud-based APIs, you can also use Ollama to run models locally:

### 1. Install and Run Ollama

Download and install [Ollama](https://ollama.com/download) on your machine.

Make sure Ollama is running. By default, Ollama serves its API at `http://localhost:11434/v1`.

### 2. Pull Your Desired Model

If you haven't already, pull the model you want to use:

```bash
ollama pull llama3
```

### 3. Make API Requests to Ollama

You can now make requests to your locally running L1M API, specifying Ollama as the provider:

```bash
curl -X POST http://localhost:10337/structured \
-H "Content-Type: application/json" \
-H "X-Provider-Url: http://host.docker.internal:11434/v1" \
-H "X-Provider-Key: ollama" \
-H "X-Provider-Model: llama3:latest" \
-d '{
  "input": "A particularly severe crisis in 1907 led Congress to enact the Federal Reserve Act in 1913",
  "schema": {
    "type": "object",
    "properties": {
      "year": {
        "type": "number",
        "description": "The year of the federal reserve act"
      }
    }
  }
}'
```
