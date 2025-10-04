package util

import "fmt"

type QRGenerator interface {
	GenerateQRContent(merchantID, referenceNo string) string
}

type qrGenerator struct {
	template string
}

func NewQRGenerator() QRGenerator {
	return &qrGenerator{
		template: "00020101021226620015ID.CO.MANJO.WWW01189360085801751859910210%s0303UMI51530014ID.CO.QRIS.WWW0215ID102106515192304121.0.21.09.255204481653033605502015802ID5904OLDI6013JAKARTA BARAT61051147062460525%s07031110806'ASPI663040FAD",
	}
}

func (g *qrGenerator) GenerateQRContent(merchantID, referenceNo string) string {
	return fmt.Sprintf(g.template, merchantID, referenceNo)
}
