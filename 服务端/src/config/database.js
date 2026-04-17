const mysql = require('mysql2/promise');
const config = require('./index');

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: config.db.poolMax,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  charset: 'utf8mb4',
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('[MySQL] 数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('[MySQL] 数据库连接失败:', error.message);
    return false;
  }
}

async function query(sql, params) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function getConnection() {
  return pool.getConnection();
}

module.exports = { pool, query, getConnection, testConnection };
