import { z } from 'zod';
import { User } from '@/types';
import { generateSalt, hashPassword } from './authCrypto';

export const USERS_KEY = 'bc_local_auth_users_v1';
export const USERS_BACKUP_KEY = `${USERS_KEY}__backup`;
const USERS_CORRUPT_KEY = `${USERS_KEY}__corrupted`;
const SESSION_KEY = 'bc_local_auth_session_v1';
const SESSION_BACKUP_KEY = `${SESSION_KEY}__backup`;
const SESSION_CORRUPT_KEY = `${SESSION_KEY}__corrupted`;

const storedLocalUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.enum(['sales', 'builder', 'admin', 'dual']),
  country: z.string().optional(),
  region: z.string().optional(),
  locale: z.string().optional(),
  currency: z.string().optional(),
  languages: z.array(z.string()).optional(),
  approved: z.boolean(),
  createdAt: z.string(),
  passwordHash: z.string(),
  passwordSalt: z.string(),
});

const storedLocalUsersSchema = z.array(storedLocalUserSchema);

const storedSessionSchema = z.object({
  userId: z.string(),
});

export type StoredLocalUser = z.infer<typeof storedLocalUserSchema>;

type StoredSession = z.infer<typeof storedSessionSchema>;

function parseValue<T>(raw: string | null, schema: z.ZodType<T>): T | null {
  if (raw === null) {
    return null;
  }

  try {
    const candidate = JSON.parse(raw);
    const result = schema.safeParse(candidate);
    return result.success ? result.data : null;
  } catch (error) {
    console.warn('Failed to parse persisted local auth value', error);
    return null;
  }
}

function cloneUsers(users: StoredLocalUser[]): StoredLocalUser[] {
  return users.map((user) => ({ ...user }));
}

function readUsers(): StoredLocalUser[] {
  const primaryRaw = localStorage.getItem(USERS_KEY);
  const primaryParsed = parseValue(primaryRaw, storedLocalUsersSchema);

  if (primaryParsed) {
    return cloneUsers(primaryParsed);
  }

  if (primaryRaw !== null) {
    localStorage.setItem(USERS_CORRUPT_KEY, primaryRaw);
    console.warn(
      'Primary local auth store is corrupt; attempting to restore from backup.',
    );
  }

  const backupRaw = localStorage.getItem(USERS_BACKUP_KEY);
  const backupParsed = parseValue(backupRaw, storedLocalUsersSchema);

  if (backupParsed) {
    if (backupRaw !== null) {
      localStorage.setItem(USERS_KEY, backupRaw);
      localStorage.setItem(USERS_BACKUP_KEY, backupRaw);
    }

    return cloneUsers(backupParsed);
  }

  if (backupRaw !== null) {
    localStorage.setItem(USERS_CORRUPT_KEY, backupRaw);
    console.error(
      'Failed to restore local auth users from backup; starting with an empty set.',
    );
  }

  return [];
}

function writeUsers(users: StoredLocalUser[]) {
  const payload = JSON.stringify(cloneUsers(users));
  localStorage.setItem(USERS_KEY, payload);
  localStorage.setItem(USERS_BACKUP_KEY, payload);
  localStorage.removeItem(USERS_CORRUPT_KEY);
}

function readSession(): StoredSession | null {
  const primaryRaw = localStorage.getItem(SESSION_KEY);
  const primaryParsed = parseValue(primaryRaw, storedSessionSchema);

  if (primaryParsed) {
    return { ...primaryParsed };
  }

  if (primaryRaw !== null) {
    localStorage.setItem(SESSION_CORRUPT_KEY, primaryRaw);
    console.warn(
      'Primary local auth session is corrupt; attempting to restore from backup.',
    );
  }

  const backupRaw = localStorage.getItem(SESSION_BACKUP_KEY);
  const backupParsed = parseValue(backupRaw, storedSessionSchema);

  if (backupParsed) {
    if (backupRaw !== null) {
      localStorage.setItem(SESSION_KEY, backupRaw);
      localStorage.setItem(SESSION_BACKUP_KEY, backupRaw);
    }

    return { ...backupParsed };
  }

  if (backupRaw !== null) {
    localStorage.setItem(SESSION_CORRUPT_KEY, backupRaw);
    console.error('Failed to restore local auth session from backup; clearing.');
  }

  return null;
}

function writeSession(session: StoredSession | null) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_BACKUP_KEY);
    localStorage.removeItem(SESSION_CORRUPT_KEY);
    return;
  }

  const payload = JSON.stringify({ ...session });
  localStorage.setItem(SESSION_KEY, payload);
  localStorage.setItem(SESSION_BACKUP_KEY, payload);
  localStorage.removeItem(SESSION_CORRUPT_KEY);
}

function sanitiseUser(user: StoredLocalUser): User {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    country: user.country,
    region: user.region,
    locale: user.locale,
    currency: user.currency,
    languages: user.languages ?? [],
    approved: user.approved,
    createdAt: new Date(user.createdAt),
  };
}

export interface RegisterLocalUserOptions {
  country?: string;
  locale?: string;
  currency?: string;
  languages?: string[];
}

export async function registerLocalUser(
  email: string,
  password: string,
  role: User['role'],
  options: RegisterLocalUserOptions = {},
): Promise<User> {
  const users = readUsers();
  const trimmedEmail = email.trim();
  const normalizedEmail = trimmedEmail.toLowerCase();

  if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    throw new Error('An account with this email already exists.');
  }

  const passwordSalt = generateSalt();
  const passwordHash = await hashPassword(password, passwordSalt);
  const id = `local_${globalThis.crypto.randomUUID()}`;

  const storedUser: StoredLocalUser = {
    id,
    email: trimmedEmail,
    role,
    country: options.country,
    locale: options.locale,
    currency: options.currency,
    languages: options.languages ?? [],
    approved: false,
    createdAt: new Date().toISOString(),
    passwordHash,
    passwordSalt,
  };

  const nextUsers = [...users, storedUser];
  writeUsers(nextUsers);
  writeSession({ userId: storedUser.id });

  return sanitiseUser(storedUser);
}

export async function loginLocalUser(
  email: string,
  password: string,
): Promise<User> {
  const users = readUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const storedUser = users.find(
    (user) => user.email.toLowerCase() === normalizedEmail,
  );

  if (!storedUser) {
    throw new Error('Invalid email or password.');
  }

  const passwordHash = await hashPassword(password, storedUser.passwordSalt);

  if (passwordHash !== storedUser.passwordHash) {
    throw new Error('Invalid email or password.');
  }

  writeSession({ userId: storedUser.id });
  return sanitiseUser(storedUser);
}

export function logoutLocalUser() {
  writeSession(null);
}

export function loadLocalSession(): User | null {
  const session = readSession();
  if (!session) {
    return null;
  }

  const users = readUsers();
  const storedUser = users.find((user) => user.id === session.userId);

  if (!storedUser) {
    writeSession(null);
    return null;
  }

  return sanitiseUser(storedUser);
}

export function clearLocalAuthStore() {
  localStorage.removeItem(USERS_KEY);
  localStorage.removeItem(USERS_BACKUP_KEY);
  localStorage.removeItem(USERS_CORRUPT_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_BACKUP_KEY);
  localStorage.removeItem(SESSION_CORRUPT_KEY);
}

export const isLocalAuthAvailable =
  typeof window !== 'undefined' && Boolean(globalThis.crypto?.subtle);

export function getStoredLocalUsers(): StoredLocalUser[] {
  return readUsers();
}

export function persistStoredLocalUsers(users: StoredLocalUser[]) {
  writeUsers(users);
}
