'use client';

import { useState, useEffect } from 'react';
import { Transaction, SearchParams } from '@/types';
import { MerchantAPI } from '@/lib/api';
import TransactionTable from './TransactionTable';
import LoadingSpinner from './LoadingSpinner';
import { Alert, Button } from '@heroui/react';
import { Search, RefreshCw } from 'lucide-react';
import dummyTransactions from '@/app/data/dummyTransaction';

export default function MerchantTracker() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    // Load dummy data on component mount
    useEffect(() => {
        // Simulate initial data load
        setTransactions(dummyTransactions);
    }, []);

    const handleSearch = async (params: SearchParams) => {
        setIsLoading(true);
        setError(null);
        setHasSearched(true);

        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // For demo purposes, filter transactions based on search params
            let filteredTransactions = [...dummyTransactions];

            // Filter by reference number if provided
            if (params.reference_number) {
                filteredTransactions = filteredTransactions.filter(tx =>
                    tx.reference_number.toLowerCase().includes(params.reference_number!.toLowerCase())
                );
            }

            // Filter by status if provided
            if (params.status && params.status !== 'all') {
                filteredTransactions = filteredTransactions.filter(tx =>
                    tx.status === params.status
                );
            }

            // Filter by date range if provided
            if (params.start_date && params.end_date) {
                filteredTransactions = filteredTransactions.filter(tx => {
                    const txDate = new Date(tx.transaction_date);
                    const startDate = new Date(params.start_date!);
                    const endDate = new Date(params.end_date!);
                    return txDate >= startDate && txDate <= endDate;
                });
            }

            setTransactions(filteredTransactions);

            // Show message if no results found
            if (filteredTransactions.length === 0) {
                setError('Tidak ada transaksi yang ditemukan dengan kriteria pencarian tersebut');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
            setTransactions([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRetry = () => {
        if (transactions.length === 0 && hasSearched) {
            handleSearch({});
        }
    };

    const handleReset = () => {
        setTransactions(dummyTransactions);
        setError(null);
        setHasSearched(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-4">
                        <Search className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                        Merchant Status Tracker
                    </h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Lacak status transaksi merchant Anda secara real-time
                    </p>

                    {/* Demo Notice */}
                    <div className="mt-4">
                        {/* <Alert
                            color="warning"
                            variant="flat"
                            description="Sedang menggunakan data dummy untuk demonstrasi"
                            className="max-w-md mx-auto bg-gray-100 text-gray-500 rounded-lg"
                        /> */}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4 mb-6">
                    <Button
                        color="primary"
                        startContent={<Search className="w-4 h-4" />}
                        onPress={() => handleSearch({})}
                        isLoading={isLoading}
                        className="py-2 px-6 bg-gray-100 hover:bg-gray-200 rounded-lg"
                    >
                        Muat Semua Transaksi
                    </Button>

                    <Button
                        color="default"
                        variant="flat"
                        startContent={<RefreshCw className="w-4 h-4" />}
                        onPress={handleReset}
                        className="py-2 px-6 bg-gray-100 hover:bg-gray-200 rounded-lg"
                    >
                        Reset
                    </Button>
                </div>

                {/* Error Display */}
                {error && (
                    <>
                        <Alert
                            color="danger"
                            variant="flat"
                            title="Error"
                            description={error}
                            className="mb-6 max-w-4xl mx-auto"
                        />
                        <div className="flex justify-center mb-6">
                            <Button color="default" variant="light" onPress={handleRetry}>
                                Coba Lagi
                            </Button>
                        </div>
                    </>
                )}

                {/* Loading Spinner */}
                {isLoading && (
                    <div className="flex justify-center my-8">
                        <LoadingSpinner />
                    </div>
                )}

                {/* Content */}
                <div className="space-y-6">
                    {!isLoading && (
                        <>
                            <div className="text-center text-sm text-gray-500">
                                Menampilkan {transactions.length} transaksi
                            </div>
                            <TransactionTable
                                transactions={transactions}
                                onSearch={handleSearch}
                                isLoading={isLoading}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}