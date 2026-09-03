import mysql from 'mysql2/promise';

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
    console.warn('MySQL table initialization warning:', error);
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
    return rows || [];
  } catch (err) {
    console.error('Error fetching user devices:', err);
    return [];
  }
}

/**
 * Check if a device is registered and approved for a user
 */
export async function isDeviceRegistered(userId: string, deviceId: string): Promise<boolean> {
  await ensureTableExists();
  try {
    const [rows]: any = await pool.execute(
      'SELECT id FROM user_devices WHERE user_id = ? AND device_id = ? LIMIT 1',
      [String(userId), String(deviceId)]
    );
    return Boolean(rows && rows.length > 0);
  } catch (err) {
    console.error('Error verifying device registration:', err);
    return false;
  }
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
  try {
    const query = `
      INSERT INTO user_devices (user_id, device_id, device_name)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        device_name = VALUES(device_name)
    `;
    await pool.execute(query, [String(userId), String(deviceId), String(deviceName)]);

    const [rows]: any = await pool.execute(
      'SELECT id, user_id, device_id, device_name, created_at FROM user_devices WHERE user_id = ? AND device_id = ? LIMIT 1',
      [String(userId), String(deviceId)]
    );
    return rows && rows[0] ? rows[0] : null;
  } catch (err) {
    console.error('Error adding user device:', err);
    throw err;
  }
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
    return (result?.affectedRows || 0) > 0;
  } catch (err) {
    console.error('Error removing user device:', err);
    return false;
  }
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
    return (result?.affectedRows || 0) > 0;
  } catch (err) {
    console.error('Error removing device by ID:', err);
    return false;
  }
}

export default pool;
