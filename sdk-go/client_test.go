package l1m

import (
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"testing"

	"github.com/joho/godotenv"
)

func init() {
	// Load .env file if it exists
	_ = godotenv.Load()
}

func TestStructured(t *testing.T) {
	client := NewClient(&ClientOptions{
		Provider: &Provider{
			Model: os.Getenv("TEST_PROVIDER_MODEL"),
			URL:   os.Getenv("TEST_PROVIDER_URL"),
			Key:   os.Getenv("TEST_PROVIDER_KEY"),
		},
	})

	// Test text input
	t.Run("Text Input", func(t *testing.T) {
		input := "John Smith was born on January 15, 1980. He works at Acme Inc. as a Senior Engineer and can be reached at john.smith@example.com or by phone at (555) 123-4567."
		schema := map[string]interface{}{
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

		result, err := client.Structured(&StructuredRequest{
			Input:  input,
			Schema: schema,
		}, nil)

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		data, ok := result.(map[string]interface{})
		if !ok {
			t.Fatal("Expected map[string]interface{} result")
		}

		expectedValues := map[string]string{
			"name":    "John Smith",
			"company": "Acme Inc.",
		}

		for key, expected := range expectedValues {
			if data[key] != expected {
				t.Errorf("Expected %s '%s', got %v", key, expected, data[key])
			}
		}

		contactInfo, ok := data["contactInfo"].(map[string]interface{})
		if !ok {
			t.Fatal("Expected contactInfo to be map[string]interface{}")
		}

		expectedContact := map[string]string{
			"email": "john.smith@example.com",
			"phone": "(555) 123-4567",
		}

		for key, expected := range expectedContact {
			if contactInfo[key] != expected {
				t.Errorf("Expected contactInfo.%s '%s', got %v", key, expected, contactInfo[key])
			}
		}
	})

	// Test image input
	t.Run("Image Input", func(t *testing.T) {
		resp, err := http.Get("https://upload.wikimedia.org/wikipedia/en/4/4d/Shrek_%28character%29.png")
		if err != nil {
			t.Fatal(err)
		}
		defer resp.Body.Close()

		imageBytes, err := io.ReadAll(resp.Body)
		if err != nil {
			t.Fatal(err)
		}

		base64Image := base64.StdEncoding.EncodeToString(imageBytes)

		schema := map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"character": map[string]interface{}{"type": "string"},
			},
		}

		result, err := client.Structured(&StructuredRequest{
			Input:  base64Image,
			Schema: schema,
		}, nil)

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		data, ok := result.(map[string]interface{})
		if !ok {
			t.Fatal("Expected map[string]interface{} result")
		}

		if data["character"] != "Shrek" {
			t.Errorf("Expected character 'Shrek', got %v", data["character"])
		}
	})

	// Test invalid API key
	t.Run("Invalid API Key", func(t *testing.T) {
		invalidClient := NewClient(&ClientOptions{
			Provider: &Provider{
				Model: os.Getenv("TEST_PROVIDER_MODEL"),
				URL:   os.Getenv("TEST_PROVIDER_URL"),
				Key:   "INVALID",
			},
		})

		schema := map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"name": map[string]interface{}{"type": "string"},
			},
		}

		_, err := invalidClient.Structured(&StructuredRequest{
			Input:  "Some test input",
			Schema: schema,
		}, nil)

		if err == nil {
			t.Fatal("Expected error with invalid API key, got nil")
		}

		if !strings.Contains(err.Error(), "401") {
			t.Errorf("Expected 401 error, got: %v", err)
		}
	})

	// Test cache TTL
	t.Run("Cache TTL", func(t *testing.T) {
		input := "Some cacheable content"
		schema := map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"summary": map[string]interface{}{"type": "string"},
			},
		}

		// First request with cache TTL
		result1, err := client.Structured(&StructuredRequest{
			Input:  input,
			Schema: schema,
		}, &RequestOptions{
			CacheTTL: 3600, // 1 hour cache
		})

		if err != nil {
			t.Fatalf("Expected no error on first request, got %v", err)
		}

		// Second request with same input should use cache
		result2, err := client.Structured(&StructuredRequest{
			Input:  input,
			Schema: schema,
		}, &RequestOptions{
			CacheTTL: 3600,
		})

		if err != nil {
			t.Fatalf("Expected no error on second request, got %v", err)
		}

		// Compare the string representations instead of direct map comparison
		result1Str := fmt.Sprintf("%v", result1)
		result2Str := fmt.Sprintf("%v", result2)

		if result1Str != result2Str {
			t.Error("Expected cached result to be identical to first result")
		}
	})
}
