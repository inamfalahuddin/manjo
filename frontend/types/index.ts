export interface Transaction {
    id: string; // Assuming "trx_id" can be used for id
    trx_id: string;
    merchant_id: string;
    amount_trx_id: string; // Not present in the provided data, so it's unclear. Can be removed or added later.
    partner_reference_no: string;
    referenceNo: string;
    status: 'success' | 'pending' | 'failed' | 'refunded'; // "PAID" would need to map to "success"
    transaction_date: string;
    paid_date: string | null;
    amount: number;
    currency: string; // Currency is empty, so you might want to make this optional or set a default.
    customer_name: string; // Not available in provided data.
    description: string; // Not available in provided data.
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

export interface TransactionTableProps {
    transactions: Transaction[];
    onSearch: (params: SearchParams) => Promise<void>;
    isLoading: boolean;
    itemsPerPage: number;
    currentPage: number;
}