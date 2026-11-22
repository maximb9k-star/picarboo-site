import type { Metadata } from 'next';
import { FavoritesList } from '@/components/FavoritesList';

export const metadata: Metadata = { title: 'Избранное', robots: { index: false } };

export default function FavoritesPage() {
  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Избранное</h1>
      <p className="mt-2 text-sm text-ink/60">Сохраняется в этом браузере.</p>
      <div className="mt-6"><FavoritesList /></div>
    </div>
  );
}
