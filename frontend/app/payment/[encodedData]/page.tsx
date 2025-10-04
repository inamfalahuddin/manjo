'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, Button, Divider, Chip, Spinner } from '@heroui/react';
import { ArrowLeft, Download, Copy, CheckCircle, Clock, QrCode, DollarSign, Calendar, User, Hash, CreditCard, XCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import { generateSignature } from '@/lib/signature';

// Fungsi untuk decode Base64 URL-safe
const decodeFromBase64URL = (base64url: string): any => {
    try {
        let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        const jsonString = decodeURIComponent(escape(atob(base64)));
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Error decoding data:', error);
        return null;
    }
};

// Fallback mock data jika decoding gagal
const fallbackPaymentData = {
    originalReferenceNo: "A9609496941",
    originalPartnerReferenceNo: "DIRECT-API-NMS-whhq7gvx816",
    transactionStatusDesc: "Pending",
    paidTime: new Date().toISOString(),
    amount: {
        value: "0",
        currency: "IDR"
    },
    merchantInfo: {
        name: "Merchant Default",
        id: "MERCH-DEFAULT"
    },
    customerInfo: {
        name: "Customer",
        email: "customer@example.com"
    },
    additionalInfo: {
        qrContent: "",
        merchantId: "",
        customerName: ""
    }
};

export default function PaymentPage() {
    const params = useParams();
    const [paymentData, setPaymentData] = useState(fallbackPaymentData);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaying, setIsPaying] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [paymentResult, setPaymentResult] = useState<any>(null);

    useEffect(() => {
        const loadPaymentData = async () => {
            try {
                setIsLoading(true);

                // Ambil encoded data dari URL parameter
                const encodedData = params.encodedData as string;

                if (encodedData) {
                    console.log('Encoded data from URL:', encodedData);

                    // Decode data dari Base64 URL-safe
                    const decodedData = decodeFromBase64URL(encodedData);

                    if (decodedData) {
                        console.log('Decoded payment data:', decodedData);

                        // Format data untuk state
                        const formattedData = {
                            originalReferenceNo: decodedData.originalReferenceNo || fallbackPaymentData.originalReferenceNo,
                            originalPartnerReferenceNo: decodedData.originalPartnerReferenceNo || fallbackPaymentData.originalPartnerReferenceNo,
                            transactionStatusDesc: decodedData.transactionStatusDesc || fallbackPaymentData.transactionStatusDesc,
                            paidTime: decodedData.paidTime || fallbackPaymentData.paidTime,
                            amount: {
                                value: decodedData.amount?.value || fallbackPaymentData.amount.value,
                                currency: decodedData.amount?.currency || fallbackPaymentData.amount.currency
                            },
                            merchantInfo: {
                                name: decodedData.additionalInfo?.merchantId ? `Merchant ${decodedData.additionalInfo.merchantId}` : fallbackPaymentData.merchantInfo.name,
                                id: decodedData.additionalInfo?.merchantId || fallbackPaymentData.merchantInfo.id
                            },
                            customerInfo: {
                                name: decodedData.additionalInfo?.customerName || fallbackPaymentData.customerInfo.name,
                                email: fallbackPaymentData.customerInfo.email
                            },
                            additionalInfo: decodedData.additionalInfo || fallbackPaymentData.additionalInfo
                        };

                        setPaymentData(formattedData);

                        // Generate QR code dari data
                        if (decodedData.additionalInfo?.qrContent) {
                            // Jika ada qrContent langsung dari API, gunakan itu
                            setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(decodedData.additionalInfo.qrContent)}`);
                        } else {
                            // Fallback: generate dari data basic
                            const qrData = JSON.stringify({
                                referenceNo: formattedData.originalReferenceNo,
                                amount: formattedData.amount.value,
                                currency: formattedData.amount.currency,
                                merchantId: formattedData.merchantInfo.id
                            });
                            setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`);
                        }
                    } else {
                        setError('Gagal memproses data pembayaran');
                    }
                } else {
                    setError('Data pembayaran tidak ditemukan');
                }
            } catch (err) {
                console.error('Error loading payment data:', err);
                setError('Terjadi kesalahan saat memuat data pembayaran');
                setPaymentData(fallbackPaymentData);
            } finally {
                setIsLoading(false);
            }
        };

        loadPaymentData();
    }, [params.encodedData]);

    // Fungsi untuk proses pembayaran
    const handlePayment = async () => {
        setIsPaying(true);
        setPaymentResult(null);
        setError(null);

        try {
            // Siapkan data untuk dikirim ke API
            const paymentRequestData = {
                originalReferenceNo: paymentData.originalReferenceNo,
                originalPartnerReferenceNo: paymentData.originalPartnerReferenceNo,
                transactionStatusDesc: "Success", // Set status menjadi Pending
                paidTime: new Date().toISOString(), // Waktu sekarang
                amount: {
                    value: paymentData.amount.value,
                    currency: paymentData.amount.currency
                }
            };

            console.log('Mengirim data pembayaran ke API:', paymentRequestData);
            const requestBody = JSON.stringify(paymentRequestData);

            const secretKey: string = process.env.NEXT_PUBLIC_API_SECRET_KEY || ''
            let signature: string;

            try {
                signature = await generateSignature(requestBody, secretKey);
            } catch (sigError) {
                console.error('Error generating signature:', sigError);
                throw new Error('Gagal menghasilkan signature untuk otentikasi');
            }

            // Kirim request ke API
            const response = await fetch('http://localhost:8000/api/v1/qr/payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Signature': signature
                },
                body: JSON.stringify(paymentRequestData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const result = await response.json();
            setPaymentResult(result);

            console.log('Response dari API pembayaran:', result);

            // Update status pembayaran di local state
            setPaymentData(prev => ({
                ...prev,
                transactionStatusDesc: "Success",
                paidTime: paymentRequestData.paidTime
            }));

            toast.success('Pembayaran berhasil diproses!');

        } catch (err) {
            console.error('Error processing payment:', err);
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses pembayaran');
            toast.error('Gagal memproses pembayaran');
        } finally {
            setIsPaying(false);
        }
    };

    const handleCopyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleDownloadQR = () => {
        if (qrCodeUrl) {
            const link = document.createElement('a');
            link.href = qrCodeUrl;
            link.download = `qr-payment-${paymentData.originalReferenceNo}.png`;
            link.click();
        }
    };

    const formatCurrency = (value: string, currency: string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0
        }).format(parseFloat(value));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        if (isPaying || status.toLowerCase() === 'success') {
            return 'success';
        }
        return 'warning';
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Memuat data pembayaran...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !paymentData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="text-center">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                            <CheckCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
                            <p className="text-red-600 mb-4">{error}</p>
                            <Button
                                color="default"
                                onPress={() => window.history.back()}
                                className="mt-4"
                            >
                                Kembali
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
            <ToastContainer />

            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg mb-4">
                        <QrCode className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                        Pembayaran
                    </h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Selesaikan pembayaran Anda dengan memindai QR code di bawah
                    </p>
                </div>

                {/* Navigation */}
                <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>Home</span>
                        <span>/</span>
                        <span>Payment</span>
                        <span>/</span>
                        <span className="font-semibold text-gray-900">{paymentData.originalReferenceNo}</span>
                    </div>

                    <Button
                        color="default"
                        variant="light"
                        startContent={<ArrowLeft className="w-4 h-4" />}
                        onPress={() => window.history.back()}
                        className="py-2 px-6 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
                    >
                        Kembali
                    </Button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* QR Code Section */}
                    <div className="lg:col-span-1">
                        <Card className="shadow-lg border-0">
                            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-2">
                                <div className="flex items-center gap-2">
                                    <QrCode className="w-5 h-5" />
                                    <h2 className="text-lg font-semibold">QR Code Pembayaran</h2>
                                </div>
                            </CardHeader>
                            <CardBody className="p-6">
                                <div className="text-center space-y-4">
                                    {/* QR Code */}
                                    <div className="bg-white p-4 rounded-lg border-2 border-dashed border-green-200">
                                        <img
                                            src={qrCodeUrl}
                                            alt="QR Code Pembayaran"
                                            className="w-full max-w-[200px] mx-auto"
                                        />
                                    </div>

                                    {/* Status */}
                                    <div className="flex justify-center">
                                        <Chip
                                            color={
                                                isPaying || paymentData.transactionStatusDesc.toLowerCase() === 'success'
                                                    ? 'success'
                                                    : 'warning'
                                            }
                                            variant="flat"
                                            size="lg"
                                            className="font-semibold"
                                        >
                                            {isPaying || paymentData.transactionStatusDesc.toLowerCase() === 'success'
                                                ? 'Paid'
                                                : 'Pending'
                                            }
                                        </Chip>
                                    </div>

                                    {/* Amount */}
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600">Total Pembayaran</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {formatCurrency(paymentData.amount.value, paymentData.amount.currency)}
                                        </p>
                                    </div>

                                    {/* Tombol Bayar */}
                                    {/* Tombol Bayar */}
                                    <div className="pt-4 border-t border-gray-200">
                                        <Button
                                            color="primary"
                                            startContent={isPaying ? <Spinner size="sm" /> : <CreditCard className="w-4 h-4" />}
                                            onPress={handlePayment}
                                            isLoading={isPaying}
                                            isDisabled={isPaying || paymentData.transactionStatusDesc.toLowerCase() === 'success'}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg"
                                            size="lg"
                                        >
                                            {isPaying
                                                ? 'Memproses...'
                                                : paymentData.transactionStatusDesc.toLowerCase() === 'success'
                                                    ? 'Sudah Dibayar'
                                                    : 'Bayar Sekarang'
                                            }
                                        </Button>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {paymentData.transactionStatusDesc.toLowerCase() === 'success'
                                                ? 'Pembayaran telah berhasil diproses'
                                                : 'Klik tombol di atas untuk menyelesaikan pembayaran'
                                            }
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-2">
                                        <Button
                                            color="primary"
                                            variant="flat"
                                            startContent={<Download className="w-4 h-4" />}
                                            onPress={handleDownloadQR}
                                            className="w-full"
                                        >
                                            Download QR Code
                                        </Button>
                                        <Button
                                            variant="flat"
                                            startContent={<Copy className="w-4 h-4" />}
                                            onPress={() => handleCopyToClipboard(qrCodeUrl, 'qrCode')}
                                        >
                                            {copiedField === 'qrCode' ? 'URL Disalin!' : 'Salin URL QR'}
                                        </Button>
                                    </div>

                                    {/* Instructions */}
                                    <div className="text-xs text-gray-500 text-center">
                                        <p>Pindai QR code dengan aplikasi e-wallet atau mobile banking Anda</p>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    {/* Payment Details Section */}
                    <div className="lg:col-span-2">
                        <Card className="shadow-lg border-0">
                            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-2">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    <h2 className="text-lg font-semibold">Detail Transaksi</h2>
                                </div>
                            </CardHeader>
                            <CardBody className="p-6 space-y-6">
                                {/* Payment Status */}
                                <div className={`border rounded-lg p-4 ${isPaying || paymentData.transactionStatusDesc.toLowerCase() === 'success'
                                    ? 'bg-green-50 border-green-200'  // Warna hijau jika paid/success
                                    : 'bg-yellow-50 border-yellow-200'  // Warna kuning jika pending
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        {/* Icon berdasarkan status */}
                                        {isPaying || paymentData.transactionStatusDesc.toLowerCase() === 'success' ? (
                                            <CheckCircle className="w-6 h-6 text-green-600" />
                                        ) : (
                                            <Clock className="w-6 h-6 text-yellow-600" />
                                        )}

                                        <div>
                                            <h3 className={`font-semibold ${isPaying || paymentData.transactionStatusDesc.toLowerCase() === 'success'
                                                ? 'text-green-800'  // Teks hijau jika paid/success
                                                : 'text-yellow-800'  // Teks kuning jika pending
                                                }`}>
                                                {isPaying || paymentData.transactionStatusDesc.toLowerCase() === 'success'
                                                    ? 'Pembayaran Berhasil'  // Teks sukses
                                                    : 'Menunggu Pembayaran'  // Teks pending
                                                }
                                            </h3>

                                            <p className={`text-sm ${isPaying || paymentData.transactionStatusDesc.toLowerCase() === 'success'
                                                ? 'text-green-600'  // Teks hijau jika paid/success
                                                : 'text-yellow-600'  // Teks kuning jika pending
                                                }`}>
                                                {isPaying || paymentData.transactionStatusDesc.toLowerCase() === 'success'
                                                    ? `Transaksi Anda telah berhasil diproses pada ${formatDate(paymentData.paidTime)}`
                                                    : `Menunggu pembayaran - dibuat pada ${formatDate(paymentData.paidTime)}`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Result */}
                                {paymentResult && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-blue-800 mb-2">Hasil Pembayaran</h4>
                                        <pre className="text-sm overflow-x-auto bg-white p-3 rounded border">
                                            {JSON.stringify(paymentResult, null, 2)}
                                        </pre>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Transaction Information */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                            <Hash className="w-4 h-4" />
                                            Informasi Transaksi
                                        </h3>

                                        <div className="space-y-3">
                                            <div className="">
                                                <span className="text-sm text-gray-600">Reference Number:</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-sm">{paymentData.originalReferenceNo}</span>
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        onPress={() => handleCopyToClipboard(paymentData.originalReferenceNo, 'referenceNo')}
                                                    >
                                                        {copiedField === 'referenceNo' ? (
                                                            <CheckCircle className="w-3 h-3 text-green-600" />
                                                        ) : (
                                                            <Copy className="w-3 h-3" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>

                                            <div>
                                                <span className="text-sm text-gray-600">Partner Reference:</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-sm">{paymentData.originalPartnerReferenceNo}</span>
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        onPress={() => handleCopyToClipboard(paymentData.originalPartnerReferenceNo, 'partnerRef')}
                                                    >
                                                        {copiedField === 'partnerRef' ? (
                                                            <CheckCircle className="w-3 h-3 text-green-600" />
                                                        ) : (
                                                            <Copy className="w-3 h-3" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>

                                            <div>
                                                <span className="text-sm text-gray-600">Status:</span> <br />
                                                <Chip
                                                    color={
                                                        isPaying || paymentData.transactionStatusDesc.toLowerCase() === 'success'
                                                            ? 'success'
                                                            : 'warning'
                                                    }
                                                    variant="flat"
                                                    size="sm"
                                                    className="font-semibold mt-1"
                                                >
                                                    {isPaying || paymentData.transactionStatusDesc.toLowerCase() === 'success'
                                                        ? 'Paid'
                                                        : 'Pending'
                                                    }
                                                </Chip>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Amount Information */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                            <DollarSign className="w-4 h-4" />
                                            Informasi Pembayaran
                                        </h3>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Jumlah:</span>
                                                <span className="font-semibold text-green-600">
                                                    {formatCurrency(paymentData.amount.value, paymentData.amount.currency)}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Mata Uang:</span>
                                                <span className="font-semibold">{paymentData.amount.currency}</span>
                                            </div>

                                            <div >
                                                <span className="text-sm text-gray-600">Waktu:</span> <br />
                                                <span className="text-sm">{formatDate(paymentData.paidTime)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Divider />

                                {/* Merchant & Customer Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Merchant Information */}
                                    <div className="space-y-3">
                                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            Informasi Merchant
                                        </h3>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Nama:</span>
                                                <span className="text-sm font-medium">{paymentData.merchantInfo.name}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">ID Merchant:</span>
                                                <span className="text-sm font-mono">{paymentData.merchantInfo.id}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customer Information */}
                                    <div className="space-y-3">
                                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            Informasi Customer
                                        </h3>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Nama:</span>
                                                <span className="text-sm font-medium">{paymentData.customerInfo.name}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Email:</span>
                                                <span className="text-sm">{paymentData.customerInfo.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Info jika ada */}
                                {paymentData.additionalInfo && (
                                    <>
                                        <Divider />
                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-gray-800">Informasi Tambahan</h3>
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <pre className="text-sm overflow-x-auto">
                                                    {JSON.stringify(paymentData.additionalInfo, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardBody>
                        </Card>

                        {/* Raw Data Preview */}
                        <Card className="shadow-lg border-0 mt-6">
                            <CardHeader className="bg-gradient-to-r from-gray-500 to-gray-700 text-white">
                                <h2 className="text-lg font-semibold">Preview Data JSON</h2>
                            </CardHeader>
                            <CardBody className="p-6">
                                <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto max-h-60 overflow-y-auto">
                                    {JSON.stringify(paymentData, null, 2)}
                                </pre>
                                <Button
                                    variant="flat"
                                    startContent={<Copy className="w-4 h-4" />}
                                    onPress={() => handleCopyToClipboard(JSON.stringify(paymentData, null, 2), 'jsonData')}
                                    className="mt-3"
                                >
                                    {copiedField === 'jsonData' ? 'JSON Disalin!' : 'Salin JSON Data'}
                                </Button>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}