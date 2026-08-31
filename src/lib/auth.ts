import fs from 'fs';
import path from 'path';

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

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getAllUsers(): User[] {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    const users: User[] = JSON.parse(raw);
    const now = new Date();

    // Auto-compute expired status dynamically for users
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
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

export function saveUsers(users: User[]): void {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
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
