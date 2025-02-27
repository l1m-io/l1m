package l1m

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
)

// Package l1m provides a client for the L1M API, which helps extract structured data from text and images using LLMs.
//
// L1M is a proxy service that converts unstructured text or images into structured JSON data using Large Language Models (LLMs).
// It provides a schema-first approach where you define your desired data structure in JSON Schema and get back exactly what you need.
//
// Example usage:
//
//	client := l1m.NewClient(&l1m.ClientOptions{
//		Provider: &l1m.Provider{
//			URL:   "https://api.openai.com/v1",
//			Key:   "your-api-key",
//			Model: "gpt-4",
//		},
//	})
//
//	req := &l1m.StructuredRequest{
//		Input: "The price of AAPL stock is $150.50",
//		Schema: map[string]interface{}{
//			"type": "object",
//			"properties": map[string]interface{}{
//				"stock":  map[string]interface{}{"type": "string"},
//				"price":  map[string]interface{}{"type": "number"},
//			},
//		},
//	}
//
//	data, err := client.Structured(req, nil)

// ClientOptions contains configuration options for the L1M client.
// It allows customizing the base URL and provider settings.
type ClientOptions struct {
	// BaseURL is the base URL for the L1M API. If not provided, defaults to https://api.l1m.io
	BaseURL string
	// Provider contains the configuration for the LLM provider
	Provider *Provider
}

// Provider contains the provider-specific configuration for the LLM service.
type Provider struct {
	// Model specifies which LLM model to use (e.g., "gpt-4" for OpenAI)
	Model string
	// URL is the base URL of the provider's API (must be an absolute URL)
	URL string
	// Key is the API key for authentication with the provider
	Key string
}

// RequestOptions contains options for individual requests to the L1M API.
type RequestOptions struct {
	// Provider allows overriding the default provider settings for this request
	Provider *Provider
	// CacheTTL specifies how long (in seconds) to cache the response
	CacheTTL int64
}

// Client is the main L1M API client that handles communication with the L1M service.
type Client struct {
	baseURL    string
	httpClient *http.Client
	provider   *Provider
}

// L1MError represents an error returned by the L1M API.
// It includes the error message, HTTP status code, and response body.
type L1MError struct {
	// Message contains the error description
	Message string
	// StatusCode is the HTTP status code returned by the API
	StatusCode int
	// Body contains the raw error response from the API
	Body interface{}
}

// Error implements the error interface for L1MError.
func (e *L1MError) Error() string {
	return fmt.Sprintf("l1m error: %s (status: %d)", e.Message, e.StatusCode)
}

// NewClient creates a new L1M client instance with the provided options.
// If no base URL is provided in options or environment, it defaults to https://api.l1m.io.
// The environment variable L1M_BASE_URL can be used to override the default base URL.
func NewClient(options *ClientOptions) *Client {
	baseURL := os.Getenv("L1M_BASE_URL")
	if baseURL == "" {
		baseURL = "https://api.l1m.io"
	}

	if options != nil && options.BaseURL != "" {
		baseURL = options.BaseURL
	}

	return &Client{
		baseURL:    baseURL,
		httpClient: &http.Client{},
		provider:   options.Provider,
	}
}

// StructuredRequest represents the input for a structured data extraction request.
type StructuredRequest struct {
	// Input is the text or base64-encoded image to extract data from
	Input string `json:"input"`
	// Schema defines the desired output structure using JSON Schema
	Schema interface{} `json:"schema"`
	Instruction *string `json:"instruction",omitempty`
}

// StructuredResponse represents the response from a structured request.
type StructuredResponse struct {
	// Data contains the extracted structured data matching the requested schema
	Data interface{} `json:"data"`
}

// Structured sends a structured request to the L1M API to extract data according to the provided schema.
// It returns the extracted data as a generic interface{} that matches the schema structure.
// The opts parameter can be used to override provider settings or specify caching behavior.
func (c *Client) Structured(req *StructuredRequest, opts *RequestOptions) (interface{}, error) {
	provider := c.provider
	if opts != nil && opts.Provider != nil {
		provider = opts.Provider
	}

	if provider == nil {
		return nil, &L1MError{Message: "No provider specified"}
	}

	// Ensure provider URL is absolute
	if !isValidURL(provider.URL) {
		return nil, &L1MError{Message: "Provider URL must be an absolute URL. Got: " + provider.URL}
	}

	jsonBody, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequest("POST", c.baseURL+"/structured", bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	headers := map[string]string{
		"Content-Type":     "application/json",
		"x-provider-model": c.provider.Model,
		"x-provider-url":   c.provider.URL,
		"x-provider-key":   c.provider.Key,
	}

	// Add cache TTL header if specified
	if opts != nil && opts.CacheTTL > 0 {
		headers["x-cache-ttl"] = strconv.FormatInt(opts.CacheTTL, 10)
	}

	for key, value := range headers {
		httpReq.Header.Set(key, value)
	}

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode >= 400 {
		var errorResp map[string]interface{}
		if err := json.Unmarshal(body, &errorResp); err != nil {
			return nil, &L1MError{
				Message:    "Failed to parse error response",
				StatusCode: resp.StatusCode,
				Body:       string(body),
			}
		}
		return nil, &L1MError{
			Message:    fmt.Sprintf("%v", errorResp["message"]),
			StatusCode: resp.StatusCode,
			Body:       errorResp,
		}
	}

	var response StructuredResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return response.Data, nil
}

// isValidURL checks if the given string is a valid absolute URL starting with http:// or https://.
func isValidURL(str string) bool {
	// Check if the URL starts with http:// or https://
	return len(str) > 8 && (str[:7] == "http://" || str[:8] == "https://")
}
