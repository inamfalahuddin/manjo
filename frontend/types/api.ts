
import { Transaction, SearchParams } from '@/types';

export interface ApiResponse {
    responseCode: string;
    responseMessage: string;
    data: Transaction[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPage: number;
    };
}

interface WebSocketMessage {
    type: string;
    data: Transaction;
    timestamp: number;
}