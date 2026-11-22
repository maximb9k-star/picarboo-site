'use client';
import { useState } from 'react';

export function Gallery({ photos, alt }: { photos: string[]; alt: string }) {
  const [i, setI] = useState(0);
  const [full, setFull] = useState(false);
  if (!photos.length) return <div className="card aspect-[3/2] bg-ink/5" />;
  const prev = () => setI((i - 1 + photos.length) % photos.length);
  const next = () => setI((i + 1) % photos.length);
  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-ink">
        <img src={photos[i]} alt={alt} referrerPolicy="no-referrer" onClick={() => setFull(true)} className="aspect-[3/2] w-full cursor-zoom-in object-cover" />
        {photos.length > 1 && (
          <>
            <button onClick={prev} aria-label="Предыдущее фото" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 shadow hover:bg-white">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 6l-6 6 6 6" /></svg>
            </button>
            <button onClick={next} aria-label="Следующее фото" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 shadow hover:bg-white">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 6l6 6-6 6" /></svg>
            </button>
            <span className="absolute bottom-2 right-2 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-semibold text-white">{i + 1} / {photos.length}</span>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {photos.map((p, k) => (
            <button key={k} onClick={() => setI(k)} className={`shrink-0 overflow-hidden rounded-lg ring-2 ${k === i ? 'ring-lime' : 'ring-transparent opacity-70 hover:opacity-100'}`}>
              <img src={p.replace(/rh=\d+&cw=\d+&ch=\d+/, 'rh=80&cw=120&ch=80')} alt="" referrerPolicy="no-referrer" loading="lazy" className="h-14 w-20 object-cover" />
            </button>
          ))}
        </div>
      )}
      {full && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/95 p-2" onClick={() => setFull(false)}>
          <img src={photos[i]!.replace(/\?.*$/, '')} alt={alt} referrerPolicy="no-referrer" className="max-h-full max-w-full object-contain" />
          <button onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Назад" className="absolute left-3 top-1/2 rounded-full bg-white/15 p-3 text-white">‹</button>
          <button onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Вперёд" className="absolute right-3 top-1/2 rounded-full bg-white/15 p-3 text-white">›</button>
        </div>
      )}
    </div>
  );
}
