'use client';

import React from 'react';
import { Beer, AlertTriangle, Calendar as CalendarIcon, List, Map, Filter } from 'lucide-react';
import { ViewMode } from '../types/event';

interface HeaderProps {
  isMock: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenMobileFilter: () => void;
}

export default function Header({
  isMock,
  viewMode,
  onViewModeChange,
  onOpenMobileFilter,
}: HeaderProps) {
  return (
    <header className="bg-slate-950/40 backdrop-blur-md border-b border-slate-900 px-6 py-4 flex justify-between items-center shrink-0">
      {/* アプリロゴ・タイトル */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/10">
          <Beer className="w-6 h-6 text-slate-950 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-widest bg-gradient-to-r from-slate-100 via-slate-100 to-amber-400 bg-clip-text text-transparent">
            SAKE CALENDAR
          </h1>
          <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
            お酒イベント スケジュール管理
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* モック警告バッジ */}
        {isMock && (
          <span className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>デモモード</span>
          </span>
        )}

        {/* 表示モード切り替え */}
        <div className="flex items-center bg-slate-900/80 border border-slate-800 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange('calendar')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              viewMode === 'calendar'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">カレンダー</span>
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">リスト</span>
          </button>
          <button
            onClick={() => onViewModeChange('map')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              viewMode === 'map'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">マップ</span>
          </button>
        </div>

        {/* モバイル用フィルター表示ボタン */}
        <button
          onClick={onOpenMobileFilter}
          className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-all"
          aria-label="フィルターを開く"
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
