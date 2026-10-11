'use client';

import React from 'react';
import { Beer, Heart, MapPin } from 'lucide-react';
import { Event } from '../types/event';
import { getGenreConfig } from '../constants/genres';
import { formatShortDateRange } from '../utils/date';

interface ListViewProps {
  events: Event[];
  onSelectEvent: (event: Event) => void;
  isFavorite: (eventId: string) => boolean;
  onToggleFavorite: (eventId: string) => void;
  showFavoritesOnly?: boolean;
}

export default function ListView({
  events,
  onSelectEvent,
  isFavorite,
  onToggleFavorite,
  showFavoritesOnly = false,
}: ListViewProps) {
  if (events.length === 0) {
    return (
      <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
        <Beer className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-semibold">
          {showFavoritesOnly
            ? 'お気に入りに登録されたイベントがありません。'
            : '条件に合致するお酒イベントが見つかりません。'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {events.map((event) => {
        const primaryGenre = event.genre[0] || 'その他';
        const genreConfig = getGenreConfig(primaryGenre);
        const favorite = isFavorite(event.id);

        return (
          <div
            key={event.id}
            onClick={() => onSelectEvent(event)}
            className="bg-slate-900/30 backdrop-blur-md border border-slate-900 hover:border-slate-800/80 rounded-2xl p-5 hover:bg-slate-900/50 transition-all cursor-pointer group flex flex-col justify-between min-h-[190px] shadow-sm hover:shadow-lg relative"
          >
            {/* お気に入りハートボタン */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(event.id);
              }}
              className={`absolute top-4 right-4 p-1.5 rounded-lg transition-all z-10 ${
                favorite
                  ? 'text-rose-400 hover:text-rose-300'
                  : 'text-slate-700 hover:text-rose-400 opacity-0 group-hover:opacity-100'
              }`}
              title={favorite ? 'お気に入りを解除' : 'お気に入りに追加'}
              aria-label={favorite ? 'お気に入りを解除' : 'お気に入りに追加'}
            >
              <Heart className={`w-4 h-4 ${favorite ? 'fill-rose-400' : ''}`} />
            </button>

            <div className="space-y-3">
              {/* 日付とジャンルバッジ */}
              <div className="flex justify-between items-center pr-8">
                <span className="text-xs text-slate-500 font-bold tracking-wider">
                  {formatShortDateRange(event.start_date, event.end_date)}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${genreConfig.badgeClass}`}
                >
                  {primaryGenre}
                </span>
              </div>

              {/* タイトル */}
              <h3 className="text-md font-bold text-slate-200 group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug pr-4">
                {event.title}
              </h3>

              {/* 説明 */}
              {event.description && (
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {event.description}
                </p>
              )}
            </div>

            {/* 会場情報 */}
            <div className="flex items-center space-x-2 text-slate-500 border-t border-slate-850 pt-3 mt-4 text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">{event.location_name}</span>
              <span className="text-[10px] text-slate-600 bg-slate-800/20 px-1 py-0.5 rounded border border-slate-800/40 shrink-0 ml-auto">
                {event.area}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
