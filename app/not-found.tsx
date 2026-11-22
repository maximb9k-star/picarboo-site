import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-x py-20 text-center">
      <div className="font-brand text-6xl text-lime-700">404</div>
      <p className="mt-4 text-lg font-semibold">Страница не найдена</p>
      <p className="mt-1 text-ink/60">Возможно, объявление уже продано.</p>
      <Link href="/catalog" className="btn-dark mt-6">В каталог</Link>
    </div>
  );
}
