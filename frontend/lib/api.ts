import { Transaction, SearchParams } from '@/types';

// Mock data untuk simulasi
const mockTransactions: Transaction[] = [
    {
        id: '1',
        merchant_id: 'MER001',
        amount_trx_id: 'AMT001',
        partner_reference_number: 'PART001',
        reference_number: 'REF001',
        status: 'success',
        transaction_date: '2024-01-15T10:30:00Z',
        paid_date: '2024-01-15T10:31:00Z',
        amount: 1500000,
        currency: 'IDR',
        customer_name: 'John Doe',
        description: 'Product Purchase'
    },
    {
        id: '2',
        merchant_id: 'MER002',
        amount_trx_id: 'AMT002',
        partner_reference_number: 'PART002',
        reference_number: 'REF002',
        status: 'pending',
        transaction_date: '2024-01-15T11:00:00Z',
        paid_date: null,
        amount: 750000,
        currency: 'IDR',
        customer_name: 'Jane Smith',
        description: 'Service Payment'
    }
];

export class MerchantAPI {
    static async searchTransactions(params: SearchParams): Promise<Transaction[]> {
        // Simulasi delay network
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Filter data berdasarkan parameter
        let filtered = mockTransactions;

        if (params.merchant_id) {
            filtered = filtered.filter(t =>
                t.merchant_id.toLowerCase().includes(params.merchant_id!.toLowerCase())
            );
        }

        if (params.reference_number) {
            filtered = filtered.filter(t =>
                t.reference_number.toLowerCase().includes(params.reference_number!.toLowerCase())
            );
        }

        if (params.status) {
            filtered = filtered.filter(t => t.status === params.status);
        }

        // Simulasi error untuk testing
        if (params.merchant_id === 'error') {
            throw new Error('Network error');
        }

        // Simulasi not found
        if (params.merchant_id === 'NOTFOUND123') {
            return [];
        }

        return filtered;
    }

    static async getTransactionById(id: string): Promise<Transaction | null> {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return mockTransactions.find(t => t.id === id) || null;
    }
}