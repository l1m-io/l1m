package base64

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestIsBase64(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected bool
	}{
		{
			name:     "valid base64",
			input:    "SGVsbG8gV29ybGQ=",
			expected: true,
		},
		{
			name:     "invalid base64",
			input:    "not base64!",
			expected: false,
		},
		{
			name:     "empty string",
			input:    "",
			expected: true, // Empty string is valid base64
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsBase64(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestInferType(t *testing.T) {
	// Text
	textBase64 := "SGVsbG8gV29ybGQ="
	mimeType, err := InferType(textBase64)
	assert.NoError(t, err)
	assert.Equal(t, "text/plain; charset=utf-8", mimeType)

	// Invalid base64
	_, err = InferType("not base64!")
	assert.NoError(t, err) // Should return empty string, not error
}
