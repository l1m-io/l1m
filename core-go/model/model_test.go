package model

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestParseJSONSubstring(t *testing.T) {
	tests := []struct {
		name        string
		input       string
		expectError bool
	}{
		{
			name:        "valid JSON",
			input:       `{"name": "John", "age": 30}`,
			expectError: false,
		},
		{
			name:        "JSON with surrounding text",
			input:       `Here is the data: {"name": "John", "age": 30} as requested.`,
			expectError: false,
		},
		{
			name:        "invalid JSON",
			input:       `{"name": "John", "age": }`,
			expectError: true,
		},
		{
			name:        "no JSON",
			input:       `There is no JSON here.`,
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := ParseJSONSubstring(tt.input)
			if tt.expectError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, result)
			}
		})
	}
}

func TestBuildPrompt(t *testing.T) {
	// Test with basic parameters
	params := StructuredParams{
		Input: "Generate a person profile",
		Schema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"name": map[string]interface{}{"type": "string"},
				"age":  map[string]interface{}{"type": "integer"},
			},
		},
	}
	initialPrompt := "Answer in JSON using this schema:\n{ name: string, age: float }\n"

	prompt := buildPrompt(params, initialPrompt, nil)
	assert.Contains(t, prompt, "Generate a person profile")
	assert.Contains(t, prompt, "Answer in JSON using this schema")

	// Test with instructions
	params.Instructions = "Create a fictional character"
	prompt = buildPrompt(params, initialPrompt, nil)
	assert.Contains(t, prompt, "Create a fictional character")

	// Test with previous attempts
	previousAttempts := []Attempt{
		{
			Raw:    `{"name": "John"}`,
			Errors: "age is required",
		},
	}
	prompt = buildPrompt(params, initialPrompt, previousAttempts)
	assert.Contains(t, prompt, "Previous attempts failed with these errors")
	assert.Contains(t, prompt, "Attempt 1")
	assert.Contains(t, prompt, "age is required")
}

func TestProcessWithCustomHandler(t *testing.T) {
	// Create a mock provider function
	mockProvider := func(params StructuredParams, initialPrompt string, previousAttempts []Attempt) (string, error) {
		return `{"name": "John Doe", "age": 30}`, nil
	}

	// Set up parameters
	params := StructuredParams{
		Input: "Generate a person profile",
		Schema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"name": map[string]interface{}{"type": "string"},
				"age":  map[string]interface{}{"type": "integer"},
			},
			"required": []interface{}{"name", "age"},
		},
	}

	// Call the function directly
	result, err := processWithCustomHandler(params, mockProvider, "test prompt", nil)

	// Check the result
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "John Doe", result.Structured["name"])
	assert.Equal(t, float64(30), result.Structured["age"]) // JSON numbers are parsed as float64
}
