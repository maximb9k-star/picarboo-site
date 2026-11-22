'use client';
import { useEffect, useRef } from 'react';

// Официальный виджет «Войти через Telegram». Домен сайта нужно указать боту в @BotFather → /setdomain.
export function TelegramLogin({ bot, next }: { bot: string; next: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const s = document.createElement('script');
    s.src = 'https://telegram.org/js/telegram-widget.js?22';
    s.async = true;
    s.setAttribute('data-telegram-login', bot);
    s.setAttribute('data-size', 'large');
    s.setAttribute('data-radius', '12');
    s.setAttribute('data-request-access', 'write');
    s.setAttribute('data-auth-url', `/api/auth/telegram?next=${encodeURIComponent(next)}`);
    el.appendChild(s);
    return () => { el.innerHTML = ''; };
  }, [bot, next]);
  return <div ref={ref} />;
}
