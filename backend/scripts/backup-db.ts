import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

/**
 * 数据库备份脚本
 * 使用 mysqldump 导出完整数据库到 backups 目录
 * 文件名格式: trading_db_YYYYMMDD_HHmmss.sql
 */
async function backup() {
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const now = new Date();
  const timestamp = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') + '_' +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0');

  const filename = `trading_db_${timestamp}.sql`;
  const filepath = path.join(backupDir, filename);

  const dbUrl = process.env.DATABASE_URL || '';
  const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

  if (!match) {
    console.error('Invalid DATABASE_URL format');
    process.exit(1);
  }

  const [, user, password, host, port, database] = match;

  const cmd = `mysqldump -u ${user} -p"${password}" -h ${host} -P ${port} ${database} > "${filepath}"`;

  try {
    await execAsync(cmd);
    console.log(`Backup completed: ${filepath}`);

    const files = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.sql'))
      .sort()
      .reverse();

    if (files.length > 7) {
      for (const old of files.slice(7)) {
        fs.unlinkSync(path.join(backupDir, old));
        console.log(`Deleted old backup: ${old}`);
      }
    }
  } catch (err) {
    console.error('Backup failed:', err);
    process.exit(1);
  }
}

backup();
