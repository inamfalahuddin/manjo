import { Transaction } from '@/types';
import { CheckCircle, Clock, XCircle, RefreshCw, Calendar, User, DollarSign } from 'lucide-react';
import { Chip } from '@heroui/react';

interface TransactionCardProps {
    transaction: Transaction;
}

const statusConfig = {
    success: {
        icon: CheckCircle,
        color: 'success' as const,
        text: 'Berhasil'
    },
    pending: {
        icon: Clock,
        color: 'warning' as const,
        text: 'Pending'
    },
    failed: {
        icon: XCircle,
        color: 'danger' as const,
        text: 'Gagal'
    },
    refunded: {
        icon: RefreshCw,
        color: 'default' as const,
        text: 'Refunded'
    }
};

export default function TransactionCard({ transaction }: TransactionCardProps) {
    const StatusIcon = statusConfig[transaction.status].icon;
    const statusColor = statusConfig[transaction.status].color;
    const statusText = statusConfig[transaction.status].text;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                        {transaction.reference_number}
                    </h3>
                    <p className="text-sm text-gray-500">{transaction.description}</p>
                </div>
                <Chip
                    color={statusColor}
                    variant="flat"
                    startContent={<StatusIcon className="w-4 h-4" />}
                >
                    {statusText}
                </Chip>
            </div>

            {/* Transaction Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Customer:</span>
                        <span className="font-medium">{transaction.customer_name}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-medium text-green-600">
                            {formatCurrency(transaction.amount, transaction.currency)}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Merchant ID:</span>
                        <span className="font-medium">{transaction.merchant_id}</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="text-sm">
                        <span className="text-gray-600">Partner Ref:</span>
                        <span className="font-medium ml-2">{transaction.partner_reference_number}</span>
                    </div>

                    <div className="text-sm">
                        <span className="text-gray-600">Amount TRX ID:</span>
                        <span className="font-medium ml-2">{transaction.amount_trx_id}</span>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                        <span className="text-gray-600">Transaction Date:</span>
                        <p className="font-medium">{formatDate(transaction.transaction_date)}</p>
                    </div>
                    {transaction.paid_date && (
                        <div>
                            <span className="text-gray-600">Paid Date:</span>
                            <p className="font-medium text-green-600">
                                {formatDate(transaction.paid_date)}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}