export interface Transaction {
    id: string; // Assuming "trx_id" can be used for id
    trx_id: string;
    merchant_id: string;
    amount_trx_id: string; // Not present in the provided data, so it's unclear. Can be removed or added later.
    partner_reference_no: string;
    referenceNo: string;
    status: string; // "PAID" would need to map to "success"
    transaction_date: string;
    paid_date: string | null;
    amount: number;
    currency: string; // Currency is empty, so you might want to make this optional or set a default.
    customer_name: string; // Not available in provided data.
    description: string; // Not available in provided data.
    updated_at: string;
}

export interface SearchParams {
    reference_number?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
    page?: number;
    limit?: number;
}

// Di file types.ts, perbaiki interface TransactionTableProps
export interface TransactionTableProps {
    transactions: Transaction[];
    isLoading?: boolean;
    onSearch?: (searchTerm: string) => void; // Hanya string
    onStatusFilter?: (status: string) => void; // Hanya string
    onTableSearch?: (searchTerm: SearchParams) => void; // Hanya string
    currentPage?: number;
    itemsPerPage?: number;
    onPageChange?: (page: number) => void;
    onItemsPerPageChange?: (limit: number) => void;
    totalItems?: number;
    totalPages?: number;
}

// Hapus atau comment yang lama jika ada conflict

// export interface TransactionTableProps {
//     transactions: Transaction[];
//     onSearch: (params: SearchParams) => Promise<void>;
//     isLoading: boolean;
//     itemsPerPage: number;
//     currentPage: number;
// }