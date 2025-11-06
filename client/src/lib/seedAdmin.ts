import { User } from '@/types';
import { isLocalAuthAvailable } from './localAuth';

const USERS_KEY = 'bc_local_auth_users_v1';
const ADMIN_EMAIL = 'admin@builder.contractors';
const ADMIN_EMAIL_NORMALISED = ADMIN_EMAIL.toLowerCase();
const ADMIN_PASSWORD = 'BuilderAdmin2025!';

type StoredLocalUser = Omit<User, 'createdAt'> & {
  createdAt: string;
  passwordHash: string;
  passwordSalt: string;
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

export async function seedAdminAccount() {
  if (!isLocalAuthAvailable) {
    console.error('Local authentication not available');
    return null;
  }

  const users = readUsers();
  const existingAdminIndex = users.findIndex(
    (user) => user.email.toLowerCase() === ADMIN_EMAIL_NORMALISED,
  );

  if (existingAdminIndex >= 0) {
    // Update existing admin to ensure it's approved and has correct password
    const passwordSalt = generateSalt();
    const passwordHash = await hashPassword(ADMIN_PASSWORD, passwordSalt);
    
    users[existingAdminIndex] = {
      ...users[existingAdminIndex],
      approved: true,
      role: 'admin',
      passwordSalt,
      passwordHash,
    };
    
    writeUsers(users);
    console.log('Admin account updated with corrected password hash');
    return { email: ADMIN_EMAIL, password: ADMIN_PASSWORD };
  }

  // Create new admin user
  const passwordSalt = generateSalt();
  const passwordHash = await hashPassword(ADMIN_PASSWORD, passwordSalt);
  const adminUser: StoredLocalUser = {
    id: `local_admin_${globalThis.crypto.randomUUID()}`,
    email: ADMIN_EMAIL,
    role: 'admin',
    approved: true,
    createdAt: new Date().toISOString(),
    passwordHash,
    passwordSalt,
  };

  const nextUsers: StoredLocalUser[] = [...users, adminUser];
  writeUsers(nextUsers);

  console.log('Admin account created successfully');
  return { email: ADMIN_EMAIL, password: ADMIN_PASSWORD };
}

// Auto-seed admin account on first load
if (typeof window !== 'undefined') {
  // Check if we should seed (no users exist or no admin exists)
  const shouldSeedAdmin = () => {
    const users = readUsers();
    const adminExists = users.some(
      user => user.email.toLowerCase() === ADMIN_EMAIL_NORMALISED && user.role === 'admin'
    );
    return users.length === 0 || !adminExists;
  };
  
  // Seed admin if needed
  if (shouldSeedAdmin()) {
    seedAdminAccount().then((creds) => {
      if (creds) {
        console.log('%c🔐 Admin Account Ready', 'color: #22c55e; font-weight: bold;');
        console.log('%cEmail: ' + creds.email, 'color: #3b82f6;');
        console.log('%cPassword: ' + creds.password, 'color: #3b82f6;');
        console.log('%c⚠️ Change this password in production!', 'color: #f59e0b; font-weight: bold;');
      }
    });
  }
}