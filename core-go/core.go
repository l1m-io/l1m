// Package core provides core functionality for the L1M API in Go
package core

import (
	"github.com/inferablehq/l1m/core-go/base64"
	"github.com/inferablehq/l1m/core-go/model"
	"github.com/inferablehq/l1m/core-go/schema"
)

// Export base64 functions
var (
	// ValidTypes is a list of supported MIME types
	ValidTypes = base64.ValidTypes

	// IsBase64 checks if a string is valid base64 encoded
	IsBase64 = base64.IsBase64

	// InferType detects the MIME type of base64 encoded data
	InferType = base64.InferType
)

// Export schema functions
var (
	// MinimalSchema builds a minimal representation of the JSON schema for use in prompts
	MinimalSchema = schema.MinimalSchema

	// CollectDescriptions extracts descriptions from a JSON schema
	CollectDescriptions = schema.CollectDescriptions

	// ValidateResult validates data against a JSON schema
	ValidateResult = schema.ValidateResult

	// ValidateJsonSchema validates that a schema is a valid JSON Schema
	ValidateJsonSchema = schema.ValidateJsonSchema
)

// Export model types and functions
type (
	// ProviderConfig represents configuration for an AI provider
	ProviderConfig = model.ProviderConfig

	// StructuredParams represents parameters for structured data processing
	StructuredParams = model.StructuredParams

	// ProviderFunc is a function type for custom provider implementations
	ProviderFunc = model.ProviderFunc

	// Attempt represents a previous attempt at generating structured data
	Attempt = model.Attempt

	// StructuredResult represents the result of structured data processing
	StructuredResult = model.StructuredResult
)

var (
	// Structured processes structured data from different providers
	Structured = model.Structured

	// ParseJSONSubstring extracts and parses JSON from a string
	ParseJSONSubstring = model.ParseJSONSubstring
)
