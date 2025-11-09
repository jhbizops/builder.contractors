import { USERS_KEY, USERS_BACKUP_KEY, isLocalAuthAvailable } from './localAuth';
import type { StoredLocalUser } from './localAuth';
const ADMIN_EMAIL = 'admin@builder.contractors';
const ADMIN_EMAIL_NORMALISED = ADMIN_EMAIL.toLowerCase();
const ADMIN_PASSWORD = 'BuilderAdmin2025!';

const USERS_CORRUPT_KEY = `${USERS_KEY}__corrupted`;

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

function cloneUsers(users: StoredLocalUser[]): StoredLocalUser[] {
  return users.map((user) => ({ ...user }));
}

function parseUsers(raw: string | null): StoredLocalUser[] | null {
  if (raw === null) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredLocalUser[];
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.warn('Failed to parse stored users snapshot', error);
  }

  return null;
}

function readUsers(): StoredLocalUser[] {
  const primaryRaw = localStorage.getItem(USERS_KEY);
  const primaryParsed = parseUsers(primaryRaw);

  if (primaryParsed) {
    return cloneUsers(primaryParsed);
  }

  if (primaryRaw !== null) {
    localStorage.setItem(USERS_CORRUPT_KEY, primaryRaw);
    console.warn('Primary local auth store is corrupt; attempting to restore from backup.');
  }

  const backupRaw = localStorage.getItem(USERS_BACKUP_KEY);
  const backupParsed = parseUsers(backupRaw);

  if (backupParsed) {
    const payload = JSON.stringify(backupParsed);
    localStorage.setItem(USERS_KEY, payload);
    localStorage.setItem(USERS_BACKUP_KEY, payload);
    localStorage.removeItem(USERS_CORRUPT_KEY);
    return cloneUsers(backupParsed);
  }

  if (backupRaw !== null) {
    localStorage.setItem(USERS_CORRUPT_KEY, backupRaw);
    console.error('Failed to restore local auth users from backup; starting with an empty set.');
  }

  return [];
}

function writeUsers(users: StoredLocalUser[]) {
  const payload = JSON.stringify(cloneUsers(users));
  localStorage.setItem(USERS_KEY, payload);
  localStorage.setItem(USERS_BACKUP_KEY, payload);
  localStorage.removeItem(USERS_CORRUPT_KEY);
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
    const adminUser = users[existingAdminIndex];
    const needsUpdate =
      adminUser.role !== 'admin' ||
      adminUser.approved !== true ||
      !adminUser.passwordSalt ||
      !adminUser.passwordHash;

    if (needsUpdate) {
      const passwordSalt = generateSalt();
      const passwordHash = await hashPassword(ADMIN_PASSWORD, passwordSalt);

      users[existingAdminIndex] = {
        ...adminUser,
        approved: true,
        role: 'admin',
        passwordSalt,
        passwordHash,
      };

      writeUsers(users);
      console.log('Admin account updated with corrected password hash');
    } else {
      console.log('Admin account already configured; reusing existing credentials');
    }

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