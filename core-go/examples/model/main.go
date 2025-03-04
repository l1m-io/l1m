package main

import (
	"fmt"
	"os"

	"github.com/inferablehq/l1m/core-go"
)

// Custom provider function that simulates an AI model response
func customProvider(params core.StructuredParams, initialPrompt string, previousAttempts []core.Attempt) (string, error) {
	// In a real implementation, this would call an AI model API
	// For this example, we'll just return a hardcoded response
	fmt.Println("Custom provider called with prompt:")
	fmt.Println("---")
	fmt.Println(initialPrompt)
	fmt.Println("---")

	// Check if there were previous attempts
	if len(previousAttempts) > 0 {
		fmt.Println("Previous attempts:")
		for i, attempt := range previousAttempts {
			fmt.Printf("Attempt %d: %s\n", i+1, attempt.Raw)
			fmt.Printf("Errors: %s\n", attempt.Errors)
		}
	}

	// Return a valid JSON response based on the schema
	return `{
		"name": "Jane Smith",
		"age": 28,
		"occupation": "Data Scientist",
		"hobbies": ["machine learning", "hiking", "photography"]
	}`, nil
}

func main() {
	// Example schema for a person
	personSchema := map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"name": map[string]interface{}{
				"type":        "string",
				"description": "The person's full name",
			},
			"age": map[string]interface{}{
				"type":        "integer",
				"description": "The person's age in years",
				"minimum":     0,
			},
			"occupation": map[string]interface{}{
				"type":        "string",
				"description": "The person's job or profession",
			},
			"hobbies": map[string]interface{}{
				"type":        "array",
				"description": "List of the person's hobbies",
				"items": map[string]interface{}{
					"type": "string",
				},
			},
		},
		"required": []interface{}{"name", "age"},
	}

	// Set up parameters for structured data processing
	params := core.StructuredParams{
		Input:        "Generate a profile for a data scientist",
		Instructions: "Create a fictional character who works with AI",
		Schema:       personSchema,
		Provider:     core.ProviderFunc(customProvider),
		MaxAttempts:  3,
	}

	// Process structured data
	fmt.Println("Processing structured data...")
	result, err := core.Structured(params)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		os.Exit(1)
	}

	// Print the result
	fmt.Println("\nRaw result:")
	fmt.Println(result.Raw)

	fmt.Println("\nStructured result:")
	fmt.Printf("Name: %s\n", result.Structured["name"])
	fmt.Printf("Age: %v\n", result.Structured["age"])
	fmt.Printf("Occupation: %s\n", result.Structured["occupation"])

	hobbies := result.Structured["hobbies"].([]interface{})
	fmt.Println("Hobbies:")
	for _, hobby := range hobbies {
		fmt.Printf("- %s\n", hobby)
	}
}
