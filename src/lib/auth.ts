import fs from 'fs';
import path from 'path';
import os from 'os';
import pool, { ensureTableExists } from '@/lib/db';

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
    email: "rohitsagarksg@gmail.com",
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

let inMemoryUsers: User[] | null = null;

function normalizeUserStatus(user: User): User {
  if (user.role === 'admin') return user;
  if (user.status === 'blocked') return user;
  const end = new Date(user.endDate);
  if (end < new Date()) {
    return { ...user, status: 'expired' };
  }
  return { ...user, status: 'active' };
}

function mapDbRowToUser(row: any): User {
  return normalizeUserStatus({
    id: String(row.id),
    name: String(row.name || ''),
    username: String(row.username || ''),
    email: String(row.email || ''),
    password: String(row.password || ''),
    role: row.role === 'admin' ? 'admin' : 'user',
    newspaperName: String(row.newspaper_name || 'दैनिक समाचार'),
    planType: (row.plan_type || '1-month') as User['planType'],
    startDate: String(row.start_date || new Date().toISOString()),
    endDate: String(row.end_date || new Date().toISOString()),
    status: (row.status || 'active') as User['status'],
    createdAt: String(row.created_at || new Date().toISOString()),
    notes: row.notes || ''
  });
}

function getStoragePath(): string {
  // Always prefer persistent project data/ directory; only fall back to /tmp on read-only serverless (Vercel/Lambda)
  const isReadOnlyServerless = process.env.VERCEL === '1' || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (!isReadOnlyServerless) {
    const localDataDir = path.join(process.cwd(), 'data');
    try {
      if (!fs.existsSync(localDataDir)) {
        fs.mkdirSync(localDataDir, { recursive: true });
      }
      return path.join(localDataDir, 'users.json');
    } catch {
      // Fall through to tmpdir if read-only
    }
  }

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

function readLocalUsersFile(): User[] {
  let users: User[] = [];
  const targetFile = getStoragePath();
  const bundledFile = path.join(process.cwd(), 'data', 'users.json');

  if (fs.existsSync(targetFile)) {
    try {
      users = JSON.parse(fs.readFileSync(targetFile, 'utf-8'));
    } catch {
      // Ignore
    }
  }

  if ((!users || users.length === 0) && bundledFile !== targetFile && fs.existsSync(bundledFile)) {
    try {
      users = JSON.parse(fs.readFileSync(bundledFile, 'utf-8'));
    } catch {
      // Ignore
    }
  }

  if (!users || users.length === 0) {
    users = inMemoryUsers && inMemoryUsers.length > 0 ? inMemoryUsers : [...SEED_USERS];
  }

  inMemoryUsers = users;
  return users.map(normalizeUserStatus);
}

function writeLocalUsersFile(users: User[]): void {
  inMemoryUsers = users;
  const targetFile = getStoragePath();
  try {
    const parentDir = path.dirname(targetFile);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(targetFile, JSON.stringify(users, null, 2), 'utf-8');
  } catch (error) {
    console.warn('Could not write users to local JSON:', error);
  }
}

async function seedUsersIntoMySQLIfEmpty(): Promise<void> {
  const [countRows]: any = await pool.execute('SELECT COUNT(*) AS cnt FROM presscraft_users');
  const count = Number(countRows?.[0]?.cnt || 0);
  if (count > 0) return;

  const initialUsers = readLocalUsersFile();
  for (const u of initialUsers) {
    await pool.execute(
      `INSERT IGNORE INTO presscraft_users
       (id, name, username, email, password, role, newspaper_name, plan_type, start_date, end_date, status, created_at, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        u.id, u.name, u.username, u.email, u.password, u.role,
        u.newspaperName || 'दैनिक समाचार', u.planType || '1-month',
        u.startDate, u.endDate, u.status || 'active', u.createdAt || new Date().toISOString(),
        u.notes || ''
      ]
    );
  }
}

/**
 * Primary async MySQL-backed user reader (permanent across deploys & restarts),
 * with automatic fallback to local data/users.json when MySQL is unavailable locally.
 */
export async function getAllUsersAsync(): Promise<User[]> {
  try {
    await ensureTableExists();
    await seedUsersIntoMySQLIfEmpty();
    const [rows]: any = await pool.execute(
      'SELECT id, name, username, email, password, role, newspaper_name, plan_type, start_date, end_date, status, created_at, notes FROM presscraft_users ORDER BY created_at ASC'
    );
    if (Array.isArray(rows) && rows.length > 0) {
      const mapped = rows.map(mapDbRowToUser);
      inMemoryUsers = mapped;
      return mapped;
    }
  } catch {
    // Fallback to local JSON file when MySQL is unreachable
  }
  return readLocalUsersFile();
}

export async function findUserByIdAsync(id: string): Promise<User | null> {
  const users = await getAllUsersAsync();
  return users.find((u) => u.id === id) || null;
}

export async function findUserByCredentialsAsync(usernameOrEmail: string): Promise<User | null> {
  const users = await getAllUsersAsync();
  const lower = usernameOrEmail.trim().toLowerCase();
  return (
    users.find(
      (u) =>
        u.username.toLowerCase() === lower ||
        u.email.toLowerCase() === lower ||
        (u.id === 'usr-admin' && (lower === 'admin' || lower === 'rohitsagarksg@gmail.com' || lower === 'admin@presscraft.com'))
    ) || null
  );
}

export async function upsertUserAsync(user: User): Promise<void> {
  // 1. Persist permanently in MySQL presscraft_users
  try {
    await ensureTableExists();
    await seedUsersIntoMySQLIfEmpty();
    await pool.execute(
      `INSERT INTO presscraft_users
       (id, name, username, email, password, role, newspaper_name, plan_type, start_date, end_date, status, created_at, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         username = VALUES(username),
         email = VALUES(email),
         password = VALUES(password),
         role = VALUES(role),
         newspaper_name = VALUES(newspaper_name),
         plan_type = VALUES(plan_type),
         start_date = VALUES(start_date),
         end_date = VALUES(end_date),
         status = VALUES(status),
         notes = VALUES(notes)`,
      [
        user.id, user.name, user.username, user.email, user.password, user.role,
        user.newspaperName || 'दैनिक समाचार', user.planType || '1-month',
        user.startDate, user.endDate, user.status || 'active',
        user.createdAt || new Date().toISOString(), user.notes || ''
      ]
    );
  } catch (err) {
    console.warn('MySQL unavailable, persisting user to local JSON fallback:', err);
  }

  // 2. Also keep local JSON fallback in sync
  const local = readLocalUsersFile();
  const idx = local.findIndex((u) => u.id === user.id);
  if (idx >= 0) {
    local[idx] = user;
  } else {
    local.push(user);
  }
  writeLocalUsersFile(local);
}

export async function deleteUserAsync(id: string): Promise<void> {
  try {
    await ensureTableExists();
    await pool.execute('DELETE FROM presscraft_users WHERE id = ?', [String(id)]);
  } catch (err) {
    console.warn('MySQL unavailable during deleteUser, updating local JSON fallback:', err);
  }

  const local = readLocalUsersFile().filter((u) => u.id !== id);
  writeLocalUsersFile(local);
}

// Synchronous legacy exports (kept for backwards compatibility)
export function getAllUsers(): User[] {
  return readLocalUsersFile();
}

export function saveUsers(users: User[]): void {
  writeLocalUsersFile(users);
}

export function findUserById(id: string): User | null {
  return readLocalUsersFile().find((u) => u.id === id) || null;
}

export function findUserByCredentials(usernameOrEmail: string): User | null {
  const users = readLocalUsersFile();
  const lower = usernameOrEmail.trim().toLowerCase();
  return (
    users.find(
      (u) =>
        u.username.toLowerCase() === lower ||
        u.email.toLowerCase() === lower ||
        (u.id === 'usr-admin' && (lower === 'admin' || lower === 'rohitsagarksg@gmail.com' || lower === 'admin@presscraft.com'))
    ) || null
  );
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
