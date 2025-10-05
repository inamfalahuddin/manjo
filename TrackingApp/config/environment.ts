// config/environment.ts
import { Platform } from 'react-native';

class Environment {
    // API Configuration
    get API_BASE_URL(): string {
        return process.env.EXPO_PUBLIC_API_URL || 'https://your-production-api.com';
    }

    // WebSocket process.envuration
    get WS_BASE_URL(): string {
        if (__DEV__) {
            return Platform.OS === 'android'
                ? process.env.EXPO_PUBLIC_WS_URL || 'ws://10.0.2.2:8000'
                : process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:8000';
        }
        return process.env.EXPO_PUBLIC_WS_URL || 'wss://your-production-domain.com';
    }

    // App process.envuration
    get ENVIRONMENT(): string {
        return process.env.ENVIRONMENT || 'development';
    }

    get DEBUG(): boolean {
        return process.env.DEBUG === 'true';
    }

    get API_TIMEOUT(): number {
        return parseInt(process.env.API_TIMEOUT || '30000');
    }

    get MAX_RECONNECT_ATTEMPTS(): number {
        return parseInt(process.env.MAX_RECONNECT_ATTEMPTS || '10');
    }

    // Helper Methods
    getWebSocketUrl(path: string = '/ws'): string {
        return `${this.WS_BASE_URL}${path}`;
    }

    getApiUrl(endpoint: string): string {
        console.log('API_BASE_URL:', this.API_BASE_URL);
        const baseUrl = this.API_BASE_URL.replace(/\/$/, '');
        const cleanEndpoint = endpoint.replace(/^\//, '');
        return `${baseUrl}/${cleanEndpoint}`;
    }

    isDevelopment(): boolean {
        return this.ENVIRONMENT === 'development';
    }

    isProduction(): boolean {
        return this.ENVIRONMENT === 'production';
    }

    // Log environment info (hanya di development)
    logEnvironmentInfo(): void {
        if (this.DEBUG) {
            console.log('🚀 Environment Configuration:', {
                environment: this.ENVIRONMENT,
                platform: Platform.OS,
                apiBaseUrl: this.API_BASE_URL,
                wsBaseUrl: this.WS_BASE_URL,
                isDevelopment: this.isDevelopment(),
                isProduction: this.isProduction()
            });
        }
    }
}

export const environment = new Environment();