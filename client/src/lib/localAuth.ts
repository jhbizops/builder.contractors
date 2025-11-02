import { User } from '@/types';

const USERS_KEY = 'bc_local_auth_users_v1';
const SESSION_KEY = 'bc_local_auth_session_v1';

type StoredLocalUser = User & {
  createdAt: string;
  passwordHash: string;
  passwordSalt: string;
};

type StoredSession = {
  userId: string;
};

const encoder = new TextEncoder();

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function generateSalt(length = 16): string {
  const array = new Uint8Array(length);
  globalThis.crypto.getRandomValues(array);
  return bufferToBase64(array.buffer);
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = encoder.encode(`${salt}:${password}`);
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
  return bufferToBase64(hashBuffer);
}

function readUsers(): StoredLocalUser[] {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as StoredLocalUser[];
  } catch (error) {
    console.warn('Failed to parse stored users; resetting store', error);
    localStorage.removeItem(USERS_KEY);
    return [];
  }
}

function writeUsers(users: StoredLocalUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function writeSession(session: StoredSession | null) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function readSession(): StoredSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredSession;
  } catch (error) {
    console.warn('Failed to parse stored session; clearing session', error);
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function sanitiseUser(user: StoredLocalUser): User {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    country: user.country,
    region: user.region,
    approved: user.approved,
    createdAt: new Date(user.createdAt),
  };
}

export async function registerLocalUser(
  email: string,
  password: string,
  role: User['role'],
): Promise<User> {
  const users = readUsers();

  if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('An account with this email already exists.');
  }

  const passwordSalt = generateSalt();
  const passwordHash = await hashPassword(password, passwordSalt);
  const id = `local_${globalThis.crypto.randomUUID()}`;

  const storedUser: StoredLocalUser = {
    id,
    email,
    role,
    approved: false,
    createdAt: new Date().toISOString(),
    passwordHash,
    passwordSalt,
  };

  users.push(storedUser);
  writeUsers(users);
  writeSession({ userId: storedUser.id });

  return sanitiseUser(storedUser);
}

export async function loginLocalUser(
  email: string,
  password: string,
): Promise<User> {
  const users = readUsers();
  const storedUser = users.find(
    (user) => user.email.toLowerCase() === email.toLowerCase(),
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
  localStorage.removeItem(SESSION_KEY);
}

export const isLocalAuthAvailable =
  typeof window !== 'undefined' && Boolean(globalThis.crypto?.subtle);
