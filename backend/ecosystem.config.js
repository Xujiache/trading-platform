/**
 * PM2 生产环境进程管理配置
 * 使用 fork 模式运行（因为 Socket.IO 不支持 cluster 模式）
 */
module.exports = {
  apps: [
    {
      name: 'trading-platform-api',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      kill_timeout: 10000,
      listen_timeout: 8000,
    },
  ],
};
