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


export { generateSignature, generateSignatureAlt };