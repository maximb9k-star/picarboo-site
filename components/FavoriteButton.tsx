'use client';
import { useEffect, useState } from 'react';
import { readFavorites, toggleFavorite } from '@/lib/favorites';

export function FavoriteButton({ id, className = '', large = false }: { id: number; className?: string; large?: boolean }) {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(readFavorites().includes(id)), [id]);
  return (
    <button
      type="button"
      aria-label={on ? 'Убрать из избранного' : 'В избранное'}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOn(toggleFavorite(id)); }}
      className={`${className} ${large ? 'btn-ghost' : 'rounded-full bg-white/90 p-2 shadow'} transition hover:scale-105`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill={on ? '#0c0d0f' : 'none'} stroke="#0c0d0f" strokeWidth="2">
        <path d="M12 21s-7.5-4.6-9.5-9.3C1 8 3.3 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.7 0 6 3.5 4.5 7.2C19.5 16.4 12 21 12 21z" />
      </svg>
      {large && <span>{on ? 'В избранном' : 'В избранное'}</span>}
    </button>
  );
}
