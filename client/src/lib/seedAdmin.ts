import { User } from '@/types';
import { isLocalAuthAvailable } from './localAuth';

interface StoredLocalUser {
  id: string;
  email: string;
  role: User['role'];
  approved: boolean;
  createdAt: string;
  passwordHash: string;
  passwordSalt: string;
  country?: string;
  region?: string;
}

const USERS_KEY = 'bc_local_auth_users_v1';

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

export async function seedAdminAccount() {
  if (!isLocalAuthAvailable) {
    console.error('Local authentication not available');
    return null;
  }

  // Admin credentials for testing
  const adminEmail = 'admin@builder.contractors';
  const adminPassword = 'BuilderAdmin2025!';
  
  // Read existing users
  const raw = localStorage.getItem(USERS_KEY);
  const users: StoredLocalUser[] = raw ? JSON.parse(raw) : [];
  
  // Check if admin already exists and update if needed
  const existingAdminIndex = users.findIndex(u => u.email === adminEmail);
  if (existingAdminIndex >= 0) {
    // Re-hash password with correct algorithm
    const passwordSalt = generateSalt();
    const passwordHash = await hashPassword(adminPassword, passwordSalt);
    
    users[existingAdminIndex].approved = true;
    users[existingAdminIndex].role = 'admin';
    users[existingAdminIndex].passwordSalt = passwordSalt;
    users[existingAdminIndex].passwordHash = passwordHash;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    console.log('Admin account updated with corrected password hash');
    return { email: adminEmail, password: adminPassword };
  }
  
  // Create admin user with correct hashing algorithm
  const passwordSalt = generateSalt();
  const passwordHash = await hashPassword(adminPassword, passwordSalt);
  const adminUser: StoredLocalUser = {
    id: `local_admin_${crypto.randomUUID()}`,
    email: adminEmail,
    role: 'admin',
    approved: true, // Admins are auto-approved
    createdAt: new Date().toISOString(),
    passwordHash,
    passwordSalt,
  };
  
  // Add to users and save
  users.push(adminUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  
  console.log('Admin account created successfully');
  return { email: adminEmail, password: adminPassword };
}

// Auto-seed admin in development
if (typeof window !== 'undefined') {
  seedAdminAccount().then(creds => {
    if (creds) {
      console.log('%c🔐 Admin Account Ready', 'color: #22c55e; font-weight: bold;');
      console.log('%cEmail: ' + creds.email, 'color: #3b82f6;');
      console.log('%cPassword: ' + creds.password, 'color: #3b82f6;');
      console.log('%c⚠️ Change this password in production!', 'color: #f59e0b; font-weight: bold;');
    }
  });
}