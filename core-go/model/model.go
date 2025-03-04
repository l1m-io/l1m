package model

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/inferablehq/l1m/core-go/schema"
)

// ProviderConfig represents configuration for an AI provider
type ProviderConfig struct {
	URL   string `json:"url"`
	Key   string `json:"key"`
	Model string `json:"model"`
}

// StructuredParams represents parameters for structured data processing
type StructuredParams struct {
	Input        string                 `json:"input"`
	Type         string                 `json:"type,omitempty"`
	Instructions string                 `json:"instructions,omitempty"`
	Schema       map[string]interface{} `json:"schema"`
	Provider     interface{}            `json:"provider"` // Can be ProviderConfig or ProviderFunc
	MaxAttempts  int                    `json:"maxAttempts,omitempty"`
}

// ProviderFunc is a function type for custom provider implementations
type ProviderFunc func(params StructuredParams, initialPrompt string, previousAttempts []Attempt) (string, error)

// Attempt represents a previous attempt at generating structured data
type Attempt struct {
	Raw    string `json:"raw"`
	Errors string `json:"errors,omitempty"`
}

// StructuredResult represents the result of structured data processing
type StructuredResult struct {
	Raw        string                 `json:"raw"`
	Structured map[string]interface{} `json:"structured"`
}

// Structured processes structured data from different providers
func Structured(params StructuredParams) (*StructuredResult, error) {
	if params.MaxAttempts <= 0 {
		params.MaxAttempts = 1
	}

	prompt := fmt.Sprintf("Answer in JSON using this schema:\n%s\n%s",
		schema.MinimalSchema(params.Schema),
		schema.CollectDescriptions(params.Schema, "", ""))

	var previousAttempts []Attempt
	var result *StructuredResult
	var err error

	for attempt := 0; attempt < params.MaxAttempts; attempt++ {
		// Only include the last 2 attempts in the context
		last2Attempts := previousAttempts
		if len(previousAttempts) > 2 {
			last2Attempts = previousAttempts[len(previousAttempts)-2:]
		}

		switch p := params.Provider.(type) {
		case ProviderFunc:
			result, err = processWithCustomHandler(params, p, prompt, last2Attempts)
		case ProviderConfig:
			if strings.Contains(p.URL, "generativelanguage.googleapis.com") {
				result, err = processWithGoogle(params, prompt, last2Attempts)
			} else if strings.Contains(p.URL, "anthropic.com") {
				result, err = processWithAnthropic(params, prompt, last2Attempts)
			} else {
				result, err = processWithOpenAI(params, prompt, last2Attempts)
			}
		default:
			return nil, errors.New("invalid provider configuration")
		}

		if err != nil {
			return nil, err
		}

		// Validate the result against the schema
		valid, validationErrors := schema.ValidateResult(params.Schema, result.Structured)
		if valid {
			return result, nil
		}

		// Add this attempt to previous attempts
		errorStr := strings.Join(validationErrors, "; ")
		previousAttempts = append(previousAttempts, Attempt{
			Raw:    result.Raw,
			Errors: errorStr,
		})

		// If this is the last attempt, return the result with validation errors
		if attempt == params.MaxAttempts-1 {
			return result, fmt.Errorf("validation failed: %s", errorStr)
		}
	}

	return result, nil
}

// ParseJSONSubstring extracts and parses JSON from a string
func ParseJSONSubstring(raw string) (map[string]interface{}, error) {
	// Find JSON-like substrings
	re := regexp.MustCompile(`(?s)\{.*\}`)
	match := re.FindString(raw)
	if match == "" {
		return nil, errors.New("no JSON object found in the response")
	}

	// Try to parse the JSON
	var result map[string]interface{}
	err := json.Unmarshal([]byte(match), &result)
	if err != nil {
		// Try to clean up the JSON string
		cleanJSON := strings.ReplaceAll(match, "\n", " ")
		cleanJSON = strings.ReplaceAll(cleanJSON, "\r", "")
		err = json.Unmarshal([]byte(cleanJSON), &result)
		if err != nil {
			return nil, fmt.Errorf("failed to parse JSON: %v", err)
		}
	}

	return result, nil
}

// processWithCustomHandler processes data using a custom handler function
func processWithCustomHandler(
	params StructuredParams,
	handler ProviderFunc,
	initialPrompt string,
	previousAttempts []Attempt,
) (*StructuredResult, error) {
	raw, err := handler(params, initialPrompt, previousAttempts)
	if err != nil {
		return nil, err
	}

	structured, err := ParseJSONSubstring(raw)
	return &StructuredResult{
		Raw:        raw,
		Structured: structured,
	}, err
}

// processWithGoogle processes data using Google's Generative AI
func processWithGoogle(
	params StructuredParams,
	initialPrompt string,
	previousAttempts []Attempt,
) (*StructuredResult, error) {
	config, ok := params.Provider.(ProviderConfig)
	if !ok {
		return nil, errors.New("invalid Google provider configuration")
	}

	// Build the prompt
	prompt := buildPrompt(params, initialPrompt, previousAttempts)

	// Prepare the request payload
	payload := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"role": "user",
				"parts": []map[string]interface{}{
					{
						"text": prompt,
					},
				},
			},
		},
		"generationConfig": map[string]interface{}{
			"temperature": 0.2,
		},
	}

	// Send the request
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf("%s/v1beta/models/%s:generateContent?key=%s",
		config.URL, config.Model, config.Key)

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// Parse the response
	var response map[string]interface{}
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, err
	}

	// Extract the generated text
	candidates, ok := response["candidates"].([]interface{})
	if !ok || len(candidates) == 0 {
		return nil, errors.New("no candidates in response")
	}

	candidate := candidates[0].(map[string]interface{})
	content := candidate["content"].(map[string]interface{})
	parts := content["parts"].([]interface{})
	part := parts[0].(map[string]interface{})
	text := part["text"].(string)

	// Parse the JSON from the response
	structured, err := ParseJSONSubstring(text)
	return &StructuredResult{
		Raw:        text,
		Structured: structured,
	}, err
}

// processWithAnthropic processes data using Anthropic's API
func processWithAnthropic(
	params StructuredParams,
	initialPrompt string,
	previousAttempts []Attempt,
) (*StructuredResult, error) {
	config, ok := params.Provider.(ProviderConfig)
	if !ok {
		return nil, errors.New("invalid Anthropic provider configuration")
	}

	// Build the prompt
	prompt := buildPrompt(params, initialPrompt, previousAttempts)

	// Prepare the request payload
	payload := map[string]interface{}{
		"model":       config.Model,
		"max_tokens":  1024,
		"temperature": 0.2,
		"messages": []map[string]interface{}{
			{
				"role":    "user",
				"content": prompt,
			},
		},
	}

	// Send the request
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", config.URL, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", config.Key)
	req.Header.Set("anthropic-version", "2023-06-01")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// Parse the response
	var response map[string]interface{}
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, err
	}

	// Extract the generated text
	content, ok := response["content"].([]interface{})
	if !ok || len(content) == 0 {
		return nil, errors.New("no content in response")
	}

	text := ""
	for _, item := range content {
		if itemMap, ok := item.(map[string]interface{}); ok {
			if itemText, ok := itemMap["text"].(string); ok {
				text += itemText
			}
		}
	}

	// Parse the JSON from the response
	structured, err := ParseJSONSubstring(text)
	return &StructuredResult{
		Raw:        text,
		Structured: structured,
	}, err
}

// processWithOpenAI processes data using OpenAI's API
func processWithOpenAI(
	params StructuredParams,
	initialPrompt string,
	previousAttempts []Attempt,
) (*StructuredResult, error) {
	config, ok := params.Provider.(ProviderConfig)
	if !ok {
		return nil, errors.New("invalid OpenAI provider configuration")
	}

	// Build the prompt
	prompt := buildPrompt(params, initialPrompt, previousAttempts)

	// Prepare the request payload
	payload := map[string]interface{}{
		"model":       config.Model,
		"temperature": 0.2,
		"messages": []map[string]interface{}{
			{
				"role":    "user",
				"content": prompt,
			},
		},
	}

	// Send the request
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", config.URL, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+config.Key)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// Parse the response
	var response map[string]interface{}
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, err
	}

	// Extract the generated text
	choices, ok := response["choices"].([]interface{})
	if !ok || len(choices) == 0 {
		return nil, errors.New("no choices in response")
	}

	choice := choices[0].(map[string]interface{})
	message := choice["message"].(map[string]interface{})
	content := message["content"].(string)

	// Parse the JSON from the response
	structured, err := ParseJSONSubstring(content)
	return &StructuredResult{
		Raw:        content,
		Structured: structured,
	}, err
}

// buildPrompt constructs the prompt for the AI model
func buildPrompt(params StructuredParams, initialPrompt string, previousAttempts []Attempt) string {
	prompt := params.Input + "\n\n" + initialPrompt

	if params.Instructions != "" {
		prompt = params.Instructions + "\n\n" + prompt
	}

	if len(previousAttempts) > 0 {
		prompt += "\n\nPrevious attempts failed with these errors:"
		for i, attempt := range previousAttempts {
			prompt += fmt.Sprintf("\n\nAttempt %d:\n%s\nErrors: %s",
				i+1, attempt.Raw, attempt.Errors)
		}
		prompt += "\n\nPlease fix the errors and try again."
	}

	return prompt
}
