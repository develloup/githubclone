package utils

import (
	"path/filepath"
	"strings"

	"github.com/gabriel-vasile/mimetype"
)

var knownTextMIMEs = map[string]string{
	".md":   "text/markdown",
	".rst":  "text/x-rst",
	".adoc": "text/asciidoc",
}

func DetectMIME(path string, decodedContent []byte) string {
	ext := strings.ToLower(filepath.Ext(path))
	if mime, ok := knownTextMIMEs[ext]; ok {
		return mime
	}
	return mimetype.Detect(decodedContent).String()
}
