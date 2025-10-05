// MerchantTracker.tsx
import { SearchParams, Transaction } from '@/types';
import { ApiResponse } from '@/types/api';
import { useRouter } from 'expo-router';
// Import Audio dari expo-av
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import {
    RefreshCw,
    Search,
    Volume2,
    VolumeX,
    Wifi,
    WifiOff
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import TransactionTable from '../../components/transaction-table';
import { environment } from '../../config/environment';
import { useWebSocket } from '../../hooks/use-websocket';
import LoadingSpinner from './../../components/loading-spiner';

// Styles (Dibiarkan sama)
const styles = {
    // ... (Styles Anda di sini)
    container: {
        flex: 1,
        backgroundColor: '#f8fafc'
    },
    header: {
        alignItems: 'center' as const,
        paddingVertical: 32,
        paddingHorizontal: 16,
        backgroundColor: 'white'
    },
    headerIcon: {
        width: 64,
        height: 64,
        backgroundColor: '#3b82f6',
        borderRadius: 16,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold' as const,
        color: '#1f2937',
        marginBottom: 8,
        textAlign: 'center' as const
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center' as const,
        maxWidth: 300
    },
    statusContainer: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb'
    },
    statusBadge: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1
    },
    connectedBadge: {
        backgroundColor: '#dcfce7',
        borderColor: '#bbf7d0'
    },
    disconnectedBadge: {
        backgroundColor: '#fecaca',
        borderColor: '#fca5a5'
    },
    soundBadge: {
        backgroundColor: '#fef3c7',
        borderColor: '#fcd34d'
    },
    environmentBadge: {
        backgroundColor: '#dbeafe',
        borderColor: '#93c5fd'
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500' as const
    },
    connectedText: {
        color: '#166534'
    },
    disconnectedText: {
        color: '#991b1b'
    },
    soundText: {
        color: '#92400e'
    },
    environmentText: {
        color: '#1e40af'
    },
    actionButtons: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        justifyContent: 'center' as const,
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: 'white'
    },
    button: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 120
    },
    buttonPrimary: {
        backgroundColor: '#1f2937'
    },
    buttonSecondary: {
        backgroundColor: '#f3f4f6'
    },
    buttonWarning: {
        backgroundColor: '#fed7aa'
    },
    buttonInfo: {
        backgroundColor: '#dbeafe'
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '500' as const
    },
    buttonTextPrimary: {
        color: 'white'
    },
    buttonTextSecondary: {
        color: '#374151'
    },
    buttonTextWarning: {
        color: '#9a3412'
    },
    buttonTextInfo: {
        color: '#1e40af'
    },
    infoText: {
        textAlign: 'center' as const,
        fontSize: 14,
        color: '#6b7280',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb'
    },
    debugInfo: {
        backgroundColor: '#fef3c7',
        padding: 8,
        margin: 16,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#f59e0b'
    },
    debugText: {
        fontSize: 12,
        color: '#92400e',
        fontFamily: 'monospace'
    }
};

export default function MerchantTracker() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [audioUnlocked, setAudioUnlocked] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [showDebugInfo, setShowDebugInfo] = useState(environment.DEBUG);

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPage: 1
    });

    const {
        isConnected,
        notification,
        reconnectWebSocket,
        lastMessage
    } = useWebSocket();

    // soundRef kini bertipe Audio.Sound | null
    const soundRef = useRef<Audio.Sound | null>(null);

    // Initialize environment info
    useEffect(() => {
        environment.logEnvironmentInfo();
    }, []);

    // 🔊 PERBAIKAN: Initialize Audio menggunakan expo-av
    useEffect(() => {
        const initializeAudio = async () => {
            try {
                // Atur mode audio untuk pemutaran
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: true,
                    shouldDuckAndroid: true,
                    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
                    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
                });

                // Muat file MP3 lokal
                const { sound } = await Audio.Sound.createAsync(
                    require('../../assets/notifications/sound-notification.mp3')
                );

                soundRef.current = sound;
                setAudioUnlocked(true); // Audio berhasil dimuat, anggap unlocked
                console.log('🔊 Audio initialized successfully with expo-av');

            } catch (error) {
                console.error('Error initializing audio with expo-av:', error);
                setAudioUnlocked(false);
                // Menampilkan alert hanya jika file benar-benar gagal dimuat
                Alert.alert('Audio Error', 'Gagal memuat file suara notifikasi.');
            }
        };

        initializeAudio();

        // Cleanup function untuk melepaskan sumber daya audio
        return () => {
            if (soundRef.current) {
                console.log('🔊 Releasing audio resource');
                soundRef.current.unloadAsync();
            }
        };
    }, []);

    const unlockAudio = async () => {
        // Fungsi ini bisa digunakan sebagai toggle Mute/Unmute
        setAudioUnlocked(prev => !prev);
        console.log(`🔊 Audio ${!audioUnlocked ? 'unlocked' : 'locked'} manually`);
    };

    const playNotificationSound = async () => {
        if (!audioUnlocked || !soundRef.current) return;

        try {
            await soundRef.current.stopAsync(); // Hentikan yang sedang berjalan
            await soundRef.current.setPositionAsync(0); // Atur posisi ke awal
            await soundRef.current.playAsync(); // Mulai putar
            console.log('🔊 Notification sound played');
        } catch (error) {
            console.error('Error playing notification sound:', error);
        }
    };

    // Handle incoming WebSocket messages (Tidak diubah, akan memanggil playNotificationSound)
    useEffect(() => {
        if (lastMessage) {
            if (environment.DEBUG) {
                console.log('📨 WebSocket message received:', lastMessage);
            }

            playNotificationSound();
            handleWebSocketMessage(lastMessage);
        }
    }, [lastMessage]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleWebSocketMessage = (message: any) => {
        // ... (Logika handleWebSocketMessage tidak diubah)
        switch (message.type) {
            case 'TRANSACTION_UPDATE':
                handleTransactionUpdate(message);
                break;
            default:
                if (environment.DEBUG) {
                    console.log('Unknown message type:', message.type);
                }
        }
    };

    const handleTransactionUpdate = (transactionData: any) => {
        // ... (Logika handleTransactionUpdate tidak diubah)
        const referenceNo = transactionData.reference_no;

        if (!referenceNo) {
            console.error('No reference number found');
            return;
        }

        setTransactions(prevTransactions => {
            const existingIndex = prevTransactions.findIndex(
                transaction => transaction.referenceNo === referenceNo
            );

            let newTransactions: Transaction[];

            if (existingIndex >= 0) {
                newTransactions = [...prevTransactions];
                newTransactions[existingIndex] = {
                    ...newTransactions[existingIndex],
                    amount: transactionData.amount,
                    currency: transactionData.currency,
                    status: transactionData.status,
                    paid_date: transactionData.paid_date,
                    updated_at: transactionData.updated_at
                };

                if (environment.DEBUG) {
                    console.log('✅ Updated existing transaction:', referenceNo);
                }
            } else {
                const newTransaction: Transaction = {
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
                    updated_at: transactionData.updated_at
                };
                newTransactions = [newTransaction, ...prevTransactions];

                if (environment.DEBUG) {
                    console.log('✅ Added new transaction:', referenceNo);
                }
            }

            return newTransactions;
        });
    };

    // ... (Fungsi fetchTransactions dan handler lainnya tidak diubah)
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

            // Gunakan environment variable untuk API URL
            const url = environment.getApiUrl(`/api/v1/transactions?${queryParams.toString()}`);

            console.log('Fetching transactions from:', url);

            if (environment.DEBUG) {
                console.log('📡 Fetching transactions from:', url);
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ApiResponse = await response.json();

            if (data.responseCode === '200') {
                const normalizedData = data.data.map((transaction: any) => ({
                    ...transaction,
                    // Pastikan ada 'referenceNo' atau 'reference_no'
                    referenceNo: transaction.referenceNo || transaction.reference_no || transaction.id || transaction.trx_id,
                    reference_no: transaction.reference_no || transaction.referenceNo || transaction.id || transaction.trx_id
                }));

                if (data.pagination) {
                    setPagination(data.pagination);
                    setCurrentPage(data.pagination.page);
                    setItemsPerPage(data.pagination.limit);
                }

                setTransactions(normalizedData);
                if (normalizedData.length === 0) {
                    setError('Tidak ada transaksi yang ditemukan');
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


    const handleSearch = (searchTerm: string) => {
        setSearchTerm(searchTerm);
        setCurrentPage(1);
        fetchTransactions({
            search: searchTerm,
            status: selectedStatus,
            page: 1
        });
    };

    const handleStatusFilter = (status: string) => {
        setSelectedStatus(status);
        setCurrentPage(1);
        fetchTransactions({
            status: status,
            search: searchTerm,
            page: 1
        });
    };

    const handleLoadAllTransactions = () => {
        setSearchTerm('');
        setSelectedStatus('');
        setCurrentPage(1);
        fetchTransactions({});
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

    const handleManualUnlockAudio = () => {
        // Ubah ini menjadi fungsi toggle
        unlockAudio();
    };
    const showEnvironmentInfo = () => {
        Alert.alert(
            'Environment Info',
            `Platform: ${Platform.OS}\nEnvironment: ${environment.ENVIRONMENT}\nAPI: ${environment.API_BASE_URL}\nWebSocket: ${environment.WS_BASE_URL}`,
            [{ text: 'OK' }]
        );
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerIcon}>
                    <Search size={24} color="white" />
                </View>
                <Text style={styles.title}>Merchant Status Tracker</Text>
                <Text style={styles.subtitle}>
                    Lacak status transaksi merchant Anda secara real-time
                </Text>
            </View>

            {/* Connection Status */}
            <View style={styles.statusContainer}>
                <View style={[
                    styles.statusBadge,
                    isConnected ? styles.connectedBadge : styles.disconnectedBadge
                ]}>
                    {isConnected ? (
                        <Wifi size={16} color={styles.connectedText.color} />
                    ) : (
                        <WifiOff size={16} color={styles.disconnectedText.color} />
                    )}
                    <Text style={[
                        styles.statusText,
                        isConnected ? styles.connectedText : styles.disconnectedText
                    ]}>
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </Text>
                </View>

                {/* Sound Status */}
                <TouchableOpacity // Ubah ke TouchableOpacity agar bisa di-tap
                    style={[styles.statusBadge, styles.soundBadge]}
                    onPress={handleManualUnlockAudio}
                >
                    {audioUnlocked ? (
                        <Volume2 size={16} color={styles.soundText.color} />
                    ) : (
                        <VolumeX size={16} color={styles.soundText.color} />
                    )}
                    <Text style={[styles.statusText, styles.soundText]}>
                        {audioUnlocked ? 'Sound Active' : 'Sound Muted'}
                    </Text>
                </TouchableOpacity>

                {/* Environment Badge */}
                <TouchableOpacity
                    style={[styles.statusBadge, styles.environmentBadge]}
                    onPress={showEnvironmentInfo}
                >
                    <Text style={[styles.statusText, styles.environmentText]}>
                        {environment.ENVIRONMENT}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Debug Info (hanya tampil di development) */}
            {showDebugInfo && environment.DEBUG && (
                <View style={styles.debugInfo}>
                    <Text style={styles.debugText}>
                        {`ENV: ${environment.ENVIRONMENT} | PLATFORM: ${Platform.OS} | API: ${environment.API_BASE_URL}`}
                    </Text>
                </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
                {/* ... (Action Buttons lainnya tidak diubah) */}
                <TouchableOpacity
                    style={[styles.button, styles.buttonSecondary]}
                    onPress={handleLoadAllTransactions}
                    disabled={isLoading}
                >
                    <Search size={16} color={styles.buttonTextSecondary.color} />
                    <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                        Muat Semua
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.buttonSecondary]}
                    onPress={handleReset}
                >
                    <RefreshCw size={16} color={styles.buttonTextSecondary.color} />
                    <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                        Reset
                    </Text>
                </TouchableOpacity>

                {/* Tombol sound kini menjadi toggle Mute/Unmute */}
                <TouchableOpacity
                    style={[styles.button, styles.buttonWarning]}
                    onPress={handleManualUnlockAudio}
                >
                    {audioUnlocked ? (
                        <>
                            <VolumeX size={16} color={styles.buttonTextWarning.color} />
                            <Text style={[styles.buttonText, styles.buttonTextWarning]}>
                                Mute Sound
                            </Text>
                        </>
                    ) : (
                        <>
                            <Volume2 size={16} color={styles.buttonTextWarning.color} />
                            <Text style={[styles.buttonText, styles.buttonTextWarning]}>
                                Unmute Sound
                            </Text>
                        </>
                    )}
                </TouchableOpacity>


                {!isConnected && (
                    <TouchableOpacity
                        style={[styles.button, styles.buttonWarning]}
                        onPress={reconnectWebSocket}
                    >
                        <Wifi size={16} color={styles.buttonTextWarning.color} />
                        <Text style={[styles.buttonText, styles.buttonTextWarning]}>
                            Reconnect
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Info Text */}
            <Text style={styles.infoText}>
                Menampilkan {transactions.length} transaksi
                {isConnected && ' • Real-time updates active'}
                {(searchTerm || selectedStatus) && ' • Filter aktif'}
                {environment.DEBUG && ' • Debug mode'}
            </Text>

            {/* Loading */}
            {isLoading && <LoadingSpinner />}

            {/* Transaction Table */}
            {!isLoading && (
                <TransactionTable
                    transactions={transactions}
                    onSearch={handleSearch}
                    onStatusFilter={handleStatusFilter}
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
            )}
        </ScrollView>
    );
}