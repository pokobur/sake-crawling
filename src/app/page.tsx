'use client';

import React, { useState, useMemo, lazy, Suspense } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Event, GenreType, AreaType, ViewMode } from '../types/event';
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

  // 表示・選択状態
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // お気に入り管理
  const { favoriteIds, toggleFavorite, isFavorite } = useFavorites();

  // イベント取得 & フィルタリングフック
  const { events, filteredEvents, loading, error, isMock, refetch } = useEvents(
    { searchQuery, selectedGenres, selectedAreas, showFavoritesOnly },
    isFavorite
  );

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
  };

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-100 overflow-hidden relative">
      {/* デスクトップ用サイドバー */}
      <aside className="hidden lg:block w-80 shrink-0 h-full">
        <FilterSidebar {...sidebarProps} />
      </aside>

      {/* モバイル用フィルタードロワー */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[300px] shadow-2xl animate-slide-in">
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
        />

        {/* コンテンツ本体 */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950/20">
          {loading ? (
            <div className="h-full flex flex-col justify-center items-center space-y-4">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-sm text-slate-400 font-semibold tracking-wider">
                イベントデータを読み込み中...
              </p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col justify-center items-center space-y-4 max-w-md mx-auto text-center">
              <AlertTriangle className="w-12 h-12 text-rose-500" />
              <h3 className="text-lg font-bold text-slate-200">エラーが発生しました</h3>
              <p className="text-sm text-slate-400">{error}</p>
              <button
                onClick={refetch}
                className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-amber-400 hover:bg-slate-800 transition-all"
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
                />
              )}

              {viewMode === 'map' && (
                <Suspense
                  fallback={
                    <div className="h-full flex flex-col justify-center items-center space-y-4">
                      <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                      <p className="text-sm text-slate-400 font-semibold tracking-wider">
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

      {/* 詳細スライドオーバー */}
      <EventDetail
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        isFavorite={selectedEvent ? isFavorite(selectedEvent.id) : false}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
}
