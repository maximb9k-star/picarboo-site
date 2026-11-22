// Контакты для ссылок на сайте. Можно переопределить переменными окружения.
export function contacts() {
  const tg = process.env.NEXT_PUBLIC_TELEGRAM_USERNAME || 'maximbyak';
  const wa = (process.env.NEXT_PUBLIC_WHATSAPP || '821023435838').replace(/\D/g, '');
  const phone = process.env.NEXT_PUBLIC_PHONE || '+82 10-2343-5838';
  return {
    telegram: `@${tg}`,
    telegramUrl: `https://t.me/${tg}`,
    whatsappUrl: `https://wa.me/${wa}`,
    phone,
    phoneHref: `tel:${phone.replace(/[^\d+]/g, '')}`,
    instagramUrl: 'https://instagram.com/picarboo',
  };
}
