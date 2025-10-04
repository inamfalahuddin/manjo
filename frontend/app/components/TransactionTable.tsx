'use client';

import { useState, useEffect } from 'react';
import { Transaction, TransactionTableProps } from '@/types';
import { CheckCircle, Clock, XCircle, RefreshCw, Eye, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Chip, Tooltip, Button, Select, SelectItem } from '@heroui/react';

const statusConfig = {
    paid: {
        icon: CheckCircle,
        color: 'success' as const,
        text: 'Paid',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-200'
    },
    success: {
        icon: CheckCircle,
        color: 'success' as const,
        text: 'Success',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-200'
    },
    pending: {
        icon: Clock,
        color: 'warning' as const,
        text: 'Pending',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-200'
    },
    failed: {
        icon: XCircle,
        color: 'danger' as const,
        text: 'Failed',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        borderColor: 'border-red-200'
    },
    expired: {
        icon: AlertCircle,
        color: 'default' as const,
        text: 'Expired',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-200'
    },
    refunded: {
        icon: RefreshCw,
        color: 'info' as const,
        text: 'Refunded',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200'
    }
};

export default function TransactionTable({
    transactions,
    currentPage = 1,
    itemsPerPage = 10,
    onPageChange,
    onItemsPerPageChange
}: TransactionTableProps & {
    currentPage?: number;
    itemsPerPage?: number;
    onPageChange?: (page: number) => void;
    onItemsPerPageChange?: (limit: number) => void;
}) {
    const [localCurrentPage, setLocalCurrentPage] = useState(currentPage);
    const [localItemsPerPage, setLocalItemsPerPage] = useState(itemsPerPage);
    const [newRows, setNewRows] = useState<Set<string>>(new Set());

    // Sync dengan props dari parent
    useEffect(() => {
        setLocalCurrentPage(currentPage);
    }, [currentPage]);

    useEffect(() => {
        setLocalItemsPerPage(itemsPerPage);
    }, [itemsPerPage]);

    // Effect untuk menandai row baru
    useEffect(() => {
        if (transactions.length > 0) {
            const latestTransaction = transactions[0];
            if (latestTransaction?.referenceNo) {
                setNewRows(prev => new Set(prev).add(latestTransaction.referenceNo));

                // Hapus highlight setelah 3 detik
                const timer = setTimeout(() => {
                    setNewRows(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(latestTransaction.referenceNo);
                        return newSet;
                    });
                }, 3000);

                return () => clearTimeout(timer);
            }
        }
    }, [transactions]);

    // Hitung pagination
    const totalItems = transactions.length;
    const totalPages = Math.ceil(totalItems / localItemsPerPage);
    const startIndex = (localCurrentPage - 1) * localItemsPerPage;
    const endIndex = Math.min(startIndex + localItemsPerPage, totalItems);
    const currentItems = transactions.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setLocalCurrentPage(page);
        onPageChange?.(page);
    };

    const handleItemsPerPageChange = (limit: number) => {
        setLocalItemsPerPage(limit);
        setLocalCurrentPage(1); // Reset ke halaman pertama
        onItemsPerPageChange?.(limit);
    };

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

    const StatusBadge = ({ status }: { status: string }) => {
        const normalizedStatus = status.toLowerCase() as keyof typeof statusConfig;
        const config = statusConfig[normalizedStatus] || statusConfig.expired;
        const Icon = config.icon;

        return (
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bgColor} ${config.textColor} text-xs font-medium`}>
                <Icon className="w-3 h-3" />
                {config.text}
            </div>
        );
    };

    const Pagination = () => {
        const maxVisiblePages = 5;
        let startPage = Math.max(1, localCurrentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        const pages = [];
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 bg-gray-50">
                {/* Items per page selector */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Items per page:</span>
                    <select
                        value={localItemsPerPage}
                        onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </div>

                {/* Page info */}
                <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {endIndex} of {totalItems} entries
                </div>

                {/* Pagination controls */}
                <div className="flex items-center gap-1">
                    {/* Previous button */}
                    <button
                        onClick={() => handlePageChange(localCurrentPage - 1)}
                        disabled={localCurrentPage === 1}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                    </button>

                    {/* Page numbers */}
                    {startPage > 1 && (
                        <>
                            <button
                                onClick={() => handlePageChange(1)}
                                className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                1
                            </button>
                            {startPage > 2 && <span className="px-2 text-gray-400">...</span>}
                        </>
                    )}

                    {pages.map(page => (
                        <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1.5 text-sm font-medium border rounded-lg transition-colors ${page === localCurrentPage
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            {page}
                        </button>
                    ))}

                    {endPage < totalPages && (
                        <>
                            {endPage < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
                            <button
                                onClick={() => handlePageChange(totalPages)}
                                className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                {totalPages}
                            </button>
                        </>
                    )}

                    {/* Next button */}
                    <button
                        onClick={() => handlePageChange(localCurrentPage + 1)}
                        disabled={localCurrentPage === totalPages}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
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
                                No.
                            </th>
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
                        {currentItems.map((transaction, index) => {
                            const isNewRow = newRows.has(transaction.referenceNo);
                            const rowNumber = startIndex + index + 1;

                            return (
                                <tr
                                    key={transaction.trx_id}
                                    data-reference={transaction.referenceNo}
                                    className={`
                                        hover:bg-gray-50 transition-all duration-300
                                        ${isNewRow ? 'new-row-highlight' : ''}
                                    `}
                                >
                                    {/* Row Number */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {rowNumber}.
                                    </td>

                                    {/* Reference Number */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {transaction.referenceNo}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {transaction.partner_reference_no}
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
                                            {transaction.trx_id}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate max-w-[120px]">
                                            {transaction.description}
                                        </div>
                                    </td>

                                    {/* Amount */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-900">
                                            {formatCurrency(transaction.amount, transaction.currency || 'IDR')}
                                        </div>
                                    </td>

                                    {/* Status */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={transaction.status || 'pending'} />
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
                            );
                        })}
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

            {/* Pagination */}
            {transactions.length > 0 && <Pagination />}
        </div>
    );
}