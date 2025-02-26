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

// ClientOptions contains configuration options for the L1M client
type ClientOptions struct {
	BaseURL  string
	Provider *Provider
}

// Provider contains the provider-specific configuration
type Provider struct {
	Model string
	URL   string
	Key   string
}

// RequestOptions contains options for individual requests
type RequestOptions struct {
	Provider *Provider
	// Optional cache TTL in seconds
	CacheTTL int64
}

// Client is the main L1M API client
type Client struct {
	baseURL    string
	httpClient *http.Client
	provider   *Provider
}

// L1MError represents an error returned by the L1M API
type L1MError struct {
	Message    string
	StatusCode int
	Body       interface{}
}

func (e *L1MError) Error() string {
	return fmt.Sprintf("l1m error: %s (status: %d)", e.Message, e.StatusCode)
}

// NewClient creates a new L1M client instance
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

// StructuredRequest represents the input for a structured request
type StructuredRequest struct {
	Input  string      `json:"input"`
	Schema interface{} `json:"schema"`
}

// StructuredResponse represents the response from a structured request
type StructuredResponse struct {
	Data interface{} `json:"data"`
}

// Structured sends a structured request to the L1M API
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

// Add this helper function at the end of the file
func isValidURL(str string) bool {
	// Check if the URL starts with http:// or https://
	return len(str) > 8 && (str[:7] == "http://" || str[:8] == "https://")
}
