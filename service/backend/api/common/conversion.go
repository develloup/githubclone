package common

import "strings"

func ASCIIToStringFromInts(ascii []int) string {
	var sb strings.Builder
	for _, code := range ascii {
		sb.WriteByte(byte(code))
	}
	return sb.String()
}

func ASCIIToStringFromBytes(ascii []byte) string {
	return string(ascii)
}
