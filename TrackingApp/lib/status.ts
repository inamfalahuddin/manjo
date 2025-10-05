import { Ban, Check, Clock, X } from 'lucide-react-native';
import { ComponentType } from 'react';

// Asumsi: Semua ikon diimpor dari lucide-react-native, BUKAN lucide-react

export interface StatusConfigItem {
    text: string;
    icon: ComponentType<any>; // ComponentType dari React Native
    bgColor: string;
    textColor: string;
}

const statusConfig: Record<string, StatusConfigItem> = {
    pending: {
        text: 'Pending',
        icon: Clock,
        bgColor: '#fef3c7', // Kuning muda
        textColor: '#92400e', // Cokelat
    },
    success: {
        text: 'Success',
        icon: Check,
        bgColor: '#dcfce7', // Hijau muda
        textColor: '#166534', // Hijau tua
    },
    failed: {
        text: 'Failed',
        icon: X,
        bgColor: '#fecaca', // Merah muda
        textColor: '#991b1b', // Merah tua
    },
    expired: {
        text: 'Expired',
        icon: Ban,
        bgColor: '#f3f4f6', // Abu-abu muda
        textColor: '#4b5563', // Abu-abu tua
    },
    // Tambahkan status lain yang Anda gunakan di sini
};

export default statusConfig;