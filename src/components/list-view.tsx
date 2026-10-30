'use client';

import React from 'react';
import { Beer, Heart, MapPin, Calendar, RotateCcw } from 'lucide-react';
import { Event } from '../types/event';
import { getGenreConfig } from '../constants/genres';
import { formatShortDateRange } from '../utils/date';

interface ListViewProps {
  events: Event[];
  onSelectEvent: (event: Event) => void;
  isFavorite: (eventId: string) => boolean;
  onToggleFavorite: (eventId: string) => void;
  showFavoritesOnly?: boolean;
  onClearFilters?: () => void;
}

export default function ListView({
  events,
  onSelectEvent,
  isFavorite,
  onToggleFavorite,
  showFavoritesOnly = false,
  onClearFilters,
}: ListViewProps) {
  if (events.length === 0) {
    return (
      <div className="py-20 px-6 text-center border border-dashed border-slate-800/80 rounded-3xl bg-slate-900/20 backdrop-blur-sm max-w-lg mx-auto my-12 space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-500 border border-slate-750 shadow-inner">
          <Beer className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-200">
            {showFavoritesOnly ? 'お気に入りのイベントがありません' : '条件に合致するイベントが見つかりません'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {showFavoritesOnly
              ? '気になるイベントのハートアイコンをクリックしてお気に入りに追加してみましょう。'
              : '検索条件やジャンル・エリアの選択を広げてお試しください。'}
          </p>
        </div>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-400 border border-slate-700/80 text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>フィルターをクリア</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {events.map((event) => {
        const primaryGenre = event.genre[0] || 'その他';
        const genreConfig = getGenreConfig(primaryGenre);
        const favorite = isFavorite(event.id);

        return (
          <div
            key={event.id}
            onClick={() => onSelectEvent(event)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectEvent(event);
              }
            }}
            tabIndex={0}
            role="button"
            className="group relative flex flex-col justify-between min-h-[200px] p-5 rounded-2xl bg-gradient-to-b from-slate-900/50 to-slate-950/70 backdrop-blur-md border border-slate-800/70 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          >
            {/* お気に入りハートボタン */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(event.id);
              }}
              className={`absolute top-4 right-4 p-2 rounded-xl transition-all z-10 ${
                favorite
                  ? 'bg-rose-500/20 text-rose-400 shadow-sm'
                  : 'text-slate-600 hover:text-rose-400 hover:bg-slate-800/60 opacity-80 sm:opacity-0 group-hover:opacity-100'
              }`}
              title={favorite ? 'お気に入りを解除' : 'お気に入りに追加'}
              aria-label={favorite ? 'お気に入りを解除' : 'お気に入りに追加'}
            >
              <Heart className={`w-4 h-4 ${favorite ? 'fill-rose-400 text-rose-400' : ''}`} />
            </button>

            <div className="space-y-3">
              {/* 日付とジャンルバッジ */}
              <div className="flex justify-between items-center pr-9">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-bold tracking-wider">
                  <Calendar className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
                  <span>{formatShortDateRange(event.start_date, event.end_date)}</span>
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${genreConfig.badgeClass} shadow-xs`}
                >
                  {genreConfig.icon} {primaryGenre}
                </span>
              </div>

              {/* タイトル */}
              <h3 className="text-base font-extrabold text-slate-100 group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug pr-2">
                {event.title}
              </h3>

              {/* 説明文 */}
              {event.description && (
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {event.description}
                </p>
              )}
            </div>

            {/* 会場・エリア情報 */}
            <div className="flex items-center justify-between text-slate-400 border-t border-slate-800/80 pt-3.5 mt-4 text-xs font-semibold gap-2">
              <div className="flex items-center space-x-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate text-slate-300 group-hover:text-slate-200">{event.location_name}</span>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-800/70 px-2 py-0.5 rounded-md border border-slate-700/60 shrink-0 font-bold">
                {event.area}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
