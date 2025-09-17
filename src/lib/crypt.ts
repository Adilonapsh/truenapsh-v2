import CryptoJS from "crypto-js";

const secretKey = process.env.AUTH_SECRET;

const encrypt = (text: string): string => {
    return CryptoJS.AES.encrypt(text, secretKey || '').toString();
}

const decrypt = (ciphertext: string): string => {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey || '');
    return bytes.toString(CryptoJS.enc.Utf8);
}

export {
    encrypt,
    decrypt
}