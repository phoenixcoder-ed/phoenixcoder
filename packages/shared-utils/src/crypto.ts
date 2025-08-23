import CryptoJS from 'crypto-js';

// 哈希函数
export const md5 = (text: string): string => {
  return CryptoJS.MD5(text).toString();
};

export const sha1 = (text: string): string => {
  return CryptoJS.SHA1(text).toString();
};

export const sha256 = (text: string): string => {
  return CryptoJS.SHA256(text).toString();
};

export const sha512 = (text: string): string => {
  return CryptoJS.SHA512(text).toString();
};

// HMAC 函数
export const hmacSha256 = (text: string, key: string): string => {
  return CryptoJS.HmacSHA256(text, key).toString();
};

export const hmacSha512 = (text: string, key: string): string => {
  return CryptoJS.HmacSHA512(text, key).toString();
};

// 对称加密（AES）
export const encryptAES = (text: string, key: string): string => {
  return CryptoJS.AES.encrypt(text, key).toString();
};

export const decryptAES = (encryptedText: string, key: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    throw new Error('解密失败');
  }
};

// Base64 编码/解码
export const encodeBase64 = (text: string): string => {
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text));
};

export const decodeBase64 = (encodedText: string): string => {
  try {
    return CryptoJS.enc.Base64.parse(encodedText).toString(CryptoJS.enc.Utf8);
  } catch (error) {
    throw new Error('Base64解码失败');
  }
};

// URL安全的Base64编码
export const encodeBase64URL = (text: string): string => {
  return encodeBase64(text)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

export const decodeBase64URL = (encodedText: string): string => {
  // 补充填充字符
  let padded = encodedText;
  while (padded.length % 4) {
    padded += '=';
  }
  
  // 替换URL安全字符
  const base64 = padded
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  return decodeBase64(base64);
};

// 随机数生成
export const generateRandomBytes = (length: number): string => {
  return CryptoJS.lib.WordArray.random(length).toString();
};

export const generateRandomHex = (length: number): string => {
  const bytes = Math.ceil(length / 2);
  return CryptoJS.lib.WordArray.random(bytes).toString().substring(0, length);
};

export const generateSalt = (length: number = 16): string => {
  return generateRandomHex(length);
};

// 密码哈希（使用盐值）
export const hashPassword = (password: string, salt?: string): { hash: string; salt: string } => {
  const passwordSalt = salt || generateSalt();
  const hash = sha256(password + passwordSalt);
  
  return {
    hash,
    salt: passwordSalt,
  };
};

export const verifyPassword = (password: string, hash: string, salt: string): boolean => {
  const { hash: computedHash } = hashPassword(password, salt);
  return computedHash === hash;
};

// PBKDF2 密钥派生
export const deriveKeyPBKDF2 = (
  password: string,
  salt: string,
  iterations: number = 10000,
  keyLength: number = 256
): string => {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: keyLength / 32,
    iterations,
  }).toString();
};

// JWT 相关工具（简化版）
export const createJWTPayload = (payload: Record<string, any>): string => {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };
  
  const encodedHeader = encodeBase64URL(JSON.stringify(header));
  const encodedPayload = encodeBase64URL(JSON.stringify(payload));
  
  return `${encodedHeader}.${encodedPayload}`;
};

export const signJWT = (payload: Record<string, any>, secret: string): string => {
  const unsignedToken = createJWTPayload(payload);
  const signature = encodeBase64URL(hmacSha256(unsignedToken, secret));
  
  return `${unsignedToken}.${signature}`;
};

export const verifyJWT = (token: string, secret: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const [header, payload, signature] = parts;
    const unsignedToken = `${header}.${payload}`;
    const expectedSignature = encodeBase64URL(hmacSha256(unsignedToken, secret));
    
    return signature === expectedSignature;
  } catch (_error) {
    return false;
  }
};

export const decodeJWT = (token: string): { header: any; payload: any } | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [header, payload] = parts;
    
    return {
      header: JSON.parse(decodeBase64URL(header)),
      payload: JSON.parse(decodeBase64URL(payload)),
    };
  } catch (_error) {
    return null;
  }
};

// 数据完整性校验
export const generateChecksum = (data: string, algorithm: 'md5' | 'sha1' | 'sha256' = 'sha256'): string => {
  switch (algorithm) {
    case 'md5':
      return md5(data);
    case 'sha1':
      return sha1(data);
    case 'sha256':
      return sha256(data);
    default:
      return sha256(data);
  }
};

export const verifyChecksum = (
  data: string,
  expectedChecksum: string,
  algorithm: 'md5' | 'sha1' | 'sha256' = 'sha256'
): boolean => {
  const actualChecksum = generateChecksum(data, algorithm);
  return actualChecksum === expectedChecksum;
};

// 敏感数据脱敏
export const maskSensitiveData = (data: string, visibleChars: number = 4): string => {
  if (data.length <= visibleChars * 2) {
    return '*'.repeat(data.length);
  }
  
  const start = data.substring(0, visibleChars);
  const end = data.substring(data.length - visibleChars);
  const middle = '*'.repeat(data.length - visibleChars * 2);
  
  return `${start}${middle}${end}`;
};

// 安全随机字符串生成
export const generateSecureToken = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomBytes = CryptoJS.lib.WordArray.random(1);
    const randomIndex = Math.abs(randomBytes.words[0]) % chars.length;
    result += chars.charAt(randomIndex);
  }
  
  return result;
};

// API 签名生成
export const generateAPISignature = (
  method: string,
  url: string,
  params: Record<string, any>,
  secret: string,
  timestamp?: number
): string => {
  const ts = timestamp || Date.now();
  
  // 参数排序
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  // 构建签名字符串
  const signString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}&${ts}`;
  
  return hmacSha256(signString, secret);
};

export const verifyAPISignature = (
  method: string,
  url: string,
  params: Record<string, any>,
  signature: string,
  secret: string,
  timestamp: number,
  tolerance: number = 300000 // 5分钟容差
): boolean => {
  // 检查时间戳
  const now = Date.now();
  if (Math.abs(now - timestamp) > tolerance) {
    return false;
  }
  
  // 验证签名
  const expectedSignature = generateAPISignature(method, url, params, secret, timestamp);
  return signature === expectedSignature;
};

// 文件哈希计算（用于文件完整性校验）
export const calculateFileHash = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
        const hash = CryptoJS.SHA256(wordArray).toString();
        resolve(hash);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
};

// 加密配置
export interface EncryptionConfig {
  algorithm: 'AES';
  keySize: 128 | 192 | 256;
  mode: 'CBC' | 'ECB' | 'CFB' | 'OFB';
  padding: 'Pkcs7' | 'AnsiX923' | 'Iso10126' | 'NoPadding';
}

// 高级加密函数
export const encryptWithConfig = (
  text: string,
  key: string,
  _config: Partial<EncryptionConfig> = {}
): string => {
  // 这里简化实现，实际项目中需要根据配置选择不同的加密方式
  // const defaultConfig: EncryptionConfig = {
  //   algorithm: 'AES',
  //   keySize: 256,
  //   mode: 'CBC',
  //   padding: 'Pkcs7',
  // };
  // const finalConfig = { ...defaultConfig, ...config };
  
  return encryptAES(text, key);
};

export const decryptWithConfig = (
  encryptedText: string,
  key: string,
  _config: Partial<EncryptionConfig> = {}
): string => {
  // 这里简化实现，实际项目中需要根据配置选择不同的解密方式
  return decryptAES(encryptedText, key);
};