import * as Crypto from 'expo-crypto';

export interface Account {
  id: string;
  email: string;
  name: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
}

export class AuthError extends Error {}

export function validateEmail(email: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? null : 'Enter an email address like name@example.com.';
}

export function validatePassword(pw: string): string | null {
  return pw.length >= 8 ? null : 'Use at least 8 characters for your password.';
}

async function hash(password: string, salt: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);
}

/**
 * First-cut auth: the account lives on this device only. The same interface will call the backend
 * (register / sign-in / refresh / recovery) once it exists; screens do not need to change.
 */
export async function createAccount(email: string, password: string): Promise<Account> {
  const err = validateEmail(email) ?? validatePassword(password);
  if (err) throw new AuthError(err);
  const salt = Crypto.randomUUID();
  return {
    id: Crypto.randomUUID(),
    email: email.trim().toLowerCase(),
    name: '',
    salt,
    passwordHash: await hash(password, salt),
    createdAt: new Date().toISOString(),
  };
}

export async function verify(account: Account | null, email: string, password: string): Promise<void> {
  const generic = 'That email and password don’t match an account on this phone.';
  if (!account || account.email !== email.trim().toLowerCase()) throw new AuthError(generic);
  if ((await hash(password, account.salt)) !== account.passwordHash) throw new AuthError(generic);
}
