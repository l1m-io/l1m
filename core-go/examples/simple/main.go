package main

import (
	"fmt"
	"os"

	"github.com/inferablehq/l1m/core-go"
)

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

	// Example of validating data against a schema
	personData := map[string]interface{}{
		"name":       "John Doe",
		"age":        30,
		"occupation": "Software Engineer",
		"hobbies":    []interface{}{"reading", "hiking", "coding"},
	}

	valid, errors := core.ValidateResult(personSchema, personData)
	if valid {
		fmt.Println("Person data is valid!")
	} else {
		fmt.Println("Person data is invalid:", errors)
		os.Exit(1)
	}

	// Example of generating a minimal schema representation
	minSchema := core.MinimalSchema(personSchema)
	fmt.Println("\nMinimal schema representation:")
	fmt.Println(minSchema)

	// Example of collecting descriptions from a schema
	descriptions := core.CollectDescriptions(personSchema, "", "")
	fmt.Println("\nSchema descriptions:")
	fmt.Println(descriptions)

	// Example of base64 utilities
	base64String := "SGVsbG8gV29ybGQ="
	isBase64 := core.IsBase64(base64String)
	fmt.Printf("\nIs '%s' valid base64? %v\n", base64String, isBase64)

	if isBase64 {
		mimeType, err := core.InferType(base64String)
		if err != nil {
			fmt.Println("Error inferring MIME type:", err)
		} else {
			fmt.Printf("MIME type: %s\n", mimeType)
		}
	}

	// Example of parsing JSON from a string
	jsonString := `Here is some JSON: {"message": "Hello, World!"}`
	parsed, err := core.ParseJSONSubstring(jsonString)
	if err != nil {
		fmt.Println("Error parsing JSON:", err)
	} else {
		fmt.Println("\nParsed JSON:", parsed)
	}
}
