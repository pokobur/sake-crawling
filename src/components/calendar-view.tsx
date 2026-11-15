'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Event } from '../types/event';
import { getGenreConfig } from '../constants/genres';
import { formatLocalDate } from '../utils/date';

// 既存コードとの後方互換性のために Event 型を再エクスポート
export type { Event } from '../types/event';

interface CalendarViewProps {
  currentDate: Date;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  events: Event[];
  onSelectEvent: (event: Event) => void;
  selectedDate?: string | null;
  onSelectDate: (dateStr: string) => void;
}

const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'];

export default function CalendarView({
  currentDate,
  setCurrentDate,
  events,
  onSelectEvent,
  selectedDate = null,
  onSelectDate,
}: CalendarViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // 前月・翌月・今月移動
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const setToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  // カレンダーグリッドの日付計算 (6週 = 42マス)
  const getCalendarDays = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0:日, 1:月... 6:土
    // 月曜始まりにインデックス調整 (月=0, 火=1, ..., 土=5, 日=6)
    const firstDayIndex = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const days: { date: Date; isCurrentMonth: boolean; key: string }[] = [];

    // 前月の日付で埋める
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        key: `prev-${prevMonthLastDay - i}`,
      });
    }

    // 当月の日付
    for (let i = 1; i <= daysInMonth; i++) {
      const currDate = new Date(year, month, i);
      days.push({
        date: currDate,
        isCurrentMonth: true,
        key: `curr-${i}`,
      });
    }

    // 翌月の日付で埋める
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        date: nextDate,
        isCurrentMonth: false,
        key: `next-${i}`,
      });
    }

    return days;
  };

  const calendarDays = getCalendarDays();

  // 特定の日付に属するイベントを取得（ローカル日付基準で正確に比較）
  const getEventsForDate = (date: Date) => {
    const dateStr = formatLocalDate(date);
    return events.filter(event => {
      return event.start_date <= dateStr && dateStr <= event.end_date;
    });
  };

  // 今日の日付（ローカルタイム基準）
  const todayStr = formatLocalDate(new Date());

  return (
    <div className="bg-slate-950/60 backdrop-blur-xl rounded-3xl border border-slate-800/80 p-3.5 sm:p-6 flex flex-col h-full shadow-2xl">
      {/* カレンダーヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-5 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-widest text-slate-100 uppercase">
              {year}年 {month + 1}月
            </h2>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              日付を押すとその日のイベント一覧を表示します
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-inner">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-slate-100 transition-all active:scale-95"
            aria-label="前月へ移動"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={setToday}
            className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-750 text-amber-300 hover:text-amber-200 transition-all border border-slate-700/80 shadow-xs"
          >
            今月へ
          </button>

          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-slate-100 transition-all active:scale-95"
            aria-label="翌月へ移動"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-extrabold tracking-wider">
        {WEEKDAYS.map((day, idx) => (
          <div
            key={day}
            className={`py-2 rounded-lg bg-slate-900/40 border border-slate-850/60 ${
              idx === 5
                ? 'text-sky-300 bg-sky-950/20'
                : idx === 6
                ? 'text-rose-400 bg-rose-950/20'
                : 'text-slate-400'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日付グリッド (42マス) */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 flex-1 min-h-[370px] sm:min-h-[460px]">
        {calendarDays.map((day) => {
          const dateStr = formatLocalDate(day.date);
          const isToday = dateStr === todayStr;
          const isSelected = selectedDate === dateStr;
          const dayEvents = getEventsForDate(day.date);
          const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;

          return (
            <div
              key={day.key}
              role="button"
              tabIndex={0}
              onClick={() => onSelectDate(dateStr)}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectDate(dateStr);
                }
              }}
              aria-label={`${day.date.getFullYear()}年${day.date.getMonth() + 1}月${day.date.getDate()}日 ${dayEvents.length}件のイベント一覧を表示`}
              className={`min-h-[58px] sm:min-h-[82px] p-1 sm:p-2 rounded-xl sm:rounded-2xl border flex flex-col transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400/70 ${
                isSelected
                  ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/70 shadow-lg shadow-amber-500/15'
                  : day.isCurrentMonth
                  ? isToday
                    ? 'bg-slate-900/90 border-amber-400/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50 hover:bg-slate-900'
                    : 'bg-slate-900/30 border-slate-800/80 hover:bg-slate-900/60 hover:border-amber-500/40'
                  : 'bg-slate-950/20 border-slate-900/30 opacity-35 hover:opacity-60 text-slate-600'
              }`}
            >
              {/* 日付番号とマーク */}
              <div className="flex justify-center sm:justify-between items-center mb-1 sm:mb-1.5">
                <span
                  className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-lg ${
                    isToday
                      ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 shadow-md font-black ring-1 ring-amber-300'
                      : day.isCurrentMonth
                      ? isWeekend
                        ? day.date.getDay() === 0
                          ? 'text-rose-400 bg-rose-500/10'
                          : 'text-sky-300 bg-sky-500/10'
                        : 'text-slate-300'
                      : 'text-slate-600'
                  }`}
                >
                  {day.date.getDate()}
                </span>

                {isToday && (
                  <span className="text-[9px] font-black text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30 hidden sm:inline">
                    TODAY
                  </span>
                )}
              </div>

              {/* モバイル表示: イベント件数のみ表示 */}
              {dayEvents.length > 0 && (
                <div className="sm:hidden flex-1 flex items-center justify-center">
                  <span className="inline-flex items-center justify-center text-[10px] font-extrabold text-amber-300 bg-amber-500/15 border border-amber-500/35 rounded-md px-1.5 py-0.5 leading-none whitespace-nowrap">
                    {dayEvents.length}件
                  </span>
                </div>
              )}

              {/* デスクトップ表示: イベントリスト */}
              <div className="hidden sm:flex flex-1 flex-col gap-1 overflow-y-auto scrollbar-none">
                {dayEvents.slice(0, 3).map((event) => {
                  const primaryGenre = event.genre[0] || 'その他';
                  const genreConfig = getGenreConfig(primaryGenre);

                  return (
                    <button
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(event);
                      }}
                      className={`w-full text-left text-[10px] sm:text-[11px] font-semibold px-2 py-1 rounded-lg border flex items-center space-x-1.5 transition-all select-none truncate shadow-xs ${genreConfig.calendar.bg} ${genreConfig.calendar.text} hover:scale-[1.02] active:scale-95`}
                      title={`${event.title} (${event.location_name})`}
                    >
                      <span className="shrink-0 text-[10px]">{genreConfig.icon}</span>
                      <span className="truncate leading-tight">{event.title}</span>
                    </button>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="text-[9px] text-amber-300 text-center font-bold bg-amber-500/10 border border-amber-500/20 rounded py-0.5 mt-0.5 hover:bg-amber-500/20 transition-colors">
                    他 {dayEvents.length - 3} 件を表示
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
