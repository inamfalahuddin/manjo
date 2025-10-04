package util

import (
	"fmt"
	"time"
)

type ReferenceGenerator interface {
	GenerateReferenceNo() string
}

type referenceGenerator struct {
	prefix string
}

func NewReferenceGenerator(prefix string) ReferenceGenerator {
	return &referenceGenerator{prefix: prefix}
}

func (g *referenceGenerator) GenerateReferenceNo() string {
	// Format: A0000000577
	// Menggunakan kombinasi timestamp dan sequence
	timestamp := time.Now().UnixNano() / int64(time.Millisecond)
	sequence := timestamp % 10000000000
	return g.prefix + fmt.Sprintf("%010d", sequence)
}
