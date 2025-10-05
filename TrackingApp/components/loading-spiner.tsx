import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

// Definisikan warna yang Anda gunakan agar konsisten
const COLORS = {
    primary: '#0070f3', // Ganti dengan warna primary Anda
    gray: '#4b5563',    // Warna abu-abu yang mirip dengan text-gray-600
    white: '#ffffff',
};

export default function LoadingSpinner() {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Mengganti komponen <Spinner> dengan ActivityIndicator bawaan RN */}
                <ActivityIndicator
                    size="large" // Mengganti "lg" dengan "large"
                    color={COLORS.primary} // Mengatur warna putaran
                />
                <Text style={styles.messageText}>Mencari transaksi...</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        // Mengganti 'flex justify-center items-center py-8'
        flex: 1, // Agar mengisi ruang vertikal
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 32, // py-8 (8 * 4 = 32 dp)
    },
    content: {
        // Mengganti 'text-center'
        alignItems: 'center',
    },
    messageText: {
        // Mengganti 'mt-4 text-gray-600'
        marginTop: 16, // mt-4 (4 * 4 = 16 dp)
        fontSize: 14,
        color: COLORS.gray,
    }
});