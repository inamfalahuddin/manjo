// transaction-table.tsx
import React, { memo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// Impor ikon yang dibutuhkan (HARUS dari lucide-react-native)
import { ChevronLeft, ChevronRight, Eye, Filter } from 'lucide-react-native';

// Import config dan types (Asumsi path dan interface sudah benar)
import statusConfig, { StatusConfigItem } from '@/lib/status';
import { Transaction, TransactionTableProps } from '../types';

// ====================================================================
// KONFIGURASI DAN STYLES (Dioptimalkan untuk React Native)
// ====================================================================

const TABLE_MIN_WIDTH = 1000;
const COLUMN_CONFIG = [
    { key: 'referenceNo', title: 'Reference No', width: 200 },
    { key: 'status', title: 'Status', width: 120 },
    { key: 'amount', title: 'Amount', width: 120, align: 'right' as const },
    { key: 'currency', title: 'Currency', width: 80 },
    { key: 'transaction_date', title: 'Date', width: 180 },
    { key: 'paid_date', title: 'Paid Date', width: 180 },
    { key: 'actions', title: 'Actions', width: 120, align: 'center' as const },
];

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        margin: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        overflow: 'hidden', // Penting untuk border radius
    },
    // Header Kontrol (Search, Filter)
    controlHeader: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    searchFilterRow: {
        flexDirection: 'row',
        gap: 12,
    },
    searchInput: {
        flex: 1,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
    },
    // Tabel Scroll
    tableScrollWrapper: {
        minWidth: TABLE_MIN_WIDTH,
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#f9fafb',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        width: TABLE_MIN_WIDTH,
    },
    headerCell: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontWeight: '600',
        fontSize: 12,
        color: '#4b5563',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        width: TABLE_MIN_WIDTH,
    },
    dataCell: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 14,
        color: '#374151',
        overflow: 'hidden',
        justifyContent: 'center',
    },
    // Status Badge
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        minWidth: 80,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    // Pagination
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        backgroundColor: '#f9fafb',
    },
    pageButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        marginHorizontal: 4,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    pageButtonDisabled: {
        opacity: 0.5,
    },
    pageText: {
        fontSize: 14,
        color: '#374151',
    },
});

// ====================================================================
// KOMPONEN STATUS BADGE (Penting: Komponen ini harus menggunakan Lucide React Native yang benar)
// ====================================================================

interface StatusBadgeProps {
    status: string;
}

const getStatusConfig = (status: string): StatusConfigItem => {
    const normalizedStatus = status.toLowerCase();
    return statusConfig[normalizedStatus] || statusConfig.expired;
};

const StatusBadge = memo(({ status }: StatusBadgeProps) => {
    const config = getStatusConfig(status);
    const IconComponent = config.icon; // Ikon adalah komponen yang siap dirender

    return (
        <View
            style={[
                styles.statusBadge,
                { backgroundColor: config.bgColor, borderColor: config.textColor } // Menggunakan warna dari config
            ]}
        >
            {/* PASTIKAN IconComponent adalah komponen Lucide React Native */}
            <IconComponent size={14} color={config.textColor} />
            <Text style={[styles.statusText, { color: config.textColor }]}>
                {config.text}
            </Text>
        </View>
    );
});


// ====================================================================
// KOMPONEN UTAMA TRANSACTION TABLE
// ====================================================================

const TransactionTable = (props: TransactionTableProps) => {
    const {
        transactions,
        onSearch,
        onStatusFilter,
        isLoading,
        currentPage = 1,
        totalPages = 1,
        onPageChange,
        totalItems = 0,
    } = props;

    const [localSearchTerm, setLocalSearchTerm] = useState('');
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
    const [selectedFilterStatus, setSelectedFilterStatus] = useState('');

    const handleApplyFilter = () => {
        if (onStatusFilter) {
            onStatusFilter(selectedFilterStatus);
        }
        setIsFilterModalVisible(false);
    };

    const renderCell = (item: Transaction, columnKey: string) => {
        const column = COLUMN_CONFIG.find(c => c.key === columnKey);
        const cellStyle = {
            width: column?.width,
            textAlign: column?.align || 'left' as const
        };

        switch (columnKey) {
            case 'status':
                return (
                    <View style={[styles.dataCell, cellStyle]}>
                        <StatusBadge status={item.status} />
                    </View>
                );
            case 'amount':
                // Format angka atau mata uang di sini jika perlu
                return (
                    <Text style={[styles.dataCell, cellStyle, { fontWeight: '600' }]}>
                        {`${item.currency} ${item.amount}`}
                    </Text>
                );
            case 'actions':
                return (
                    <TouchableOpacity
                        style={[styles.dataCell, cellStyle, { alignItems: 'center' }]}
                        // Aksi ke detail transaksi
                        onPress={() => console.log('View details:', item.id)}
                    >
                        <Eye size={18} color="#3b82f6" />
                    </TouchableOpacity>
                );
            default:
                return (
                    <Text style={[styles.dataCell, cellStyle]}>
                        {(item as any)[columnKey]}
                    </Text>
                );
        }
    };

    const renderTransactionItem = ({ item }: { item: Transaction }) => (
        <View style={styles.tableRow}>
            {COLUMN_CONFIG.map(col => (
                <React.Fragment key={col.key}>
                    {renderCell(item, col.key)}
                </React.Fragment>
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            {/* SEARCH & FILTER CONTROLS */}
            <View style={styles.controlHeader}>
                <View style={styles.searchFilterRow}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Cari Reference No..."
                        value={localSearchTerm}
                        onChangeText={setLocalSearchTerm}
                        onSubmitEditing={() => { if (onSearch) onSearch(localSearchTerm); }}
                        returnKeyType="search"
                    />
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setIsFilterModalVisible(true)}
                    >
                        <Filter size={16} color="#374151" />
                        <Text style={styles.pageText}>Filter</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* TABLE (Horizontal Scroll) */}
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={styles.tableScrollWrapper}>
                    {/* Header Row */}
                    <View style={styles.tableHeaderRow}>
                        {COLUMN_CONFIG.map(col => (
                            <Text
                                key={col.key}
                                style={[
                                    styles.headerCell,
                                    { width: col.width, textAlign: col.align || 'left' as const }
                                ]}
                            >
                                {col.title}
                            </Text>
                        ))}
                    </View>

                    {/* Data Rows */}
                    {isLoading ? (
                        <ActivityIndicator size="large" color="#3b82f6" style={{ marginVertical: 30 }} />
                    ) : (
                        <FlatList
                            data={transactions}
                            renderItem={renderTransactionItem}
                            keyExtractor={(item) => item.trx_id.toString()}
                            scrollEnabled={false} // FlatList didalam ScrollView
                            ListEmptyComponent={() => (
                                <View style={{ padding: 20, alignItems: 'center', width: TABLE_MIN_WIDTH }}>
                                    <Text style={{ color: '#6b7280' }}>Tidak ada data transaksi.</Text>
                                </View>
                            )}
                        />
                    )}
                </View>
            </ScrollView>

            {/* PAGINATION */}
            <View style={styles.paginationContainer}>
                <Text style={styles.pageText}>Total: {totalItems}</Text>
                <View style={{ flex: 1 }} />

                <TouchableOpacity
                    style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                    onPress={() => { if (onPageChange) onPageChange(currentPage - 1); }}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft size={16} color="#374151" />
                </TouchableOpacity>

                <Text style={styles.pageText}>
                    Halaman {currentPage} dari {totalPages}
                </Text>

                <TouchableOpacity
                    style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
                    onPress={() => { if (onPageChange) onPageChange(currentPage + 1); }}
                    disabled={currentPage === totalPages}
                >
                    <ChevronRight size={16} color="#374151" />
                </TouchableOpacity>
            </View>

            {/* FILTER MODAL */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isFilterModalVisible}
                onRequestClose={() => setIsFilterModalVisible(false)}
            >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <View style={{ width: 300, padding: 20, backgroundColor: 'white', borderRadius: 10 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Filter Status</Text>

                        {Object.keys(statusConfig).map(statusKey => {
                            const config = statusConfig[statusKey];
                            return (
                                <TouchableOpacity
                                    key={statusKey}
                                    style={{ padding: 10, marginVertical: 5, backgroundColor: selectedFilterStatus === statusKey ? '#e5e7eb' : 'transparent', borderRadius: 5 }}
                                    onPress={() => setSelectedFilterStatus(statusKey)}
                                >
                                    <Text>{config.text} ({statusKey})</Text>
                                </TouchableOpacity>
                            );
                        })}

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 }}>
                            <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                                <Text style={{ color: '#6b7280', marginRight: 15 }}>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleApplyFilter}>
                                <Text style={{ color: '#3b82f6', fontWeight: 'bold' }}>Terapkan</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </View>
    );
};

export default TransactionTable;