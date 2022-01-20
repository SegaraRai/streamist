import {
  ScryptOptions,
  createHash,
  scrypt,
  timingSafeEqual,
} from 'node:crypto';
import { randomBytesAsync } from '$shared-server/randomBytesAsync';
import {
  PASSWORD_SALT_LENGTH,
  PASSWORD_SCRYPT_BLOCK_SIZE,
  PASSWORD_SCRYPT_COST,
  PASSWORD_SCRYPT_KEYLEN,
  PASSWORD_SCRYPT_PARALLELIZATION,
} from '$/config';

function convertPasswordToBuffer(password: string): Buffer {
  return createHash('sha512').update(password.normalize()).digest();
}

function scryptAsync(
  password: Buffer,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject): void => {
    scrypt(password, salt, keylen, options, (err, key): void => {
      if (err) {
        reject(err);
      } else {
        resolve(key);
      }
    });
  });
}

export async function calcPasswordHashAsync(password: string): Promise<string> {
  const passwordBuffer = convertPasswordToBuffer(password);
  const salt = await randomBytesAsync(PASSWORD_SALT_LENGTH);
  const hash = await scryptAsync(passwordBuffer, salt, PASSWORD_SCRYPT_KEYLEN, {
    cost: PASSWORD_SCRYPT_COST,
    blockSize: PASSWORD_SCRYPT_BLOCK_SIZE,
    parallelization: PASSWORD_SCRYPT_PARALLELIZATION,
  });
  return `${hash.toString('base64url')}.${salt.toString(
    'base64url'
  )}.${PASSWORD_SCRYPT_KEYLEN}.${PASSWORD_SCRYPT_COST}.${PASSWORD_SCRYPT_BLOCK_SIZE}.${PASSWORD_SCRYPT_PARALLELIZATION}`;
}

export async function verifyPasswordHashAsync(
  password: string,
  passwordHash: string
): Promise<boolean> {
  const passwordBuffer = convertPasswordToBuffer(password);
  const [
    strHash,
    strSalt,
    strKeylen,
    strCost,
    strBlockSize,
    strParallelization,
  ] = passwordHash.split('.');
  const hash = Buffer.from(strHash, 'base64url');
  const salt = Buffer.from(strSalt, 'base64url');
  const generatedHash = await scryptAsync(
    passwordBuffer,
    salt,
    parseInt(strKeylen, 10),
    {
      cost: parseInt(strCost, 10),
      blockSize: parseInt(strBlockSize, 10),
      parallelization: parseInt(strParallelization, 10),
    }
  );
  return timingSafeEqual(generatedHash, hash);
}

if (!Buffer.isEncoding('base64url')) {
  throw new Error('base64url encoding is not supported');
}
