import { Transaction } from "@/types";

const dummyTransactions: Transaction[] = [
    {
        id: '1',
        reference_number: 'TRX123456789',
        partner_reference_number: 'PARTNER123456',
        merchant_id: 'MERCHANT001',
        amount_trx_id: 'AMOUNT123',
        customer_name: 'John Doe',
        description: 'Pembelian produk A',
        amount: 150000,
        currency: 'IDR',
        status: 'success', // Gagal, Pending, Success, Refunded
        transaction_date: '2023-10-01T10:30:00Z',
        paid_date: '2023-10-01T11:00:00Z',
    },
    {
        id: '2',
        reference_number: 'TRX987654321',
        partner_reference_number: 'PARTNER987654',
        merchant_id: 'MERCHANT002',
        amount_trx_id: 'AMOUNT456',
        customer_name: 'Jane Smith',
        description: 'Pembelian produk B',
        amount: 200000,
        currency: 'IDR',
        status: 'pending', // Gagal, Pending, Success, Refunded
        transaction_date: '2023-10-02T12:00:00Z',
        paid_date: null,
    },
];

export default dummyTransactions;