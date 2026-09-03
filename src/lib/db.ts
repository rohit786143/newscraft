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

/**
 * Ensures the `user_designs` table exists in MySQL
 */
export async function ensureTableExists(): Promise<void> {
  if (tableInitialized) return;

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS user_designs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(100) NOT NULL UNIQUE,
      design_data LONGTEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await pool.query(createTableQuery);
    tableInitialized = true;
  } catch (error) {
    console.warn('MySQL table initialization warning:', error);
  }
}

export default pool;
