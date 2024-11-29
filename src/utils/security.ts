import * as crypto from 'crypto';


export default class Security {
    
    private encoding: BufferEncoding = 'hex';

    private key: string | undefined = process.env.CRYPTO_KEY

    public encrypt( plaintext: string ): string | undefined {
        let encrypt: string | undefined;
        try {
            const iv = crypto.randomBytes( 16 );
            const cipher = crypto.createCipheriv( 'aes-256-cbc', this.key as string, iv );
            const encrypted = Buffer.concat( [
                cipher.update(
                    plaintext, 'utf-8'
                ),
                cipher.final(),
            ] );

            encrypt = iv.toString( this.encoding ) + encrypted.toString( this.encoding );

        } catch (e) {
            console.error( e );
        }
        return encrypt;
    };

    public decrypt( cipherText: string ) : string | undefined {
        const {
            encryptedDataString,
            ivString,
        } = this.splitEncryptedText( cipherText );
        let decrypt: string | undefined;
        try {
            const iv = Buffer.from( ivString, this.encoding );
            const encryptedText = Buffer.from( encryptedDataString, this.encoding );

            const decipher = crypto.createDecipheriv( 'aes-256-cbc', this.key as string, iv );

            const decrypted = decipher.update( encryptedText );
            decrypt = Buffer.concat( [ decrypted, decipher.final() ] ).toString();
        } catch (e) {
            console.error( e );
        }
        return decrypt;
    }

    public splitEncryptedText( encryptedText: string ): {
        ivString: string;
        encryptedDataString: string;
    } {
        return {
            ivString: encryptedText.slice( 0, 32 ),
            encryptedDataString: encryptedText.slice( 32 ),
        }
    }
}