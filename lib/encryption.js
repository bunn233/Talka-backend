import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "TalkaChatOmnichannelSecretKey123"; 
const IV = Buffer.from(ENCRYPTION_KEY.substring(0, 16));

export function encryptToken(text) {
    if (!text) return text;
    try {
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), IV);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return encrypted.toString('hex');
    } catch (error) {
        console.error("Encryption Error:", error);
        return null;
    }
}

export function decryptToken(text) {
    if (!text) return text;
    const isHex = /^[0-9A-Fa-f]+$/.test(text);
    if (!isHex) return text;

    try {
        const encryptedText = Buffer.from(text, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), IV);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error("Decryption Error:", error);
        return text; // ถอดรหัสไม่ได้ คืนค่าเดิม
    }
}