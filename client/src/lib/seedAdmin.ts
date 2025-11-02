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
}

const USERS_KEY = 'bc_local_auth_users_v1';

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generateSalt(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
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
  
  // Check if admin already exists
  const existingAdmin = users.find(u => u.email === adminEmail);
  if (existingAdmin) {
    console.log('Admin account already exists');
    return { email: adminEmail, password: adminPassword };
  }
  
  // Create admin user
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
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  seedAdminAccount().then(creds => {
    if (creds) {
      console.log('%c🔐 Admin Account Created', 'color: #22c55e; font-weight: bold;');
      console.log('%cEmail: ' + creds.email, 'color: #3b82f6;');
      console.log('%cPassword: ' + creds.password, 'color: #3b82f6;');
      console.log('%c⚠️ Change this password in production!', 'color: #f59e0b; font-weight: bold;');
    }
  });
}