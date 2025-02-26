package main

import (
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/inferablehq/l1m"
)

func main() {
	// Initialize client
	client := l1m.NewClient(&l1m.ClientOptions{
		BaseURL: "https://api.l1m.io",
		Provider: &l1m.Provider{
			Model: "claude-3-5-sonnet-latest",
			URL:   "https://api.anthropic.com/v1/messages",
			Key:   "my_secret_key",
		},
	})

	// Example with text input
	textSchema := map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"name":    map[string]interface{}{"type": "string"},
			"company": map[string]interface{}{"type": "string"},
			"contactInfo": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"email": map[string]interface{}{"type": "string"},
					"phone": map[string]interface{}{"type": "string"},
				},
			},
		},
	}

	textResult, err := client.Structured(&l1m.StructuredRequest{
		Input:  "John Smith was born on January 15, 1980. He works at Acme Inc. as a Senior Engineer and can be reached at john.smith@example.com or by phone at (555) 123-4567.",
		Schema: textSchema,
	}, nil)

	if err != nil {
		fmt.Printf("Error: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Text Result: %+v\n", textResult)

	// Example with image input
	resp, err := http.Get("https://upload.wikimedia.org/wikipedia/en/4/4d/Shrek_%28character%29.png")
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	imageBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		os.Exit(1)
	}

	base64Image := base64.StdEncoding.EncodeToString(imageBytes)

	imageSchema := map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"character": map[string]interface{}{"type": "string"},
		},
	}

	imageResult, err := client.Structured(&l1m.StructuredRequest{
		Input:  base64Image,
		Schema: imageSchema,
	}, nil)

	if err != nil {
		fmt.Printf("Error: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Image Result: %+v\n", imageResult)
}
