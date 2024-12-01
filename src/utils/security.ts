import * as crypto from 'crypto';

export default class Security {
    private encoding: BufferEncoding = 'base64url';
    private key: string | undefined = process.env.CRYPTO_KEY;

    constructor() {
        if (!this.key) {
            throw new Error('CRYPTO_KEY is not defined in environment variables.');
        }
        if (Buffer.from(this.key).length !== 32) {
            throw new Error('CRYPTO_KEY must be 32 bytes long for AES-256-CBC.');
        }
    }

    public encrypt(plaintext: string): string | undefined {
        try {
            const iv = crypto.randomBytes(16); 
            const cipher = crypto.createCipheriv('aes-256-cbc', this.key as string, iv);
            const encrypted = Buffer.concat([
                cipher.update(plaintext, 'utf8'),
                cipher.final(),
            ]);

            return `${iv.toString(this.encoding)}${encrypted.toString(this.encoding)}`;
        } catch (error) {
            console.error('Encryption error:', error);
            return undefined;
        }
    }

    public decrypt(cipherText: string): string | undefined {
        try {
            const { ivString, encryptedDataString } = this.splitEncryptedText(cipherText);
            const iv = Buffer.from(ivString, this.encoding);
            const encryptedText = Buffer.from(encryptedDataString, this.encoding);

            const decipher = crypto.createDecipheriv('aes-256-cbc', this.key as string, iv);
            const decrypted = Buffer.concat([
                decipher.update(encryptedText),
                decipher.final(),
            ]);

            return decrypted.toString('utf8');
        } catch (error) {
            console.error('Decryption error:', error);
            return undefined;
        }
    }

    private splitEncryptedText(encryptedText: string): {
        ivString: string;
        encryptedDataString: string;
    } {
        const ivLength = 22; 
        return {
            ivString: encryptedText.slice(0, ivLength),
            encryptedDataString: encryptedText.slice(ivLength),
        };
    }
}
