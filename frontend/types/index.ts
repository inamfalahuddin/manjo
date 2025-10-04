export interface Transaction {
    id: string;
    merchant_id: string;
    amount_trx_id: string;
    partner_reference_number: string;
    reference_number: string;
    status: 'success' | 'pending' | 'failed' | 'refunded';
    transaction_date: string;
    paid_date: string | null;
    amount: number;
    currency: string;
    customer_name: string;
    description: string;
}

export interface SearchParams {
    merchant_id?: string;
    amount_trx_id?: string;
    partner_reference_number?: string;
    reference_number?: string;
    status?: string;
    transaction_date?: string;
    paid_date?: string;
    start_date?: string;
    end_date?: string;
}

export interface TransactionTableProps {
    transactions: Transaction[];
    onSearch?: (params: SearchParams) => void; // Tambahkan ini
    isLoading?: boolean; // Tambahkan ini juga jika diperlukan
}