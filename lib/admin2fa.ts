// Второй шаг входа в админку: одноразовый код в Telegram администратора (если бот подключён).
import crypto from 'node:crypto';

interface Pending { hash: string; exp: number; tries: number }

const g = globalThis as unknown as { __admin2fa?: Map<string, Pending> };
const store: Map<string, Pending> = (g.__admin2fa ??= new Map<string, Pending>());

const TTL_MS = 5 * 60_000;
const MAX_TRIES = 5;

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

// Создаёт код и возвращает [идентификатор попытки, код для отправки].
export function issueCode(): [string, string] {
  const now = Date.now();
  for (const [k, p] of store) if (p.exp < now) store.delete(k);
  const nonce = crypto.randomBytes(16).toString('base64url');
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  store.set(nonce, { hash: hashCode(code), exp: now + TTL_MS, tries: 0 });
  return [nonce, code];
}

export type CheckResult = 'ok' | 'wrong' | 'expired';

export function checkCode(nonce: string, code: string): CheckResult {
  const p = store.get(nonce);
  if (!p || p.exp < Date.now()) {
    store.delete(nonce);
    return 'expired';
  }
  const a = Buffer.from(hashCode(code.replace(/\D/g, '')));
  const b = Buffer.from(p.hash);
  if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
    store.delete(nonce);
    return 'ok';
  }
  p.tries += 1;
  if (p.tries >= MAX_TRIES) store.delete(nonce);
  return 'wrong';
}

export const TWO_FA_TTL_SEC = TTL_MS / 1000;
