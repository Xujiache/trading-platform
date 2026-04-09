import nodemailer from 'nodemailer';
import { config } from '../config';

/**
 * 创建邮件发送器（nodemailer + SMTP）
 */
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.password,
  },
});

/**
 * 发送邮件
 * @param to - 收件人邮箱
 * @param subject - 邮件主题
 * @param html - 邮件 HTML 内容
 */
export async function sendEmail(to: string, subject: string, html: string) {
  if (!config.smtp.host || !config.smtp.user) {
    console.log(`[Email] SMTP not configured, skipping: ${subject} -> ${to}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"${config.smtp.fromName}" <${config.smtp.from}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent: ${subject} -> ${to}`);
  } catch (err) {
    console.error('[Email] Failed:', err);
  }
}
