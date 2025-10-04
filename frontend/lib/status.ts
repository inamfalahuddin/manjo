import { stat } from "fs";
import { AlertCircle, CheckCircle, Clock, RefreshCw, XCircle } from "lucide-react";

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

export default statusConfig;