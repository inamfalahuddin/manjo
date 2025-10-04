"use client";

import { BreadcrumbItem, Breadcrumbs, Button, Select, SelectItem, Spinner } from "@heroui/react";
import { ArrowLeft, Search, Calendar, User, DollarSign, Hash, CreditCard, Plus, Link, ArrowRight } from "lucide-react";
import { useState } from "react";
import crypto from 'crypto';
import { toast, ToastContainer } from 'react-toastify';  // Import toastify

export default function GeneratePage() {
    const [formData, setFormData] = useState({
        merchant_id: "",
        amount_trx_id: "",
        partner_reference_no: "",
        reference_no: "",
        status: "PENDING",
        transaction_date: "",
        paid_date: "",
        amount: "",
        currency: "IDR",
        customer_name: "",
        description: ""
    });

    const [isLoading, setIsLoading] = useState(false);
    const [qrResponse, setQrResponse] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [paymentRequest, setPaymentRequest] = useState<string>("");

    // Fungsi untuk generate HMAC SHA256 signature
    const generateSignature = async (data: string, secret: string): Promise<string> => {
        // Untuk environment browser, kita gunakan Web Crypto API
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const messageData = encoder.encode(data);

        const key = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        const signature = await crypto.subtle.sign('HMAC', key, messageData);
        // Convert signature to base64
        const signatureArray = Array.from(new Uint8Array(signature));
        const signatureBase64 = btoa(String.fromCharCode(...signatureArray));
        return signatureBase64;
    };

    // Alternatif menggunakan crypto-js (jika Web Crypto tidak tersedia)
    const generateSignatureAlt = async (data: string, secret: string): Promise<string> => {
        // Fallback menggunakan crypto-js jika diperlukan
        // Anda perlu install crypto-js: npm install crypto-js
        const CryptoJS = await import('crypto-js');
        const hash = CryptoJS.HmacSHA256(data, secret);
        return CryptoJS.enc.Base64.stringify(hash);
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validasi field yang diperlukan untuk generate QR
        if (!formData.merchant_id || !formData.amount || !formData.partner_reference_no) {
            alert('Harap isi Merchant ID, Amount, dan Partner Reference Number untuk generate QR');
            return;
        }

        setIsLoading(true);
        setError(null);
        setQrResponse(null);

        try {
            // Data yang akan dikirim ke API generate QR
            const qrRequestData = {
                partnerReferenceNo: formData.partner_reference_no,
                merchantId: formData.merchant_id,
                amount: {
                    value: formData.amount,
                    currency: formData.currency
                }
            };

            const paymentRequestData = {
                originalReferenceNo: formData.reference_no,
                originalPartnerReferenceNo: formData.partner_reference_no,
                transactionStatusDesc: 'Success',
                paidTime: formData.paid_date || new Date().toISOString(),
                amount: {
                    value: formData.amount,
                    currency: formData.currency
                }
            };

            const requestBody = JSON.stringify(qrRequestData);
            console.log('Mengirim data ke API:', qrRequestData);

            // Generate X-Signature
            const secretKey = "HalloHMACsha256";
            let signature: string;

            try {
                // Coba menggunakan Web Crypto API pertama
                signature = await generateSignature(requestBody, secretKey);
            } catch (webCryptoError) {
                console.warn('Web Crypto tidak tersedia, menggunakan fallback:', webCryptoError);
                try {
                    // Fallback ke crypto-js
                    signature = await generateSignatureAlt(requestBody, secretKey);
                } catch (cryptoJSError) {
                    console.error('Kedua metode signature gagal:', cryptoJSError);
                    throw new Error('Tidak dapat generate signature');
                }
            }

            console.log('Generated Signature:', signature);

            const response = await fetch('http://localhost:8000/api/v1/qr/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Signature': signature
                },
                body: requestBody
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();
            setQrResponse(data);
            setPaymentRequest(btoa(unescape(encodeURIComponent(JSON.stringify(paymentRequestData, null, 2)))));

            toast.success('QR Code berhasil digenerate!');

        } catch (error) {
            console.error('Error generating QR:', error);
            setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat generate QR');
            toast.error('Gagal generate QR code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({
            merchant_id: "",
            amount_trx_id: "",
            partner_reference_no: "",
            reference_no: "",
            status: "PENDING",
            transaction_date: "",
            paid_date: "",
            amount: "",
            currency: "IDR",
            customer_name: "",
            description: ""
        });
        setQrResponse(null);
        setError(null);
    };

    const generateReferenceNumber = () => {
        const refNo = `REF-${Date.now()}`;
        handleInputChange('reference_no', refNo);
    };

    const generatePartnerReference = () => {
        const partnerRef = `DIRECT-API-NMS-${Math.random().toString(36).substr(2, 9)}`;
        handleInputChange('partner_reference_no', partnerRef);
    };

    const formatCurrency = (amount: string, currency: string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0
        }).format(parseFloat(amount) || 0);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
            <ToastContainer />

            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-4">
                        <CreditCard className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                        Buat Transaksi Baru
                    </h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Gunakan form di bawah untuk membuat transaksi baru dan generate QR code pembayaran.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
                    <div className="flex flex-col flex-wrap gap-4">
                        <Breadcrumbs>
                            <BreadcrumbItem href="/">Home</BreadcrumbItem>
                            <BreadcrumbItem href="/transactions">Transaksi</BreadcrumbItem>
                            <BreadcrumbItem>Buat Transaksi Baru</BreadcrumbItem>
                        </Breadcrumbs>
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

                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            Form Transaksi Baru & Generate QR
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Informasi Merchant */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="merchant_id" className="block text-sm font-medium text-gray-700 mb-2">
                                    <User className="w-4 h-4 inline mr-1" />
                                    Merchant ID *
                                </label>
                                <input
                                    type="text"
                                    id="merchant_id"
                                    value={formData.merchant_id}
                                    onChange={(e) => handleInputChange('merchant_id', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="Contoh: EP27842148"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                                    <DollarSign className="w-4 h-4 inline mr-1" />
                                    Jumlah Transaksi *
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        id="amount"
                                        value={formData.amount}
                                        onChange={(e) => handleInputChange('amount', e.target.value)}
                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                    <select
                                        value={formData.currency}
                                        onChange={(e) => handleInputChange('currency', e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    >
                                        <option value="IDR">IDR</option>
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Nomor Referensi */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="reference_no" className="block text-sm font-medium text-gray-700 mb-2">
                                    <Hash className="w-4 h-4 inline mr-1" />
                                    Reference Number
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        id="reference_no"
                                        value={formData.reference_no}
                                        onChange={(e) => handleInputChange('reference_no', e.target.value)}
                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                        placeholder="Nomor referensi unik"
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="flat"
                                        onPress={generateReferenceNumber}
                                        className="whitespace-nowrap bg-black text-white py-5 rounded-lg"
                                    >
                                        Generate
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="partner_reference_no" className="block text-sm font-medium text-gray-700 mb-2">
                                    <Hash className="w-4 h-4 inline mr-1" />
                                    Partner Reference Number *
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        id="partner_reference_no"
                                        value={formData.partner_reference_no}
                                        onChange={(e) => handleInputChange('partner_reference_no', e.target.value)}
                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                        placeholder="Contoh: DIRECT-API-NMS-xxxxx"
                                        required
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="flat"
                                        onPress={generatePartnerReference}
                                        className="whitespace-nowrap bg-black text-white py-5 rounded-lg"
                                    >
                                        Generate
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Informasi Tambahan */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="amount_trx_id" className="block text-sm font-medium text-gray-700 mb-2">
                                    Amount Transaction ID
                                </label>
                                <input
                                    type="text"
                                    id="amount_trx_id"
                                    value={formData.amount_trx_id}
                                    onChange={(e) => handleInputChange('amount_trx_id', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="ID transaksi amount"
                                />
                            </div>

                            <div>
                                <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 mb-2">
                                    <User className="w-4 h-4 inline mr-1" />
                                    Nama Customer
                                </label>
                                <input
                                    type="text"
                                    id="customer_name"
                                    value={formData.customer_name}
                                    onChange={(e) => handleInputChange('customer_name', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="Nama customer"
                                />
                            </div>
                        </div>

                        {/* Status dan Tanggal */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                                    Status Transaksi
                                </label>
                                <select
                                    id="status"
                                    value={formData.status}
                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                >
                                    <option value="PENDING">Pending</option>
                                    <option value="PAID">Paid</option>
                                    <option value="FAILED">Failed</option>
                                    <option value="EXPIRED">Expired</option>
                                    <option value="REFUNDED">Refunded</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="transaction_date" className="block text-sm font-medium text-gray-700 mb-2">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    Tanggal Transaksi
                                </label>
                                <input
                                    type="datetime-local"
                                    id="transaction_date"
                                    value={formData.transaction_date}
                                    onChange={(e) => handleInputChange('transaction_date', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                />
                            </div>

                            <div>
                                <label htmlFor="paid_date" className="block text-sm font-medium text-gray-700 mb-2">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    Tanggal Pembayaran
                                </label>
                                <input
                                    type="datetime-local"
                                    id="paid_date"
                                    value={formData.paid_date}
                                    onChange={(e) => handleInputChange('paid_date', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                />
                            </div>
                        </div>

                        {/* Deskripsi */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                Deskripsi Transaksi
                            </label>
                            <textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                rows={3}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                placeholder="Deskripsi transaksi (opsional)"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6 border-t border-gray-200">
                            <Button
                                type="button"
                                color="default"
                                variant="light"
                                onPress={handleReset}
                                className="px-6 py-2 rounded-lg bg-gray-100 text-gray-800"
                            >
                                Reset Form
                            </Button>
                            <Button
                                type="submit"
                                color="primary"
                                className="px-8 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                                isLoading={isLoading}
                                startContent={!isLoading && <Plus className="w-4 h-4" />}
                            >
                                {isLoading ? 'Generating QR...' : 'Generate QR & Buat Transaksi'}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* QR Response */}
                {qrResponse && (
                    <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <CreditCard className="w-5 h-5" />
                                Response QR Code
                            </h3>
                            <Button
                                color="primary"
                                startContent={<ArrowRight className="w-4 h-4" />} // Ganti ikon Search dengan Payment
                                onPress={() => window.open('/payment/' + paymentRequest)}
                                isLoading={isLoading}
                                className="py-2 px-6 bg-gray-100 hover:bg-gray-200 rounded-lg"
                            >
                                Lihat Pembayaran
                            </Button>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                            <p className="text-green-700 font-medium">QR Code berhasil digenerate!</p>
                        </div>
                        <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                            {JSON.stringify(qrResponse, null, 2)}
                        </pre>
                    </div>
                )}

                {/* Preview Data Form */}
                <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-4xl mx-auto">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Preview Data Form</h3>
                    <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                        {JSON.stringify(formData, null, 2)}
                    </pre>
                </div>

                {/* Preview Data yang dikirim ke API */}
                <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-4xl mx-auto">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Data yang dikirim ke API</h3>
                    <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                        {JSON.stringify({
                            partnerReferenceNo: formData.partner_reference_no,
                            merchantId: formData.merchant_id,
                            amount: {
                                value: formData.amount,
                                currency: formData.currency
                            }
                        }, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
}