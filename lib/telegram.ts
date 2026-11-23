// Telegram-бот: заявки вам в личку и вход на сайт. Настройки — в переменных окружения
// или в админке (/admin → Telegram), чтобы не заходить на сервер.
import { query } from './db';

export interface TelegramConfig { token: string; username: string; chatId: string }

export async function getTelegramConfig(): Promise<TelegramConfig> {
  let db: Record<string, string> = {};
  try {
    const rows = await query<{ key: string; value: string | null }>(
      "select key, value #>> '{}' as value from settings where key in ('telegram_bot_token', 'telegram_bot_username', 'telegram_admin_chat_id')",
    );
    db = Object.fromEntries(rows.map((r) => [r.key, r.value ?? '']));
  } catch {
    // база недоступна — только переменные окружения
  }
  return {
    token: process.env.TELEGRAM_BOT_TOKEN || db.telegram_bot_token || '',
    username: (process.env.TELEGRAM_BOT_USERNAME || db.telegram_bot_username || '').replace(/^@/, ''),
    chatId: process.env.TELEGRAM_ADMIN_CHAT_ID || db.telegram_admin_chat_id || '',
  };
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function notifyAdmin(html: string): Promise<boolean> {
  const { token, chatId } = await getTelegramConfig();
  if (!token || !chatId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: html, parse_mode: 'HTML', disable_web_page_preview: true }),
      signal: AbortSignal.timeout(15000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
