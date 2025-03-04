package schema

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/xeipuuv/gojsonschema"
)

// MinimalSchema builds a minimal representation of the JSON schema for use in prompts
func MinimalSchema(schema map[string]interface{}) string {
	if schema == nil {
		return ""
	}

	// Handle enum
	if enum, ok := schema["enum"].([]interface{}); ok && len(enum) > 0 {
		var enumValues []string
		for _, value := range enum {
			switch v := value.(type) {
			case string:
				enumValues = append(enumValues, fmt.Sprintf("'%s'", v))
			default:
				enumValues = append(enumValues, fmt.Sprintf("%v", v))
			}
		}
		return strings.Join(enumValues, " | ")
	}

	// Handle different types
	schemaType, _ := schema["type"].(string)
	switch schemaType {
	case "string":
		return "string"
	case "number", "integer":
		return "float"
	case "boolean":
		return "boolean"
	case "array":
		if items, ok := schema["items"].(map[string]interface{}); ok {
			itemsType := MinimalSchema(items)
			if items["type"] == "object" && items["properties"] != nil {
				return fmt.Sprintf("[ %s ]", itemsType)
			}
			return fmt.Sprintf("%s[]", itemsType)
		}
		return "string[]"
	case "object":
		properties, ok := schema["properties"].(map[string]interface{})
		if !ok || len(properties) == 0 {
			return "{}"
		}

		var propStrings []string
		for key, propSchema := range properties {
			propValue := MinimalSchema(propSchema.(map[string]interface{}))
			propStrings = append(propStrings, fmt.Sprintf("%s: %s", key, propValue))
		}
		return fmt.Sprintf("{ %s }", strings.Join(propStrings, ", "))
	default:
		return "any"
	}
}

// CollectDescriptions extracts descriptions from a JSON schema
func CollectDescriptions(schema map[string]interface{}, path string, descriptions string) string {
	if schema == nil {
		return descriptions
	}

	// Add description for current schema if it exists
	if desc, ok := schema["description"].(string); ok && desc != "" {
		if path == "" {
			descriptions += fmt.Sprintf("Root: %s\n", desc)
		} else {
			descriptions += fmt.Sprintf("%s: %s\n", path, desc)
		}
	}

	// Process properties for objects
	if schemaType, _ := schema["type"].(string); schemaType == "object" {
		if properties, ok := schema["properties"].(map[string]interface{}); ok {
			for propName, propSchema := range properties {
				propPath := propName
				if path != "" {
					propPath = path + "." + propName
				}
				if propMap, ok := propSchema.(map[string]interface{}); ok {
					descriptions = CollectDescriptions(propMap, propPath, descriptions)
				}
			}
		}
	}

	// Process items for arrays
	if schemaType, _ := schema["type"].(string); schemaType == "array" {
		if items, ok := schema["items"].(map[string]interface{}); ok {
			itemPath := path + "[]"
			descriptions = CollectDescriptions(items, itemPath, descriptions)
		}
	}

	return descriptions
}

// ValidateResult validates data against a JSON schema
func ValidateResult(schema map[string]interface{}, data interface{}) (bool, []string) {
	schemaLoader := gojsonschema.NewGoLoader(schema)
	dataLoader := gojsonschema.NewGoLoader(data)

	result, err := gojsonschema.Validate(schemaLoader, dataLoader)
	if err != nil {
		return false, []string{err.Error()}
	}

	if result.Valid() {
		return true, nil
	}

	var errors []string
	for _, err := range result.Errors() {
		errors = append(errors, err.String())
	}
	return false, errors
}

// ValidateJsonSchema validates that a schema is a valid JSON Schema
func ValidateJsonSchema(schema map[string]interface{}) (bool, string) {
	// Check for illegal schema properties
	if illegalError := illegalSchemaCheck(schema); illegalError != "" {
		return false, illegalError
	}

	// Validate schema syntax
	schemaJSON, err := json.Marshal(schema)
	if err != nil {
		return false, fmt.Sprintf("Failed to marshal schema: %v", err)
	}

	_, err = gojsonschema.NewSchema(gojsonschema.NewBytesLoader(schemaJSON))
	if err != nil {
		return false, fmt.Sprintf("Invalid JSON Schema: %v", err)
	}

	return true, ""
}

// illegalSchemaCheck checks for illegal schema properties
func illegalSchemaCheck(schema map[string]interface{}) string {
	// Check for $ref which is not supported in this implementation
	if _, hasRef := schema["$ref"]; hasRef {
		return "Schema contains $ref which is not supported"
	}

	// Check for patternProperties which is complex to implement
	if _, hasPatternProps := schema["patternProperties"]; hasPatternProps {
		return "Schema contains patternProperties which is not supported"
	}

	// Recursively check properties
	if properties, ok := schema["properties"].(map[string]interface{}); ok {
		for _, propSchema := range properties {
			if propMap, ok := propSchema.(map[string]interface{}); ok {
				if err := illegalSchemaCheck(propMap); err != "" {
					return err
				}
			}
		}
	}

	// Recursively check array items
	if items, ok := schema["items"].(map[string]interface{}); ok {
		if err := illegalSchemaCheck(items); err != "" {
			return err
		}
	}

	return ""
}
