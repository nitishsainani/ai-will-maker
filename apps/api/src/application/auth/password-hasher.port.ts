/**
 * Application port for password hashing.
 * AuthService depends on this abstraction — never on BcryptPasswordHasher directly.
 * Swap implementations via DI (e.g. Argon2PasswordHasher in the future).
 */
export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}
