package base64

import (
	"encoding/base64"

	"github.com/gabriel-vasile/mimetype"
)

// ValidTypes is a list of supported MIME types
var ValidTypes = []string{
	"text/plain",
	"application/json",
	"image/jpeg",
	"image/png",
}

// IsBase64 checks if a string is valid base64 encoded
func IsBase64(str string) bool {
	_, err := base64.StdEncoding.DecodeString(str)
	return err == nil
}

// InferType detects the MIME type of base64 encoded data
func InferType(b64 string) (string, error) {
	if !IsBase64(b64) {
		return "", nil
	}

	data, err := base64.StdEncoding.DecodeString(b64)
	if err != nil {
		return "", err
	}

	mime := mimetype.Detect(data)
	return mime.String(), nil
}
