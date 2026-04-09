import { config } from '../config';

interface SmsResult {
  success: boolean;
  message: string;
}

/**
 * 发送短信验证码（国阳云 API）
 * @param phone - 手机号
 * @param code - 验证码
 * @returns 发送结果
 */
export async function sendSmsCode(phone: string, code: string): Promise<SmsResult> {
  const { apiUrl, apiKey, templateId } = config.sms;

  if (!apiUrl || !apiKey) {
    console.warn('[SMS] SMS 配置未设置，验证码:', code);
    return { success: true, message: '开发模式：验证码已打印到控制台' };
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
        templateId,
        phone,
        params: { code },
      }),
    });

    const result = await response.json() as { code: number; message: string };

    if (result.code === 0) {
      return { success: true, message: '发送成功' };
    }

    return { success: false, message: result.message || '发送失败' };
  } catch (error) {
    console.error('[SMS] 发送失败:', error);
    return { success: false, message: '短信服务异常' };
  }
}
