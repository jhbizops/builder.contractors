import { generateSalt, hashPassword } from './authCrypto';
import {
  getStoredLocalUsers,
  isLocalAuthAvailable,
  persistStoredLocalUsers,
  type StoredLocalUser,
} from './localAuth';

const ADMIN_EMAIL = 'admin@builder.contractors';
const ADMIN_EMAIL_NORMALISED = ADMIN_EMAIL.toLowerCase();
const ADMIN_PASSWORD = 'BuilderAdmin2025!';

export async function seedAdminAccount() {
  if (!isLocalAuthAvailable) {
    console.error('Local authentication not available');
    return null;
  }

  const users = getStoredLocalUsers();
  const existingAdmin = users.find(
    (user) => user.email.toLowerCase() === ADMIN_EMAIL_NORMALISED,
  );

  if (existingAdmin) {
    console.log('Admin account already exists');
    return { email: ADMIN_EMAIL, password: ADMIN_PASSWORD };
  }

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
  persistStoredLocalUsers(nextUsers);

  console.log('Admin account created successfully');
  return { email: ADMIN_EMAIL, password: ADMIN_PASSWORD };
}

// Auto-seed admin in development
if (
  typeof window !== 'undefined' &&
  window.location.hostname === 'localhost' &&
  import.meta.env.DEV
) {
  seedAdminAccount().then((creds) => {
    if (creds) {
      console.log('%c🔐 Admin Account Created', 'color: #22c55e; font-weight: bold;');
      console.log('%cEmail: ' + creds.email, 'color: #3b82f6;');
      console.log('%cPassword: ' + creds.password, 'color: #3b82f6;');
      console.log('%c⚠️ Change this password in production!', 'color: #f59e0b; font-weight: bold;');
    }
  });
}
