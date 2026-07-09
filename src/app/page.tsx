'use client';

import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Filter, Calendar as CalendarIcon, List, AlertTriangle, RefreshCw, Beer, MapPin, Map, Heart } from 'lucide-react';
import FilterSidebar, { GenreType, AreaType } from '../components/filter-sidebar';
import CalendarView, { Event } from '../components/calendar-view';
import EventDetail from '../components/event-detail';
import { useFavorites } from '../hooks/use-favorites';

// MapView は Leaflet を含むため SSR を回避して動的インポート
const MapView = lazy(() => import('../components/map-view'));

export default function Home() {
  // 状態管理
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  // フィルター状態
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<GenreType[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<AreaType[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // 表示関連
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'map'>('calendar');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // お気に入りフック
  const { favoriteIds, toggleFavorite, isFavorite } = useFavorites();

  // お気に入り中のイベント数を算出
  const favoritesCount = useMemo(() => {
    return events.filter(e => favoriteIds.has(e.id)).length;
  }, [events, favoriteIds]);

  // データフェッチ
  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/events');
      if (!res.ok) throw new Error('APIの取得に失敗しました。');
      const data = await res.json();
      setEvents(data.events || []);
      setIsMock(!!data.isMock);
    } catch (err: any) {
      console.error(err);
      setError('イベントデータの取得中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // フィルタリング処理
  useEffect(() => {
    let result = [...events];

    // 0. お気に入りフィルター
    if (showFavoritesOnly) {
      result = result.filter(event => isFavorite(event.id));
    }

    // 1. キーワード検索
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        event =>
          event.title.toLowerCase().includes(q) ||
          event.location_name.toLowerCase().includes(q) ||
          (event.address && event.address.toLowerCase().includes(q)) ||
          (event.description && event.description.toLowerCase().includes(q))
      );
    }

    // 2. お酒ジャンル
    if (selectedGenres.length > 0) {
      result = result.filter(event =>
        event.genre.some(g => selectedGenres.includes(g as GenreType))
      );
    }

    // 3. エリア
    if (selectedAreas.length > 0) {
      result = result.filter(event =>
        selectedAreas.includes(event.area as AreaType)
      );
    }

    setFilteredEvents(result);
  }, [events, searchQuery, selectedGenres, selectedAreas, showFavoritesOnly, isFavorite]);

  // ジャンルごとの色定義 (リストビュー用)
  const GENRE_COLORS: { [key: string]: string } = {
    '日本酒': 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    'ビール': 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    'ウイスキー': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    'ワイン': 'bg-rose-500/10 text-rose-300 border-rose-500/20',
    'その他': 'bg-slate-500/10 text-slate-300 border-slate-500/20'
  };

  // サイドバー共通のprops
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
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsMobileFilterOpen(false)} />
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
        <header className="bg-slate-950/40 backdrop-blur-md border-b border-slate-900 px-6 py-4 flex justify-between items-center shrink-0">
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
                onClick={() => setViewMode('calendar')}
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
                onClick={() => setViewMode('list')}
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
                onClick={() => setViewMode('map')}
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
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-all"
              aria-label="フィルターを開く"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* コンテンツ本体 */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950/20">
          
          {loading ? (
            /* ローディング */
            <div className="h-full flex flex-col justify-center items-center space-y-4">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-sm text-slate-400 font-semibold tracking-wider">
                イベントデータを読み込み中...
              </p>
            </div>
          ) : error ? (
            /* エラー表示 */
            <div className="h-full flex flex-col justify-center items-center space-y-4 max-w-md mx-auto text-center">
              <AlertTriangle className="w-12 h-12 text-rose-500" />
              <h3 className="text-lg font-bold text-slate-200">エラーが発生しました</h3>
              <p className="text-sm text-slate-400">{error}</p>
              <button
                onClick={fetchEvents}
                className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-amber-400 hover:bg-slate-800 transition-all"
              >
                再読み込み
              </button>
            </div>
          ) : (
            /* カレンダー / リスト / マップ の切り替え描画 */
            <div className="h-full">
              {viewMode === 'calendar' ? (
                <CalendarView
                  currentDate={currentDate}
                  setCurrentDate={setCurrentDate}
                  events={filteredEvents}
                  onSelectEvent={setSelectedEvent}
                />
              ) : viewMode === 'map' ? (
                <Suspense fallback={
                  <div className="h-full flex flex-col justify-center items-center space-y-4">
                    <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                    <p className="text-sm text-slate-400 font-semibold tracking-wider">
                      マップを準備中...
                    </p>
                  </div>
                }>
                  <MapView
                    events={filteredEvents}
                    onSelectEvent={setSelectedEvent}
                  />
                </Suspense>
              ) : (
                /* リストビュー */
                <div className="space-y-6">
                  {filteredEvents.length === 0 ? (
                    <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
                      <Beer className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                      <p className="text-sm text-slate-500 font-semibold">
                        {showFavoritesOnly
                          ? 'お気に入りに登録されたイベントがありません。'
                          : '条件に合致するお酒イベントが見つかりません。'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredEvents.map((event) => {
                        const primaryGenre = event.genre[0] || 'その他';
                        const isEventFavorite = isFavorite(event.id);
                        return (
                          <div
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className="bg-slate-900/30 backdrop-blur-md border border-slate-900 hover:border-slate-800/80 rounded-2xl p-5 hover:bg-slate-900/50 transition-all cursor-pointer group flex flex-col justify-between min-h-[190px] shadow-sm hover:shadow-lg relative"
                          >
                            {/* お気に入りハート */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(event.id);
                              }}
                              className={`absolute top-4 right-4 p-1.5 rounded-lg transition-all z-10 ${
                                isEventFavorite
                                  ? 'text-rose-400 hover:text-rose-300'
                                  : 'text-slate-700 hover:text-rose-400 opacity-0 group-hover:opacity-100'
                              }`}
                              title={isEventFavorite ? 'お気に入りを解除' : 'お気に入りに追加'}
                            >
                              <Heart className={`w-4 h-4 ${isEventFavorite ? 'fill-rose-400' : ''}`} />
                            </button>

                            <div className="space-y-3">
                              {/* 日付とジャンルバッジ */}
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500 font-bold tracking-wider">
                                  {event.start_date.replace(/-/g, '/')}
                                  {event.start_date !== event.end_date && ` - ${event.end_date.split('-').slice(1).join('/')}`}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${GENRE_COLORS[primaryGenre] || GENRE_COLORS['その他']}`}>
                                  {primaryGenre}
                                </span>
                              </div>

                              {/* タイトル */}
                              <h3 className="text-md font-bold text-slate-200 group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug pr-8">
                                {event.title}
                              </h3>

                              {/* 説明 */}
                              {event.description && (
                                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                  {event.description}
                                </p>
                              )}
                            </div>

                            {/* 会場 */}
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
                  )}
                </div>
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
