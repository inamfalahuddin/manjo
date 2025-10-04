// pkg/util/status_mapper.go
package util

type StatusMapper interface {
	MapTransactionStatus(transactionStatusDesc string) string
	GetInternalStatus(transactionStatusDesc string) string
	IsValidStatus(transactionStatusDesc string) bool
}

type statusMapper struct {
	statusMapping map[string]string
	validStatuses []string
}

func NewStatusMapper() StatusMapper {
	// Define mapping dari external status ke internal status
	mapping := map[string]string{
		"Success": "PAID",
		"Failed":  "FAILED",
		"Pending": "PENDING",
		"Expired": "EXPIRED",
		"Paid":    "PAID",
		"PAID":    "PAID",
		"SUCCESS": "PAID",
		"FAILED":  "FAILED",
		"PENDING": "PENDING",
		"EXPIRED": "EXPIRED",
	}

	validStatuses := []string{"Success", "Failed", "Pending", "Expired", "Paid", "PAID", "SUCCESS", "FAILED", "PENDING", "EXPIRED"}

	return &statusMapper{
		statusMapping: mapping,
		validStatuses: validStatuses,
	}
}

// MapTransactionStatus memetakan external status ke internal status
func (m *statusMapper) MapTransactionStatus(transactionStatusDesc string) string {
	if internalStatus, exists := m.statusMapping[transactionStatusDesc]; exists {
		return internalStatus
	}
	return "PENDING" // default fallback
}

// GetInternalStatus alias untuk MapTransactionStatus
func (m *statusMapper) GetInternalStatus(transactionStatusDesc string) string {
	return m.MapTransactionStatus(transactionStatusDesc)
}

// IsValidStatus mengecek apakah status yang diberikan valid
func (m *statusMapper) IsValidStatus(transactionStatusDesc string) bool {
	for _, validStatus := range m.validStatuses {
		if validStatus == transactionStatusDesc {
			return true
		}
	}
	return false
}
