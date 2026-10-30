'use client';

import React, { useState, useMemo, lazy, Suspense } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Event, GenreType, AreaType, ViewMode, DateFilterType } from '../types/event';
import { useFavorites } from '../hooks/use-favorites';
import { useEvents } from '../hooks/use-events';
import Header from '../components/header';
import FilterSidebar from '../components/filter-sidebar';
import CalendarView from '../components/calendar-view';
import ListView from '../components/list-view';
import EventDetail from '../components/event-detail';

// Leaflet を含む MapView は SSR 回避のため遅延読み込み
const MapView = lazy(() => import('../components/map-view'));

export default function Home() {
  // フィルター状態
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<GenreType[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<AreaType[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');

  // 表示・選択状態
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // お気に入り管理
  const { favoriteIds, toggleFavorite, isFavorite } = useFavorites();

  // イベント取得 & 複合フィルタリングフック
  const { events, filteredEvents, loading, error, isMock, refetch } = useEvents(
    { searchQuery, selectedGenres, selectedAreas, showFavoritesOnly, dateFilter },
    isFavorite
  );

  // フィルター全クリア関数
  const handleClearAllFilters = () => {
    setSearchQuery('');
    setSelectedGenres([]);
    setSelectedAreas([]);
    setShowFavoritesOnly(false);
    setDateFilter('all');
  };

  // お気に入り件数
  const favoritesCount = useMemo(() => {
    return events.filter(e => favoriteIds.has(e.id)).length;
  }, [events, favoriteIds]);

  // サイドバー共通プロパティ
  const sidebarProps = {
    searchQuery,
    setSearchQuery,
    selectedGenres,
    setSelectedGenres,
    selectedAreas,
    setSelectedAreas,
    totalCount: events.length,
    filteredCount: filteredEvents.length,
    showFavoritesOnly,
    setShowFavoritesOnly,
    favoritesCount,
    dateFilter,
    setDateFilter,
  };

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-100 overflow-hidden relative">
      {/* デスクトップ用サイドバー */}
      <aside className="hidden lg:block w-80 shrink-0 h-full">
        <FilterSidebar {...sidebarProps} />
      </aside>

      {/* モバイル用フィルタードロワー */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setIsMobileFilterOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 h-full w-[310px] shadow-2xl animate-slide-in">
            <FilterSidebar
              {...sidebarProps}
              onCloseMobile={() => setIsMobileFilterOpen(false)}
            />
          </div>
        </div>
      )}

      {/* メインエリア */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* ナビバー / ヘッダー */}
        <Header
          isMock={isMock}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onOpenMobileFilter={() => setIsMobileFilterOpen(true)}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
        />

        {/* コンテンツ本体 */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-radial from-slate-900/30 to-slate-950/80">
          {loading ? (
            <div className="h-full flex flex-col justify-center items-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">
                イベントデータを読み込み中...
              </p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col justify-center items-center space-y-4 max-w-md mx-auto text-center p-6 bg-slate-900/40 rounded-3xl border border-slate-800">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-base font-extrabold text-slate-100">エラーが発生しました</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
              <button
                onClick={refetch}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md active:scale-95"
              >
                再読み込み
              </button>
            </div>
          ) : (
            <div className="h-full">
              {viewMode === 'calendar' && (
                <CalendarView
                  currentDate={currentDate}
                  setCurrentDate={setCurrentDate}
                  events={filteredEvents}
                  onSelectEvent={setSelectedEvent}
                />
              )}

              {viewMode === 'list' && (
                <ListView
                  events={filteredEvents}
                  onSelectEvent={setSelectedEvent}
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFavorite}
                  showFavoritesOnly={showFavoritesOnly}
                  onClearFilters={handleClearAllFilters}
                />
              )}

              {viewMode === 'map' && (
                <Suspense
                  fallback={
                    <div className="h-full flex flex-col justify-center items-center space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <RefreshCw className="w-6 h-6 animate-spin" />
                      </div>
                      <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">
                        マップを準備中...
                      </p>
                    </div>
                  }
                >
                  <MapView
                    events={filteredEvents}
                    onSelectEvent={setSelectedEvent}
                  />
                </Suspense>
              )}
            </div>
          )}
        </main>
      </div>

      {/* 詳細スライドオーバー / ボトムシート */}
      <EventDetail
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        isFavorite={selectedEvent ? isFavorite(selectedEvent.id) : false}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
}
