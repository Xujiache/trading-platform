const nodemailer = require('nodemailer');
const config = require('../config');
const { redis } = require('../config/redis');

class EmailService {
  getTransporter(smtpConfig = null) {
    const cfg = smtpConfig || config.smtp;
    return nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: {
        user: cfg.user,
        pass: cfg.pass,
      },
    });
  }

  generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  async sendVerificationCode(email, businessType = 'register') {
    const intervalKey = `code_interval:${businessType}:${email}`;
    const exists = await redis.get(intervalKey);
    if (exists) {
      throw new Error('发送太频繁，请稍后再试');
    }

    const code = this.generateCode();
    const codeKey = `code:${businessType}:${email}`;
    await redis.setex(codeKey, config.code.expireMinutes * 60, code);
    await redis.setex(intervalKey, config.code.sendIntervalSeconds, '1');

    const subjects = {
      register: '注册验证码',
      reset_password: '重置密码验证码',
    };

    const subject = subjects[businessType] || '验证码';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #F0F2F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F0F2F5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                <tr>
                  <td style="background-color: #2563EB; padding: 30px 40px; text-align: center;">
                    <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px;">${config.smtp.fromName}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px; color: #334155; font-size: 16px; line-height: 1.5;">尊敬的用户，您好：</p>
                    <p style="margin: 0 0 30px; color: #475569; font-size: 15px; line-height: 1.6;">您正在进行${subject}操作。您的验证码为：</p>
                    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 30px;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 700; color: #2563EB; letter-spacing: 8px;">${code}</span>
                    </div>
                    <p style="margin: 0 0 10px; color: #64748B; font-size: 14px; line-height: 1.5;">该验证码在 <strong style="color: #0F172A;">${config.code.expireMinutes} 分钟</strong> 内有效。</p>
                    <p style="margin: 0; color: #EF4444; font-size: 14px; line-height: 1.5;">⚠️ 请勿将此验证码转发或泄露给任何人，以防账户被盗。</p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #F8FAFC; padding: 24px 40px; text-align: center; border-top: 1px solid #F1F5F9;">
                    <p style="margin: 0; color: #94A3B8; font-size: 12px; line-height: 1.5;">此邮件由系统自动发送，请勿直接回复。</p>
                    <p style="margin: 8px 0 0; color: #94A3B8; font-size: 12px; line-height: 1.5;">&copy; ${new Date().getFullYear()} ${config.smtp.fromName}. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    try {
      const transporter = this.getTransporter();
      await transporter.sendMail({
        from: `"${config.smtp.fromName}" <${config.smtp.fromAddress}>`,
        to: email,
        subject: `【${config.smtp.fromName}】${subject}`,
        html,
      });
    } catch (error) {
      console.error('[Email] 发送失败:', error.message);
      // 开发环境下即使发送失败也不抛错，打印验证码供测试
      if (config.nodeEnv === 'development') {
        console.log(`[Email] 开发模式验证码: ${email} -> ${code}`);
        return;
      }
      throw new Error('邮件发送失败，请稍后重试');
    }
  }

  async verifyCode(email, code, businessType = 'register') {
    const codeKey = `code:${businessType}:${email}`;
    const stored = await redis.get(codeKey);
    if (!stored) {
      return false;
    }
    if (stored !== code) {
      return false;
    }
    await redis.del(codeKey);
    return true;
  }

  async sendTestEmail(to, smtpConfig) {
    const transporter = this.getTransporter({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #F0F2F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F0F2F5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                <tr>
                  <td style="background-color: #2563EB; padding: 30px 40px; text-align: center;">
                    <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px;">${smtpConfig.fromName || '交易系统'}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px; color: #334155; font-size: 16px; line-height: 1.5;">尊敬的管理员，您好：</p>
                    <p style="margin: 0 0 30px; color: #475569; font-size: 15px; line-height: 1.6;">这是一封测试邮件，用于验证 SMTP 服务器配置是否正确。</p>
                    <div style="background-color: #ECFDF5; border: 1px solid #10B981; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 30px;">
                      <span style="font-size: 18px; font-weight: 600; color: #059669;">✅ 配置测试成功</span>
                    </div>
                    <p style="margin: 0; color: #64748B; font-size: 14px; line-height: 1.5;">如果您收到了这封邮件，说明您的邮箱发送功能已正常工作。</p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #F8FAFC; padding: 24px 40px; text-align: center; border-top: 1px solid #F1F5F9;">
                    <p style="margin: 0; color: #94A3B8; font-size: 12px; line-height: 1.5;">此邮件由系统自动发送，请勿直接回复。</p>
                    <p style="margin: 8px 0 0; color: #94A3B8; font-size: 12px; line-height: 1.5;">&copy; ${new Date().getFullYear()} ${smtpConfig.fromName || '交易系统'}. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"${smtpConfig.fromName || '交易系统'}" <${smtpConfig.fromAddress || smtpConfig.user}>`,
      to,
      subject: '【交易系统】邮箱配置测试',
      html,
    });
  }
}

module.exports = new EmailService();
