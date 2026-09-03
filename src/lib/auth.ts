import fs from 'fs';
import path from 'path';
import os from 'os';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  newspaperName: string;
  planType: '1-month' | '3-months' | '6-months' | '1-year' | 'custom' | 'lifetime';
  startDate: string;
  endDate: string;
  status: 'active' | 'blocked' | 'expired';
  createdAt: string;
  notes?: string;
}

const SEED_USERS: User[] = [
  {
    id: "usr-admin",
    name: "Super Admin",
    username: "admin",
    email: "admin@presscraft.com",
    password: "admin123",
    role: "admin",
    newspaperName: "PressCraft Network",
    planType: "lifetime",
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2099-12-31T23:59:59.000Z",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    notes: "Main Administrator Account"
  },
  {
    id: "usr-demo",
    name: "Alam Porle",
    username: "himachalnews",
    email: "editor@himachalnews.co",
    password: "user123",
    role: "user",
    newspaperName: "हिमाचल न्यूज़",
    planType: "1-month",
    startDate: "2026-08-31T00:00:00.000Z",
    endDate: "2026-09-15T00:00:00.000Z",
    status: "active",
    createdAt: "2026-08-31T00:00:00.000Z",
    notes: "1 Month Standard Subscription"
  }
];

// Global in-memory cache to handle serverless environments reliably
let inMemoryUsers: User[] | null = null;

function getStoragePath(): string {
  // If running in Vercel or production serverless, write to /tmp
  const isServerless = process.env.VERCEL === '1' || !!process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production';

  if (isServerless) {
    const tmpDir = path.join(os.tmpdir(), 'presscraft-data');
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      return path.join(tmpDir, 'users.json');
    } catch {
      return path.join(os.tmpdir(), 'users.json');
    }
  }

  // Local development fallback
  const localDataDir = path.join(process.cwd(), 'data');
  try {
    if (!fs.existsSync(localDataDir)) {
      fs.mkdirSync(localDataDir, { recursive: true });
    }
    return path.join(localDataDir, 'users.json');
  } catch {
    return path.join(os.tmpdir(), 'users.json');
  }
}

export function getAllUsers(): User[] {
  let users: User[] = [];
  const targetFile = getStoragePath();
  const bundledFile = path.join(process.cwd(), 'data', 'users.json');

  // 1. Try reading from target storage file
  if (fs.existsSync(targetFile)) {
    try {
      const raw = fs.readFileSync(targetFile, 'utf-8');
      users = JSON.parse(raw);
    } catch (err) {
      console.warn('Error reading storage file, falling back:', err);
    }
  }

  // 2. If storage is empty, try reading bundled seed file
  if (!users || users.length === 0) {
    if (fs.existsSync(bundledFile)) {
      try {
        const raw = fs.readFileSync(bundledFile, 'utf-8');
        users = JSON.parse(raw);
        // Attempt to copy bundled users into writable targetFile
        try {
          fs.writeFileSync(targetFile, JSON.stringify(users, null, 2), 'utf-8');
        } catch {
          // Ignore write failure on readonly system
        }
      } catch (err) {
        console.warn('Error reading bundled seed file:', err);
      }
    }
  }

  // 3. Fallback to in-memory cache or default seeds
  if (!users || users.length === 0) {
    users = inMemoryUsers && inMemoryUsers.length > 0 ? inMemoryUsers : [...SEED_USERS];
  }

  inMemoryUsers = users;

  const now = new Date();
  return users.map((user) => {
    if (user.role === 'admin') return user;

    const end = new Date(user.endDate);
    if (user.status === 'blocked') {
      return user; // Manually blocked by admin
    }
    if (end < now) {
      return { ...user, status: 'expired' }; // Automatically expired
    }
    return { ...user, status: 'active' };
  });
}

export function saveUsers(users: User[]): void {
  inMemoryUsers = users;
  const targetFile = getStoragePath();
  try {
    const parentDir = path.dirname(targetFile);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(targetFile, JSON.stringify(users, null, 2), 'utf-8');
  } catch (error) {
    console.warn('Could not write users to disk, using in-memory state:', error);
  }
}

export function findUserById(id: string): User | null {
  const users = getAllUsers();
  return users.find((u) => u.id === id) || null;
}

export function findUserByCredentials(usernameOrEmail: string): User | null {
  const users = getAllUsers();
  const lower = usernameOrEmail.trim().toLowerCase();
  return users.find(
    (u) => u.username.toLowerCase() === lower || u.email.toLowerCase() === lower
  ) || null;
}

export function calculateEndDate(startDate: Date, planType: string, customMonths: number = 1): Date {
  const d = new Date(startDate);
  switch (planType) {
    case '1-month':
      d.setMonth(d.getMonth() + 1);
      break;
    case '3-months':
      d.setMonth(d.getMonth() + 3);
      break;
    case '6-months':
      d.setMonth(d.getMonth() + 6);
      break;
    case '1-year':
      d.setFullYear(d.getFullYear() + 1);
      break;
    case 'custom':
      d.setMonth(d.getMonth() + customMonths);
      break;
    case 'lifetime':
      d.setFullYear(d.getFullYear() + 70);
      break;
    default:
      d.setMonth(d.getMonth() + 1);
  }
  return d;
}
