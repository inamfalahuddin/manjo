'use client';

import { useState, useEffect, useRef } from 'react';
import { Transaction, SearchParams } from '@/types';
import TransactionTable from './TransactionTable';
import LoadingSpinner from './LoadingSpinner';
import { Alert, Button } from '@heroui/react';
import { Search, RefreshCw, Wifi, WifiOff, Bell, Volume2 } from 'lucide-react';
import { ApiResponse } from '@/types/api';
import { useWebSocket } from '@/hooks/useWebSocket';

// Interface untuk WebSocket message berdasarkan struktur yang benar
interface WebSocketMessage {
    type: string;
    amount: number;
    currency: string;
    id: number;
    merchant_id: string;
    paid_date: string | null;
    partner_reference_no: string;
    reference_no: string;
    status: string;
    timestamp: number;
    transaction_date: string;
    trx_id: string;
    updated_at: string;
}

// Extended Transaction interface dengan nomor urut
interface TransactionWithNumber extends Transaction {
    rowNumber: number;
}

export default function MerchantTracker() {
    const [transactions, setTransactions] = useState<TransactionWithNumber[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [audioUnlocked, setAudioUnlocked] = useState(false); // Track jika audio sudah di-unlock

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPage: 1
    });

    // Ref untuk audio element
    const notificationSoundRef = useRef<HTMLAudioElement | null>(null);

    // TAMBAHKAN: State untuk search dan filter
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    // Gunakan custom hook untuk WebSocket
    const { isConnected, notification, reconnectWebSocket, ws } = useWebSocket();

    // Inisialisasi audio ketika component mount
    useEffect(() => {
        // Hanya jalankan di client side
        if (typeof window !== 'undefined') {
            notificationSoundRef.current = new Audio('/notifications/sound-notification.mp3');
            notificationSoundRef.current.volume = 0.7; // Set volume (0.0 - 1.0)

            // Preload audio
            notificationSoundRef.current.load();
            console.log('🔊 Notification sound initialized');
        }

        return () => {
            // Cleanup
            if (notificationSoundRef.current) {
                notificationSoundRef.current.pause();
                notificationSoundRef.current = null;
            }
        };
    }, []);

    // Fungsi untuk unlock audio dengan user interaction
    const unlockAudio = async () => {
        if (!notificationSoundRef.current) return;

        try {
            // Coba play dan langsung pause untuk unlock
            await notificationSoundRef.current.play();
            notificationSoundRef.current.pause();
            notificationSoundRef.current.currentTime = 0;

            setAudioUnlocked(true);
            console.log('🔊 Audio unlocked successfully');
        } catch (error) {
            console.error('❌ Error unlocking audio:', error);
        }
    };

    // Fungsi untuk memutar suara notifikasi
    const playNotificationSound = async () => {
        if (!notificationSoundRef.current || !audioUnlocked) {
            console.log('🔊 Audio not ready or not unlocked yet');
            return;
        }

        try {
            // Reset audio ke awal
            notificationSoundRef.current.currentTime = 0;

            // Play audio
            await notificationSoundRef.current.play();
            console.log('🔊 Notification sound played');
        } catch (error) {
            console.error('❌ Error playing notification sound:', error);
            // Reset unlocked status jika error
            setAudioUnlocked(false);
        }
    };

    // Auto-unlock audio ketika ada user interaction dengan halaman
    useEffect(() => {
        const handleUserInteraction = () => {
            if (!audioUnlocked) {
                unlockAudio();
            }
        };

        // Tambahkan event listeners untuk berbagai jenis user interaction
        document.addEventListener('click', handleUserInteraction);
        document.addEventListener('keydown', handleUserInteraction);
        document.addEventListener('scroll', handleUserInteraction);

        return () => {
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('keydown', handleUserInteraction);
            document.removeEventListener('scroll', handleUserInteraction);
        };
    }, [audioUnlocked]);

    // Fungsi untuk menambahkan nomor urut berdasarkan halaman
    const addRowNumbers = (transactions: Transaction[], page: number, limit: number): TransactionWithNumber[] => {
        const startNumber = (page - 1) * limit + 1;
        return transactions.map((transaction, index) => ({
            ...transaction,
            rowNumber: startNumber + index
        }));
    };

    // Handler untuk WebSocket messages dengan error handling yang lebih baik
    useEffect(() => {
        if (!ws) {
            console.log('WebSocket not available');
            return;
        }

        const handleMessage = (event: MessageEvent) => {
            try {
                console.log('📨 Raw WebSocket message received:', event.data);
                const message: WebSocketMessage = JSON.parse(event.data);
                console.log('📨 Parsed WebSocket message:', message);

                // MAIN UPDATE: SELALU putar suara notifikasi ketika ada message
                playNotificationSound();

                handleWebSocketMessage(message);
            } catch (err) {
                console.error('❌ Error parsing WebSocket message:', err);
            }
        };

        // Tambahkan error handling untuk event listener
        try {
            ws.addEventListener('message', handleMessage);
            console.log('✅ WebSocket message listener added');
        } catch (err) {
            console.error('❌ Error adding WebSocket message listener:', err);
        }

        return () => {
            if (ws) {
                try {
                    ws.removeEventListener('message', handleMessage);
                    console.log('🧹 WebSocket message listener removed');
                } catch (err) {
                    console.error('❌ Error removing WebSocket message listener:', err);
                }
            }
        };
    }, [ws, audioUnlocked]);

    const handleWebSocketMessage = (message: WebSocketMessage) => {
        console.log('🔄 Handling WebSocket message type:', message.type);
        console.log('🔍 Message content:', {
            type: message.type,
            reference_no: message.reference_no,
            status: message.status,
            amount: message.amount
        });

        switch (message.type) {
            case 'TRANSACTION_UPDATE':
                handleTransactionUpdate(message);
                break;
            default:
                console.log('Unknown message type:', message.type);
        }
    };

    const handleTransactionUpdate = (transactionData: WebSocketMessage) => {
        console.log('🔄 Processing transaction update:', transactionData);

        // Validasi data yang diterima
        if (!transactionData) {
            console.error('❌ Transaction data is undefined or null');
            return;
        }

        // Gunakan reference_no dari data (sesuai struktur yang benar)
        const referenceNo = transactionData.reference_no;

        if (!referenceNo) {
            console.error('❌ No reference number found in update:', transactionData);
            return;
        }

        console.log('✅ Reference number found:', referenceNo);
        console.log('✅ Transaction status:', transactionData.status);
        console.log('✅ Transaction amount:', transactionData.amount);

        setTransactions(prevTransactions => {
            const existingIndex = prevTransactions.findIndex(
                transaction => transaction.referenceNo === referenceNo
            );

            console.log('🔍 Existing transaction index:', existingIndex);

            let newTransactions: TransactionWithNumber[];

            if (existingIndex >= 0) {
                // Update existing transaction
                newTransactions = [...prevTransactions];
                newTransactions[existingIndex] = {
                    ...newTransactions[existingIndex],
                    amount: transactionData.amount,
                    currency: transactionData.currency,
                    status: transactionData.status,
                    paid_date: transactionData.paid_date,
                    updated_at: transactionData.updated_at,
                    referenceNo: referenceNo,
                    rowNumber: newTransactions[existingIndex].rowNumber
                };
                console.log('✅ Updated existing transaction:', referenceNo);
            } else {
                // Add new transaction at the beginning
                const newTransaction: TransactionWithNumber = {
                    id: transactionData.trx_id,
                    trx_id: transactionData.trx_id,
                    merchant_id: transactionData.merchant_id,
                    amount_trx_id: "",
                    partner_reference_no: transactionData.partner_reference_no,
                    referenceNo: referenceNo,
                    status: transactionData.status,
                    transaction_date: transactionData.transaction_date,
                    paid_date: transactionData.paid_date,
                    amount: transactionData.amount,
                    currency: transactionData.currency,
                    customer_name: "",
                    description: "",
                    updated_at: transactionData.updated_at,
                    rowNumber: 1
                };
                newTransactions = [newTransaction, ...prevTransactions];
                console.log('✅ Added new transaction:', referenceNo);
            }

            // Update nomor urut untuk semua transaksi
            const renumberedTransactions = newTransactions.map((transaction, index) => ({
                ...transaction,
                rowNumber: index + 1
            }));

            console.log('📊 Total transactions after update:', renumberedTransactions.length);
            return renumberedTransactions;
        });

        highlightTransactionRow(referenceNo);
    };

    const highlightTransactionRow = (referenceNo: string) => {
        setTimeout(() => {
            try {
                const row = document.querySelector(`[data-reference="${referenceNo}"]`);
                if (row) {
                    row.classList.add('transaction-updated');
                    setTimeout(() => {
                        row.classList.remove('transaction-updated');
                    }, 3000);
                    console.log('✅ Highlighted transaction row:', referenceNo);
                } else {
                    console.log('⚠️ Transaction row not found for highlighting:', referenceNo);
                }
            } catch (err) {
                console.error('❌ Error highlighting transaction row:', err);
            }
        }, 100);
    };

    // TAMBAHKAN: Handler untuk search
    const handleSearch = (searchTerm: string) => {
        setSearchTerm(searchTerm);
        setCurrentPage(1);
        fetchTransactions({
            search: searchTerm,
            status: selectedStatus,
            page: 1
        });
    };

    // TAMBAHKAN: Handler untuk status filter
    const handleStatusFilter = (status: string) => {
        setSelectedStatus(status);
        setCurrentPage(1);
        fetchTransactions({
            status: status,
            search: searchTerm,
            page: 1
        });
    };

    // Fungsi untuk fetch data dari API
    const fetchTransactions = async (params: SearchParams = {}) => {
        setIsLoading(true);
        setError(null);

        try {
            const queryParams = new URLSearchParams();

            if (params.reference_number) {
                queryParams.append('referenceNumber', params.reference_number);
            }

            if (params.status && params.status !== '') {
                queryParams.append('status', params.status);
            }

            if (params.start_date) {
                queryParams.append('startDate', params.start_date);
            }
            if (params.end_date) {
                queryParams.append('endDate', params.end_date);
            }

            if (params.search) {
                queryParams.append('search', params.search);
            }

            const page = params.page || currentPage;
            const limit = params.limit || itemsPerPage;

            queryParams.append('page', page.toString());
            queryParams.append('limit', limit.toString());

            const url = `http://localhost:8000/api/v1/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

            console.log('📡 Fetching transactions from:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ApiResponse = await response.json();
            console.log('📦 API response:', data);

            if (data.responseCode === '200') {
                const normalizedData = data.data.map((transaction: any) => ({
                    ...transaction,
                    referenceNo: transaction.referenceNo || transaction.reference_no,
                    reference_no: transaction.reference_no || transaction.referenceNo
                }));

                if (data.pagination) {
                    setPagination(data.pagination);
                    setCurrentPage(data.pagination.page);
                    setItemsPerPage(data.pagination.limit);
                }

                const transactionsWithNumbers = addRowNumbers(
                    normalizedData,
                    data.pagination?.page || page,
                    data.pagination?.limit || limit
                );

                setTransactions(transactionsWithNumbers);
                if (normalizedData.length === 0) {
                    setError('Tidak ada transaksi yang ditemukan dengan kriteria pencarian tersebut');
                }
            } else {
                throw new Error(data.responseMessage || 'Terjadi kesalahan pada server');
            }

        } catch (err) {
            console.error('Error fetching transactions:', err);
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil data');
            setTransactions([]);
        } finally {
            setIsLoading(false);
        }
    };

    // TAMBAHKAN: Handler untuk search dari TransactionTable (untuk kompatibilitas)
    const handleTableSearch = async (params: SearchParams) => {
        setHasSearched(true);
        await fetchTransactions(params);
    };

    // Load initial data on component mount - hanya di client
    useEffect(() => {
        fetchTransactions();
    }, []);

    const handleRetry = () => {
        if (transactions.length === 0 && hasSearched) {
            fetchTransactions({});
        }
    };

    const handleReset = () => {
        setTransactions([]);
        setError(null);
        setHasSearched(false);
        setCurrentPage(1);
        setSearchTerm('');
        setSelectedStatus('');
        fetchTransactions();
    };

    // TAMBAHKAN: Handler untuk tombol "Muat Semua Transaksi"
    const handleLoadAllTransactions = () => {
        setSearchTerm('');
        setSelectedStatus('');
        setCurrentPage(1);
        fetchTransactions({});
    };

    // TAMBAHKAN: Handler untuk manual unlock audio
    const handleManualUnlockAudio = () => {
        unlockAudio();
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
                </div>

                {/* Connection Status & Notification */}
                <div className="flex justify-center items-center gap-3 mb-6">
                    {/* Connection Status */}
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${isConnected
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                        {isConnected ? (
                            <>
                                <Wifi className="w-4 h-4" />
                                Connected - Real-time Updates Active
                            </>
                        ) : (
                            <>
                                <WifiOff className="w-4 h-4" />
                                Disconnected - Reconnecting...
                            </>
                        )}
                    </div>

                    {/* Sound Status Indicator */}
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${audioUnlocked
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        }`}>
                        <Volume2 className="w-4 h-4" />
                        {audioUnlocked ? 'Sound Notification Active' : 'Click anywhere to enable sound'}
                    </div>

                    {/* Notification */}
                    {notification && (
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${notification.type === 'success'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : notification.type === 'error'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                            {notification.message}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4 mb-6 flex-wrap">
                    <Button
                        color="primary"
                        startContent={<Search className="w-4 h-4" />}
                        onPress={handleLoadAllTransactions}
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

                    {/* Tombol manual unlock audio */}
                    {!audioUnlocked && (
                        <Button
                            color="warning"
                            variant="flat"
                            startContent={<Volume2 className="w-4 h-4" />}
                            onPress={handleManualUnlockAudio}
                            className="py-2 px-6 bg-orange-100 hover:bg-orange-200 rounded-lg"
                        >
                            Enable Sound
                        </Button>
                    )}

                    {!isConnected && (
                        <Button
                            color="warning"
                            variant="flat"
                            startContent={<Wifi className="w-4 h-4" />}
                            onPress={reconnectWebSocket}
                            className="py-2 px-6 bg-yellow-100 hover:bg-yellow-200 rounded-lg"
                        >
                            Reconnect
                        </Button>
                    )}
                </div>
                
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
                                {isConnected && ' • Real-time updates active'}
                                {transactions.length > 0 && ` • Halaman ${currentPage}`}
                                {(searchTerm || selectedStatus) && ' • Filter aktif'}
                                {audioUnlocked && ' • Sound notification active'}
                                {!audioUnlocked && ' • Click to enable sound'}
                            </div>
                            <TransactionTable
                                transactions={transactions}
                                onSearch={handleSearch}
                                onStatusFilter={handleStatusFilter}
                                onTableSearch={handleTableSearch}
                                isLoading={isLoading}
                                currentPage={pagination.page}
                                itemsPerPage={pagination.limit}
                                onPageChange={(page) => {
                                    setCurrentPage(page);
                                    fetchTransactions({
                                        page,
                                        limit: pagination.limit,
                                        search: searchTerm,
                                        status: selectedStatus
                                    });
                                }}
                                onItemsPerPageChange={(limit) => {
                                    setItemsPerPage(limit);
                                    setCurrentPage(1);
                                    fetchTransactions({
                                        page: 1,
                                        limit,
                                        search: searchTerm,
                                        status: selectedStatus
                                    });
                                }}
                                totalItems={pagination.total}
                                totalPages={pagination.totalPage}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}