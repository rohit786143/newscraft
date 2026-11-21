import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Connection pool configured for Hostinger MySQL & production environments
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'presscraft_db',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

let tableInitialized = false;

export interface UserDevice {
  id: number;
  user_id: string;
  device_id: string;
  device_name: string;
  created_at: string;
}

function getDevicesJsonPath(): string {
  const localDataDir = path.join(process.cwd(), 'data');
  try {
    if (!fs.existsSync(localDataDir)) {
      fs.mkdirSync(localDataDir, { recursive: true });
    }
    return path.join(localDataDir, 'devices.json');
  } catch {
    return path.join(os.tmpdir(), 'devices.json');
  }
}

function getDesignsJsonPath(): string {
  const localDataDir = path.join(process.cwd(), 'data');
  try {
    if (!fs.existsSync(localDataDir)) {
      fs.mkdirSync(localDataDir, { recursive: true });
    }
    return path.join(localDataDir, 'designs.json');
  } catch {
    return path.join(os.tmpdir(), 'designs.json');
  }
}

function readJsonDevices(): UserDevice[] {
  try {
    const p = getDevicesJsonPath();
    if (fs.existsSync(p)) {
      const parsed: UserDevice[] = JSON.parse(fs.readFileSync(p, 'utf-8'));
      if (!Array.isArray(parsed)) return [];
      // Purge any legacy auto-registered devices ('Primary Workstation') that were not approved by Admin
      const valid = parsed.filter((d) => d && d.device_name !== 'Primary Workstation');
      if (valid.length !== parsed.length) {
        try {
          fs.writeFileSync(p, JSON.stringify(valid, null, 2), 'utf-8');
        } catch {
          // Ignore write errors
        }
      }
      return valid;
    }
  } catch {
    // Ignore read errors
  }
  return [];
}

function writeJsonDevices(devices: UserDevice[]): void {
  try {
    const p = getDevicesJsonPath();
    fs.writeFileSync(p, JSON.stringify(devices, null, 2), 'utf-8');
  } catch {
    // Ignore write errors
  }
}

export function saveUserDesignJson(userId: string, designData: any): void {
  try {
    const p = getDesignsJsonPath();
    let map: Record<string, any> = {};
    if (fs.existsSync(p)) {
      map = JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
    map[String(userId)] = {
      design_data: designData,
      updated_at: new Date().toISOString(),
    };
    fs.writeFileSync(p, JSON.stringify(map, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Error writing designs fallback JSON:', err);
  }
}

export function getUserDesignJson(userId: string): { design_data: any; updated_at: string } | null {
  try {
    const p = getDesignsJsonPath();
    if (fs.existsSync(p)) {
      const map: Record<string, any> = JSON.parse(fs.readFileSync(p, 'utf-8'));
      return map[String(userId)] || null;
    }
  } catch {
    // Ignore
  }
  return null;
}

/**
 * Ensures the `user_designs` and `user_devices` tables exist in MySQL
 */
export async function ensureTableExists(): Promise<void> {
  if (tableInitialized) return;

  const createUserDesignsTable = `
    CREATE TABLE IF NOT EXISTS user_designs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(100) NOT NULL UNIQUE,
      design_data LONGTEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const createUserDevicesTable = `
    CREATE TABLE IF NOT EXISTS user_devices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(100) NOT NULL,
      device_id VARCHAR(100) NOT NULL,
      device_name VARCHAR(100) DEFAULT 'Workstation',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user_device (user_id, device_id),
      INDEX idx_user_id (user_id),
      INDEX idx_device_id (device_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await pool.query(createUserDesignsTable);
    await pool.query(createUserDevicesTable);
    tableInitialized = true;
  } catch (error) {
    // MySQL not reachable locally, will fallback to file storage
  }
}

/**
 * Fetch all registered devices across all users
 */
export async function getAllDevices(): Promise<UserDevice[]> {
  await ensureTableExists();
  try {
    const [rows]: any = await pool.execute(
      'SELECT id, user_id, device_id, device_name, created_at FROM user_devices ORDER BY created_at DESC'
    );
    return Array.isArray(rows) ? rows : [];
  } catch (err) {
    // Fallback to JSON when MySQL is unavailable
    return readJsonDevices();
  }
}

/**
 * Fetch all registered devices for a user
 */
export async function getUserDevices(userId: string): Promise<UserDevice[]> {
  await ensureTableExists();
  try {
    const [rows]: any = await pool.execute(
      'SELECT id, user_id, device_id, device_name, created_at FROM user_devices WHERE user_id = ? ORDER BY created_at DESC',
      [String(userId)]
    );
    return Array.isArray(rows) ? rows : [];
  } catch (err) {
    // Fallback to JSON when MySQL is unavailable
  }

  const all = readJsonDevices();
  return all.filter((d) => String(d.user_id) === String(userId));
}

/**
 * Check if a device is explicitly registered and approved by Admin for a user.
 * NEVER auto-registers a device — Admin must explicitly register the Device ID in Admin Portal.
 */
export async function isDeviceRegistered(userId: string, deviceId: string): Promise<boolean> {
  const cleanDevId = String(deviceId || '').trim().toUpperCase();
  if (!userId || !cleanDevId) return false;

  await ensureTableExists();
  try {
    const [rows]: any = await pool.execute(
      'SELECT id FROM user_devices WHERE user_id = ? AND UPPER(TRIM(device_id)) = ? LIMIT 1',
      [String(userId), cleanDevId]
    );
    return Boolean(rows && rows.length > 0);
  } catch (err) {
    // Fallback to JSON only when MySQL is unreachable
  }

  const all = readJsonDevices();
  return all.some(
    (d) =>
      String(d.user_id) === String(userId) &&
      String(d.device_id || '').trim().toUpperCase() === cleanDevId
  );
}

/**
 * Bind / register a new device to a user
 */
export async function addUserDevice(
  userId: string,
  deviceId: string,
  deviceName: string = 'Workstation'
): Promise<UserDevice | null> {
  await ensureTableExists();
  const cleanDevId = String(deviceId).trim().toUpperCase();

  try {
    const query = `
      INSERT INTO user_devices (user_id, device_id, device_name)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        device_name = VALUES(device_name)
    `;
    await pool.execute(query, [String(userId), cleanDevId, String(deviceName)]);

    const [rows]: any = await pool.execute(
      'SELECT id, user_id, device_id, device_name, created_at FROM user_devices WHERE user_id = ? AND device_id = ? LIMIT 1',
      [String(userId), cleanDevId]
    );
    if (rows && rows[0]) return rows[0];
  } catch (err) {
    // Fallback to JSON
  }

  const all = readJsonDevices();
  const existingIndex = all.findIndex(
    (d) => String(d.user_id) === String(userId) && d.device_id.toUpperCase() === cleanDevId
  );

  const deviceObj: UserDevice = {
    id: existingIndex >= 0 ? all[existingIndex].id : Date.now(),
    user_id: String(userId),
    device_id: cleanDevId,
    device_name: String(deviceName),
    created_at: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    all[existingIndex] = deviceObj;
  } else {
    all.push(deviceObj);
  }
  writeJsonDevices(all);
  return deviceObj;
}

/**
 * Remove / revoke access for a specific device
 */
export async function removeUserDevice(userId: string, deviceId: string): Promise<boolean> {
  await ensureTableExists();
  try {
    const [result]: any = await pool.execute(
      'DELETE FROM user_devices WHERE user_id = ? AND device_id = ?',
      [String(userId), String(deviceId)]
    );
    if ((result?.affectedRows || 0) > 0) return true;
  } catch (err) {
    // Fallback to JSON
  }

  const all = readJsonDevices();
  const filtered = all.filter(
    (d) => !(String(d.user_id) === String(userId) && d.device_id.toUpperCase() === String(deviceId).toUpperCase())
  );
  writeJsonDevices(filtered);
  return true;
}

/**
 * Remove device by record ID
 */
export async function removeUserDeviceById(id: number, userId?: string): Promise<boolean> {
  await ensureTableExists();
  try {
    let query = 'DELETE FROM user_devices WHERE id = ?';
    const params: any[] = [id];
    if (userId) {
      query += ' AND user_id = ?';
      params.push(String(userId));
    }
    const [result]: any = await pool.execute(query, params);
    if ((result?.affectedRows || 0) > 0) return true;
  } catch (err) {
    // Fallback to JSON
  }

  const all = readJsonDevices();
  const filtered = all.filter((d) => d.id !== id);
  writeJsonDevices(filtered);
  return true;
}

export default pool;
