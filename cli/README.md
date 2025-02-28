# l1m CLI

[![License](https://img.shields.io/badge/license-MIT-green.svg)](../LICENSE)
[![Homepage](https://img.shields.io/badge/homepage-l1m.io-blue)](https://l1m.io)

Command-line interface for [l1m](https://l1m.io), a proxy to extract structured data from text and images using LLMs.

## Installation

### From Source

```bash
# Clone the repository
git clone https://github.com/inferablehq/l1m.git

# Build the CLI
cd l1m/cli
go build -o l1m

# Move to a directory in your PATH (optional)
sudo mv l1m /usr/local/bin/
```

### Using Go Install

```bash
go install github.com/inferablehq/l1m/cli@latest
```

## Usage

The l1m CLI allows you to extract structured data from text using LLMs directly from your terminal.

### Basic Usage

```bash
echo "A particularly severe crisis in 1907 led Congress to enact the Federal Reserve Act in 1913" | l1m -s '{"type":"object","properties":{"year":{"type":"number"},"act":{"type":"string"}}}'
```

### Command Line Options

```
Usage: l1m -s <json_schema> [-i <instruction>] | cat "unstructured stuff"

Options:
  -s <json_schema>    JSON schema for structuring the data (required)
  -i <instruction>    Optional instruction for the LLM
  -url <url>          Provider URL (defaults to L1M_PROVIDER_URL env var)
  -key <key>          Provider API key (defaults to L1M_PROVIDER_KEY env var)
  -model <model>      Provider model (defaults to L1M_PROVIDER_MODEL env var)
  -base-url <url>     L1M base URL (defaults to L1M_BASE_URL env var or https://api.l1m.io)
  -h                  Show this help message

Environment Variables:
  L1M_PROVIDER_URL    Default provider URL
  L1M_PROVIDER_KEY    Default provider API key
  L1M_PROVIDER_MODEL  Default provider model
  L1M_BASE_URL        Default L1M base URL
```

### Examples

#### Extract Historical Information

```bash
echo "A particularly severe crisis in 1907 led Congress to enact the Federal Reserve Act in 1913" | l1m -s '{"type":"object","properties":{"year":{"type":"number"},"act":{"type":"string"}}}'
```

#### Process an Image

```bash
curl -s https://public.l1m.io/menu.jpg | base64 | l1m -s '{"type":"object","properties":{"items":{"type":"array","items":{"type":"object","properties":{"name":{"type":"string"},"price":{"type":"number"}}}}}}'
```

#### Add Custom Instructions

```bash
echo "John Smith was born on January 15, 1980. He works at Acme Inc." | l1m -s '{"type":"object","properties":{"name":{"type":"string"},"company":{"type":"string"}}}' -i "Extract only professional information"
```

#### Use a Specific Provider

```bash
echo "The price of AAPL is $150.50" | l1m -s '{"type":"object","properties":{"stock":{"type":"string"},"price":{"type":"number"}}}' -url "https://api.anthropic.com/v1/messages" -key "your-api-key" -model "claude-3-5-sonnet-latest"
```

## Using with Local LLMs (Ollama)

You can use the CLI with locally running LLMs through Ollama:

```bash
echo "The price of AAPL is $150.50" | l1m -s '{"type":"object","properties":{"stock":{"type":"string"},"price":{"type":"number"}}}' -url "http://localhost:11434/v1" -key "ollama" -model "llama3:latest"
```

## License

MIT 