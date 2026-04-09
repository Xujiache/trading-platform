/**
 * PM2 生产环境进程管理配置
 * 集群模式运行，自动重启，日志管理
 */
module.exports = {
  apps: [
    {
      name: 'trading-api',
      script: 'dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
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
