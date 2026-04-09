import dotenv from 'dotenv';
dotenv.config();

/**
 * 应用全局配置，读取 .env 环境变量
 */
export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',

  database: {
    url: process.env.DATABASE_URL || '',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  jwt: {
    mobileSecret: process.env.JWT_MOBILE_SECRET || 'default_mobile_secret',
    adminSecret: process.env.JWT_ADMIN_SECRET || 'default_admin_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || '',
    fromName: process.env.SMTP_FROM_NAME || '寰球汇金交易所',
  },

  sms: {
    apiUrl: process.env.SMS_API_URL || '',
    apiKey: process.env.SMS_API_KEY || '',
    templateId: process.env.SMS_TEMPLATE_ID || '',
  },

  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '5242880', 10),
  },

  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
  },
} as const;
