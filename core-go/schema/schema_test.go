package schema

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestMinimalSchema(t *testing.T) {
	tests := []struct {
		name     string
		schema   map[string]interface{}
		expected string
	}{
		{
			name: "string type",
			schema: map[string]interface{}{
				"type": "string",
			},
			expected: "string",
		},
		{
			name: "number type",
			schema: map[string]interface{}{
				"type": "number",
			},
			expected: "float",
		},
		{
			name: "boolean type",
			schema: map[string]interface{}{
				"type": "boolean",
			},
			expected: "boolean",
		},
		{
			name: "enum values",
			schema: map[string]interface{}{
				"enum": []interface{}{"red", "green", "blue"},
			},
			expected: "'red' | 'green' | 'blue'",
		},
		{
			name: "object type",
			schema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"name": map[string]interface{}{
						"type": "string",
					},
					"age": map[string]interface{}{
						"type": "integer",
					},
				},
			},
			expected: "{ name: string, age: float }",
		},
		{
			name: "array type",
			schema: map[string]interface{}{
				"type": "array",
				"items": map[string]interface{}{
					"type": "string",
				},
			},
			expected: "string[]",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := MinimalSchema(tt.schema)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestCollectDescriptions(t *testing.T) {
	schema := map[string]interface{}{
		"type":        "object",
		"description": "A person",
		"properties": map[string]interface{}{
			"name": map[string]interface{}{
				"type":        "string",
				"description": "The person's name",
			},
			"age": map[string]interface{}{
				"type":        "integer",
				"description": "The person's age",
			},
			"address": map[string]interface{}{
				"type":        "object",
				"description": "The person's address",
				"properties": map[string]interface{}{
					"street": map[string]interface{}{
						"type":        "string",
						"description": "Street name",
					},
					"city": map[string]interface{}{
						"type":        "string",
						"description": "City name",
					},
				},
			},
		},
	}

	result := CollectDescriptions(schema, "", "")
	assert.Contains(t, result, "Root: A person")
	assert.Contains(t, result, "name: The person's name")
	assert.Contains(t, result, "age: The person's age")
	assert.Contains(t, result, "address: The person's address")
	assert.Contains(t, result, "address.street: Street name")
	assert.Contains(t, result, "address.city: City name")
}

func TestValidateResult(t *testing.T) {
	schema := map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"name": map[string]interface{}{
				"type": "string",
			},
			"age": map[string]interface{}{
				"type": "integer",
			},
		},
		"required": []interface{}{"name", "age"},
	}

	// Valid data
	validData := map[string]interface{}{
		"name": "John",
		"age":  30,
	}
	valid, errors := ValidateResult(schema, validData)
	assert.True(t, valid)
	assert.Empty(t, errors)

	// Invalid data (missing required field)
	invalidData := map[string]interface{}{
		"name": "John",
	}
	valid, errors = ValidateResult(schema, invalidData)
	assert.False(t, valid)
	assert.NotEmpty(t, errors)
}

func TestValidateJsonSchema(t *testing.T) {
	// Valid schema
	validSchema := map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"name": map[string]interface{}{
				"type": "string",
			},
		},
	}
	valid, err := ValidateJsonSchema(validSchema)
	assert.True(t, valid)
	assert.Empty(t, err)

	// Invalid schema (illegal $ref)
	invalidSchema := map[string]interface{}{
		"$ref": "#/definitions/person",
	}
	valid, err = ValidateJsonSchema(invalidSchema)
	assert.False(t, valid)
	assert.NotEmpty(t, err)
}
