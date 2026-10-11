'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Event } from '../types/event';
import { getGenreConfig } from '../constants/genres';

// 既存コードとの後方互換性のために Event 型を再エクスポート
export type { Event } from '../types/event';

interface CalendarViewProps {
  currentDate: Date;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  events: Event[];
  onSelectEvent: (event: Event) => void;
}

const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'];

export default function CalendarView({
  currentDate,
  setCurrentDate,
  events,
  onSelectEvent,
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

  // 特定の日付に属するイベントを取得
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      return event.start_date <= dateStr && dateStr <= event.end_date;
    });
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-slate-950/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 flex flex-col h-full">
      {/* カレンダーヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center space-x-3">
          <CalendarIcon className="w-6 h-6 text-amber-400" />
          <h2 className="text-2xl font-extrabold tracking-widest text-slate-100 uppercase">
            {year}年 {month + 1}月
          </h2>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800 rounded-lg p-1.5">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-slate-100 transition-all"
            aria-label="前月"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={setToday}
            className="px-3 py-1 rounded-md text-xs font-semibold hover:bg-slate-800 text-slate-300 hover:text-slate-100 transition-all border border-slate-800"
          >
            今日
          </button>

          <button
            onClick={nextMonth}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-slate-100 transition-all"
            aria-label="翌月"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-1.5 mb-2 text-center text-xs font-bold text-slate-400 tracking-wider">
        {WEEKDAYS.map((day, idx) => (
          <div
            key={day}
            className={`py-2 rounded-md ${
              idx === 5 ? 'text-amber-300' : idx === 6 ? 'text-rose-400' : ''
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="grid grid-cols-7 gap-1.5 flex-1 min-h-[450px]">
        {calendarDays.map((day) => {
          const dateStr = day.date.toISOString().split('T')[0];
          const isToday = dateStr === todayStr;
          const dayEvents = getEventsForDate(day.date);
          const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;

          return (
            <div
              key={day.key}
              className={`min-h-[70px] p-1.5 rounded-xl border flex flex-col transition-all ${
                day.isCurrentMonth
                  ? isToday
                    ? 'bg-slate-900/90 border-amber-500/70 shadow-inner'
                    : 'bg-slate-900/20 border-slate-900 hover:bg-slate-900/40'
                  : 'bg-slate-950/10 border-transparent opacity-30 text-slate-600'
              }`}
            >
              {/* 日付番号とマーク */}
              <div className="flex justify-between items-center mb-1">
                <span
                  className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                    isToday
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : day.isCurrentMonth
                        ? isWeekend
                          ? day.date.getDay() === 0
                            ? 'text-rose-400'
                            : 'text-amber-300'
                          : 'text-slate-300'
                        : 'text-slate-600'
                  }`}
                >
                  {day.date.getDate()}
                </span>

                {/* イベントありドット（モバイル表示等） */}
                {dayEvents.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 sm:hidden" />
                )}
              </div>

              {/* イベントリスト */}
              <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[70px] sm:max-h-none scrollbar-none">
                {dayEvents.slice(0, 3).map((event) => {
                  const primaryGenre = event.genre[0] || 'その他';
                  const genreConfig = getGenreConfig(primaryGenre);

                  return (
                    <button
                      key={event.id}
                      onClick={() => onSelectEvent(event)}
                      className={`w-full text-left text-[10px] sm:text-xs px-1.5 py-0.5 sm:py-1 rounded-md border flex items-center space-x-1.5 transition-all select-none truncate ${genreConfig.calendar.bg} ${genreConfig.calendar.text} border-slate-800/20`}
                      title={event.title}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${genreConfig.calendar.dot}`}
                      />
                      <span className="truncate leading-none">{event.title}</span>
                    </button>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="text-[9px] text-slate-500 text-center font-semibold">
                    他 {dayEvents.length - 3} 件
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
