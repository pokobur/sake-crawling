'use client';

import React from 'react';
import { Beer, AlertTriangle, Calendar as CalendarIcon, List, Map, Filter, Sparkles } from 'lucide-react';
import { ViewMode, DateFilterType } from '../types/event';

interface HeaderProps {
  isMock: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenMobileFilter: () => void;
  dateFilter: DateFilterType;
  onDateFilterChange: (filter: DateFilterType) => void;
}

export default function Header({
  isMock,
  viewMode,
  onViewModeChange,
  onOpenMobileFilter,
  dateFilter,
  onDateFilterChange,
}: HeaderProps) {
  return (
    <header className="bg-slate-950/70 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 py-3.5 flex flex-wrap justify-between items-center gap-3 shrink-0 z-20 shadow-md">
      {/* アプリロゴ・タイトル */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/40">
          <Beer className="w-5 h-5 text-slate-950 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-black tracking-widest bg-gradient-to-r from-slate-100 via-amber-100 to-amber-400 bg-clip-text text-transparent">
              SAKE CALENDAR
            </h1>
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
              <Sparkles className="w-2.5 h-2.5" />
              <span>東京・近郊</span>
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
            厳選お酒イベント情報
          </p>
        </div>
      </div>

      {/* 日付クイックフィルター (すべて / 今週末 / 今月) */}
      <div className="order-3 md:order-2 flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-xs font-bold">
        <button
          onClick={() => onDateFilterChange('all')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            dateFilter === 'all'
              ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          全期間
        </button>
        <button
          onClick={() => onDateFilterChange('weekend')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            dateFilter === 'weekend'
              ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          今週末 🍺
        </button>
        <button
          onClick={() => onDateFilterChange('month')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            dateFilter === 'month'
              ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          今月
        </button>
      </div>

      {/* 右側アクション（デモモードバッジ、ビュー切替、モバイルフィルターボタン） */}
      <div className="order-2 md:order-3 flex items-center space-x-2.5">
        {/* モック警告バッジ */}
        {isMock && (
          <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" />
            <span>デモモード</span>
          </span>
        )}

        {/* 表示モード切り替え (カレンダー / リスト / マップ) */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-inner">
          <button
            onClick={() => onViewModeChange('calendar')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'calendar'
                ? 'bg-slate-800 text-amber-300 border border-amber-400/30 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="カレンダー表示"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">カレンダー</span>
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-slate-800 text-amber-300 border border-amber-400/30 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="リスト表示"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">リスト</span>
          </button>
          <button
            onClick={() => onViewModeChange('map')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'map'
                ? 'bg-slate-800 text-amber-300 border border-amber-400/30 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="マップ表示"
          >
            <Map className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">マップ</span>
          </button>
        </div>

        {/* モバイル用フィルター表示ボタン */}
        <button
          onClick={onOpenMobileFilter}
          className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-300 transition-all active:scale-95 shadow-sm"
          aria-label="フィルターを開く"
        >
          <Filter className="w-4 h-4 text-amber-400" />
        </button>
      </div>
    </header>
  );
}
