'use client';

import React, { useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Heart,
  Beer,
  ArrowRight,
} from 'lucide-react';
import { Event } from '../types/event';
import { getGenreConfig } from '../constants/genres';
import {
  formatLocalDate,
  formatDateWithWeekday,
  formatShortDateRange,
  shiftDateString,
} from '../utils/date';

interface DayEventsPanelProps {
  selectedDate: string | null;
  events: Event[];
  onClose: () => void;
  onChangeDate: (dateStr: string) => void;
  onSelectEvent: (event: Event) => void;
  isFavorite: (eventId: string) => boolean;
  onToggleFavorite: (eventId: string) => void;
  isDetailOpen?: boolean;
}

/**
 * カレンダーで選択した日付のイベント一覧を表示するスライドオーバー / ボトムシート
 */
export default function DayEventsPanel({
  selectedDate,
  events,
  onClose,
  onChangeDate,
  onSelectEvent,
  isFavorite,
  onToggleFavorite,
  isDetailOpen = false,
}: DayEventsPanelProps) {
  useEffect(() => {
    if (!selectedDate || isDetailOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDate, isDetailOpen, onClose]);

  const dayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter(
      (event) => event.start_date <= selectedDate && selectedDate <= event.end_date
    );
  }, [events, selectedDate]);

  if (!selectedDate) return null;

  const isToday = selectedDate === formatLocalDate(new Date());

  return (
    <>
      {/* 半透明バックドロップ (クリックで閉じる) */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-30 transition-opacity animate-fade-in"
        aria-hidden="true"
      />

      {/* スライドオーバーパネル (デスクトップ: 右スライド / モバイル: ボトムシート) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-events-panel-title"
        className="fixed bottom-0 sm:bottom-auto sm:top-0 right-0 max-h-[88vh] sm:max-h-full h-auto sm:h-full w-full sm:w-[460px] bg-slate-950/95 backdrop-blur-2xl border-t sm:border-t-0 sm:border-l border-slate-800 shadow-2xl text-slate-100 z-40 flex flex-col rounded-t-3xl sm:rounded-none animate-slide-in"
      >
        {/* モバイル用ドラッグハンドル */}
        <div className="w-12 h-1.5 bg-slate-700/60 rounded-full mx-auto mt-3 sm:hidden" />

        {/* パネルヘッダー */}
        <div className="flex items-center justify-between gap-3 p-5 sm:p-6 border-b border-slate-800/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  id="day-events-panel-title"
                  className="text-base sm:text-lg font-black text-slate-100 tracking-tight truncate"
                >
                  {formatDateWithWeekday(selectedDate)}
                </h3>
                {isToday && (
                  <span className="text-[10px] font-black text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30">
                    TODAY
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                開催イベント: <span className="text-amber-400 font-extrabold">{dayEvents.length}件</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onChangeDate(shiftDateString(selectedDate, -1))}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-all"
              aria-label="前日のイベントを表示"
              title="前日"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onChangeDate(shiftDateString(selectedDate, 1))}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-all"
              aria-label="翌日のイベントを表示"
              title="翌日"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-100 transition-all ml-1"
              aria-label="日付別イベント一覧を閉じる (Esc)"
              title="閉じる (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* イベント一覧本体 */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5">
          {dayEvents.length === 0 ? (
            <div className="py-14 px-6 text-center border border-dashed border-slate-800/80 rounded-2xl bg-slate-900/30 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800/70 flex items-center justify-center text-slate-500 border border-slate-700/60">
                <Beer className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-200">
                この日に開催予定のイベントはありません
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                別の日付を選択するか、左側のフィルター条件を変更してみてください。
              </p>
            </div>
          ) : (
            dayEvents.map((event) => {
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
                  className="group relative flex flex-col gap-2.5 p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/40 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400/50 shadow-sm"
                >
                  {/* 上段: 期間・ジャンル・お気に入り */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${genreConfig.badgeClass} shrink-0`}
                      >
                        {genreConfig.icon} {primaryGenre}
                      </span>
                      <span className="text-[11px] text-slate-400 font-bold tracking-wide truncate">
                        {formatShortDateRange(event.start_date, event.end_date)}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(event.id);
                      }}
                      className={`p-1.5 rounded-lg transition-all shrink-0 ${
                        favorite
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'text-slate-500 hover:text-rose-400 hover:bg-slate-800'
                      }`}
                      title={favorite ? 'お気に入りを解除' : 'お気に入りに追加'}
                      aria-label={favorite ? 'お気に入りを解除' : 'お気に入りに追加'}
                    >
                      <Heart className={`w-4 h-4 ${favorite ? 'fill-rose-400 text-rose-400' : ''}`} />
                    </button>
                  </div>

                  {/* タイトル */}
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-100 group-hover:text-amber-300 transition-colors leading-snug">
                    {event.title}
                  </h4>

                  {/* 概要 */}
                  {event.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  )}

                  {/* 下段: 会場・エリア・詳細誘導 */}
                  <div className="flex items-center justify-between gap-2 pt-2.5 mt-0.5 border-t border-slate-800/70 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0 text-slate-300 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{event.location_name}</span>
                      <span className="text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60 shrink-0 font-bold">
                        {event.area}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 shrink-0 group-hover:translate-x-0.5 transition-transform">
                      <span>詳細</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
