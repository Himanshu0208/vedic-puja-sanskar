'use client';

import { useState } from 'react';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
  displayValue: string;
}

export function AdminDonutChart({ title, total, totalDisplay, totalCaption, shareCaption = 'of total', segments }: {
  title: string;
  total: number;
  totalDisplay: string;
  totalCaption: string;
  shareCaption?: string;
  segments: DonutSegment[];
}) {
  const [hovered, setHovered] = useState<DonutSegment | null>(null);
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
    <h2 className="font-semibold text-stone-900">{title}</h2>
    <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
      <div className="relative h-44 w-44 shrink-0" onMouseLeave={() => setHovered(null)}>
        <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" role="img" aria-label={`${title}: ${totalDisplay}`}>
          <circle cx="80" cy="80" r={radius} fill="none" stroke="#f5f5f4" strokeWidth="20"/>
          {segments.filter((segment) => segment.value > 0).map((segment) => {
            const length = total > 0 ? (segment.value / total) * circumference : 0;
            const segmentOffset = offset;
            offset += length;
            const share = total ? ((segment.value / total) * 100).toFixed(1) : '0.0';
            return <circle key={segment.label} cx="80" cy="80" r={radius} fill="none" stroke={segment.color} strokeWidth="20" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-segmentOffset} className="cursor-pointer transition-opacity hover:opacity-75 focus:opacity-75" tabIndex={0} aria-label={`${segment.label}: ${segment.displayValue}, ${share}%`} onMouseEnter={() => setHovered(segment)} onFocus={() => setHovered(segment)} onBlur={() => setHovered(null)}>
              <title>{`${segment.label}: ${segment.displayValue} (${share}%)`}</title>
            </circle>;
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"><span className="max-w-32 truncate text-base font-bold tracking-tight text-stone-900 sm:text-lg">{totalDisplay}</span><span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-stone-500">{totalCaption}</span></div>
      </div>
      <div className="w-full space-y-3 sm:flex-1">
        {segments.map((segment) => <div key={segment.label} className="flex items-center justify-between gap-3 text-sm" onMouseEnter={() => setHovered(segment)} onMouseLeave={() => setHovered(null)}>
          <span className="flex min-w-0 items-center gap-2 text-stone-600"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }}/><span className="truncate">{segment.label}</span></span>
          <span className="shrink-0 font-semibold text-stone-900">{segment.displayValue}</span>
        </div>)}
      </div>
    </div>
    <div className="mt-3 min-h-10 rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-600" aria-live="polite">
      {hovered ? <span><strong className="text-stone-900">{hovered.label}</strong> · {hovered.displayValue} · {total ? ((hovered.value / total) * 100).toFixed(1) : '0.0'}% {shareCaption}</span> : <span>Hover a chart segment for its value and share.</span>}
    </div>
  </article>;
}
