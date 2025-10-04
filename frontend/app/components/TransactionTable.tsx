'use client';

import { Transaction, TransactionTableProps } from '@/types';
import { CheckCircle, Clock, XCircle, RefreshCw, Eye } from 'lucide-react';
import { Chip, Tooltip, Button, Select, SelectItem } from '@heroui/react';

const statusConfig = {
    success: {
        icon: CheckCircle,
        color: 'success' as const,
        text: 'Berhasil',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700'
    },
    pending: {
        icon: Clock,
        color: 'warning' as const,
        text: 'Pending',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700'
    },
    failed: {
        icon: XCircle,
        color: 'danger' as const,
        text: 'Gagal',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700'
    },
    refunded: {
        icon: RefreshCw,
        color: 'default' as const,
        text: 'Refunded',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-700'
    }
};

export default function TransactionTable({ transactions }: TransactionTableProps) {
    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const StatusBadge = ({ status }: { status: Transaction['status'] }) => {
        const config = statusConfig[status];
        const Icon = config.icon;

        return (
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bgColor} ${config.textColor} text-xs font-medium`}>
                <Icon className="w-3 h-3" />
                {config.text}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                        Daftar Transaksi
                    </h3>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[200px]">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Cari nomor referensi..."
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                            // Tambahkan onChange handler sesuai kebutuhan
                            />
                        </div>

                        {/* Status Dropdown */}
                        <div className="w-full sm:w-[180px]">
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                                // Tambahkan onChange handler sesuai kebutuhan
                                defaultValue=""
                            >
                                <option value="">Semua Status</option>
                                <option value="success">Success</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
                                <option value="refunded">Refunded</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Reference
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Merchant
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Customer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Transaction Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map((transaction) => (
                            <tr
                                key={transaction.id}
                                className="hover:bg-gray-50 transition-colors duration-150"
                            >
                                {/* Reference Number */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {transaction.reference_number}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {transaction.partner_reference_number}
                                        </div>
                                    </div>
                                </td>

                                {/* Merchant Info */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {transaction.merchant_id}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {transaction.amount_trx_id}
                                        </div>
                                    </div>
                                </td>

                                {/* Customer */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {transaction.customer_name}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate max-w-[120px]">
                                        {transaction.description}
                                    </div>
                                </td>

                                {/* Amount */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-semibold text-gray-900">
                                        {formatCurrency(transaction.amount, transaction.currency)}
                                    </div>
                                </td>

                                {/* Status */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <StatusBadge status={transaction.status} />
                                </td>

                                {/* Transaction Date */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {formatDate(transaction.transaction_date)}
                                    </div>
                                    {transaction.paid_date && (
                                        <div className="text-xs text-green-600">
                                            Paid: {formatDate(transaction.paid_date)}
                                        </div>
                                    )}
                                </td>

                                {/* Actions */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <Tooltip content="Lihat detail">
                                        <Button
                                            isIconOnly
                                            variant="light"
                                            size="sm"
                                            className="text-gray-400 hover:text-blue-600"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </Tooltip>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Empty State */}
            {transactions.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <RefreshCw className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                        Tidak ada transaksi
                    </h4>
                    <p className="text-gray-500 max-w-sm mx-auto">
                        Tidak ada transaksi yang sesuai dengan kriteria pencarian Anda.
                    </p>
                </div>
            )}
        </div>
    );
}