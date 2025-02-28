// Package main provides a command-line interface for l1m, a proxy to extract structured data from text and images using LLMs.
//
// The CLI allows users to pipe unstructured text or base64-encoded images into the tool and get back structured JSON data
// based on a provided JSON schema. It supports various configuration options through command-line flags and environment variables.
//
// Usage:
//
//	echo "A particularly severe crisis in 1907 led Congress to enact the Federal Reserve Act in 1913" | l1m -s '{"type":"object","properties":{"items":{"type":"array","items":{"type":"object","properties":{"name":{"type":"string"},"price":{"type":"number"}}}}}}'
//
// For more information, see https://l1m.io
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"os"

	l1m "github.com/inferablehq/l1m/sdk-go"
)

// Version information - will be set during build
var (
	Version = "dev"
)

func main() {
	// Define command line flags
	schemaFlag := flag.String("s", "", "JSON schema for structuring the data (required)")
	instructionFlag := flag.String("i", "", "Optional instruction for the LLM")
	providerURLFlag := flag.String("url", os.Getenv("L1M_PROVIDER_URL"), "Provider URL (defaults to L1M_PROVIDER_URL env var)")
	providerKeyFlag := flag.String("key", os.Getenv("L1M_PROVIDER_KEY"), "Provider API key (defaults to L1M_PROVIDER_KEY env var)")
	providerModelFlag := flag.String("model", os.Getenv("L1M_PROVIDER_MODEL"), "Provider model (defaults to L1M_PROVIDER_MODEL env var)")
	baseURLFlag := flag.String("base-url", os.Getenv("L1M_BASE_URL"), "L1M base URL (defaults to L1M_BASE_URL env var or https://api.l1m.io)")
	versionFlag := flag.Bool("version", false, "Show version information")
	helpFlag := flag.Bool("h", false, "Show help")

	// Parse flags
	flag.Parse()

	// Show version if requested
	if *versionFlag {
		fmt.Printf("l1m version %s\n", Version)
		os.Exit(0)
	}

	// Show help if requested or if required flags are missing
	if *helpFlag || *schemaFlag == "" {
		printUsage()
		os.Exit(0)
	}

	// Read input from stdin
	input, err := io.ReadAll(os.Stdin)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error reading from stdin: %v\n", err)
		os.Exit(1)
	}

	// Parse the schema
	var schema interface{}
	if err := json.Unmarshal([]byte(*schemaFlag), &schema); err != nil {
		fmt.Fprintf(os.Stderr, "Error parsing schema: %v\n", err)
		os.Exit(1)
	}

	// Set up the client
	baseURL := *baseURLFlag
	if baseURL == "" {
		baseURL = "https://api.l1m.io"
	}

	// Ensure provider URL and key are set
	if *providerURLFlag == "" || *providerKeyFlag == "" || *providerModelFlag == "" {
		fmt.Fprintf(os.Stderr, "Provider URL, key, and model must be provided via flags or environment variables\n")
		printUsage()
		os.Exit(1)
	}

	client := l1m.NewClient(&l1m.ClientOptions{
		BaseURL: baseURL,
		Provider: &l1m.Provider{
			URL:   *providerURLFlag,
			Key:   *providerKeyFlag,
			Model: *providerModelFlag,
		},
	})

	// Create the request
	req := &l1m.StructuredRequest{
		Input:  string(input),
		Schema: schema,
	}

	// Add instruction if provided
	if *instructionFlag != "" {
		instruction := *instructionFlag
		req.Instruction = &instruction
	}

	// Send the request
	result, err := client.Structured(req, nil)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}

	// Output the result as JSON
	jsonResult, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error marshaling result: %v\n", err)
		os.Exit(1)
	}

	fmt.Println(string(jsonResult))
}

func printUsage() {
	fmt.Fprintf(os.Stderr, "Usage: l1m -s <json_schema> [-i <instruction>] | cat \"unstructured stuff\"\n\n")
	fmt.Fprintf(os.Stderr, "Options:\n")
	fmt.Fprintf(os.Stderr, "  -s <json_schema>    JSON schema for structuring the data (required)\n")
	fmt.Fprintf(os.Stderr, "  -i <instruction>    Optional instruction for the LLM\n")
	fmt.Fprintf(os.Stderr, "  -url <url>          Provider URL (defaults to L1M_PROVIDER_URL env var)\n")
	fmt.Fprintf(os.Stderr, "  -key <key>          Provider API key (defaults to L1M_PROVIDER_KEY env var)\n")
	fmt.Fprintf(os.Stderr, "  -model <model>      Provider model (defaults to L1M_PROVIDER_MODEL env var)\n")
	fmt.Fprintf(os.Stderr, "  -base-url <url>     L1M base URL (defaults to L1M_BASE_URL env var or https://api.l1m.io)\n")
	fmt.Fprintf(os.Stderr, "  -version            Show version information\n")
	fmt.Fprintf(os.Stderr, "  -h                  Show this help message\n\n")
	fmt.Fprintf(os.Stderr, "Environment Variables:\n")
	fmt.Fprintf(os.Stderr, "  L1M_PROVIDER_URL    Default provider URL\n")
	fmt.Fprintf(os.Stderr, "  L1M_PROVIDER_KEY    Default provider API key\n")
	fmt.Fprintf(os.Stderr, "  L1M_PROVIDER_MODEL  Default provider model\n")
	fmt.Fprintf(os.Stderr, "  L1M_BASE_URL        Default L1M base URL\n\n")
	fmt.Fprintf(os.Stderr, "Examples:\n")
	fmt.Fprintf(os.Stderr, "  echo \"A particularly severe crisis in 1907 led Congress to enact the Federal Reserve Act in 1913\" | l1m -s '{\"type\":\"object\",\"properties\":{\"items\":{\"type\":\"array\",\"items\":{\"type\":\"object\",\"properties\":{\"name\":{\"type\":\"string\"},\"price\":{\"type\":\"number\"}}}}}}'\n")
	fmt.Fprintf(os.Stderr, "  curl -s https://public.l1m.io/menu.jpg | base64 | l1m -s '{\"type\":\"object\",\"properties\":{\"items\":{\"type\":\"array\",\"items\":{\"type\":\"object\",\"properties\":{\"name\":{\"type\":\"string\"},\"price\":{\"type\":\"number\"}}}}}}'\n")
}
