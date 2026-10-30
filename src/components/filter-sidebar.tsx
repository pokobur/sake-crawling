'use client';

import React from 'react';
import { Search, Filter, X, Heart, RotateCcw } from 'lucide-react';
import { GenreType, AreaType, DateFilterType } from '../types/event';
import { GENRE_LIST } from '../constants/genres';
import { AREA_LIST } from '../constants/areas';

// 既存コードとの後方互換性のために型を再エクスポート
export type { GenreType, AreaType } from '../types/event';

interface FilterSidebarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedGenres: GenreType[];
  setSelectedGenres: React.Dispatch<React.SetStateAction<GenreType[]>>;
  selectedAreas: AreaType[];
  setSelectedAreas: React.Dispatch<React.SetStateAction<AreaType[]>>;
  onCloseMobile?: () => void;
  totalCount: number;
  filteredCount: number;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (value: boolean) => void;
  favoritesCount: number;
  dateFilter?: DateFilterType;
  setDateFilter?: (filter: DateFilterType) => void;
}

export default function FilterSidebar({
  searchQuery,
  setSearchQuery,
  selectedGenres,
  setSelectedGenres,
  selectedAreas,
  setSelectedAreas,
  onCloseMobile,
  totalCount,
  filteredCount,
  showFavoritesOnly,
  setShowFavoritesOnly,
  favoritesCount,
  dateFilter = 'all',
  setDateFilter,
}: FilterSidebarProps) {
  const handleGenreToggle = (genre: GenreType) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const handleAreaToggle = (area: AreaType) => {
    setSelectedAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGenres([]);
    setSelectedAreas([]);
    setShowFavoritesOnly(false);
    if (setDateFilter) {
      setDateFilter('all');
    }
  };

  const hasActiveFilters =
    selectedGenres.length > 0 ||
    selectedAreas.length > 0 ||
    searchQuery.trim() !== '' ||
    showFavoritesOnly ||
    dateFilter !== 'all';

  return (
    <div className="flex flex-col h-full bg-slate-950/80 backdrop-blur-2xl border-r border-slate-800/80 text-slate-100 p-6 overflow-y-auto shadow-2xl">
      {/* モバイル用クローズボタンヘッダー */}
      <div className="flex justify-between items-center mb-6 lg:mb-8">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Filter className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-black tracking-widest bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            FILTERS
          </h2>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors lg:hidden border border-slate-800"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 件数表示 */}
      <div className="mb-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-inner">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">イベント表示数</p>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-black text-amber-400 tracking-tight">{filteredCount}</span>
          <span className="text-xs text-slate-400 font-semibold">/ {totalCount} 件中</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="mt-3 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1.5 hover:underline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>フィルターをリセット</span>
          </button>
        )}
      </div>

      {/* お気に入りフィルター */}
      <div className="mb-6">
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${
            showFavoritesOnly
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-lg shadow-rose-500/10'
              : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-rose-400 text-rose-400' : ''}`} />
            <span className="text-xs font-bold">お気に入りのみ表示</span>
          </div>
          {favoritesCount > 0 && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                showFavoritesOnly ? 'bg-rose-400/20 text-rose-300' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {favoritesCount}
            </span>
          )}
        </button>
      </div>

      {/* キーワード検索 */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase mb-2.5">
          キーワード検索
        </label>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="イベント、会場、銘柄など..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 focus:border-amber-400 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all focus:ring-2 focus:ring-amber-400/20"
          />
        </div>
      </div>

      {/* お酒のジャンル選択 */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase mb-2.5 flex items-center justify-between">
          <span>お酒のジャンル</span>
          {selectedGenres.length > 0 && (
            <span className="text-[10px] font-bold bg-amber-400/10 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
              {selectedGenres.length} 選択中
            </span>
          )}
        </label>
        <div className="flex flex-wrap gap-2">
          {GENRE_LIST.map((genre) => {
            const isSelected = selectedGenres.includes(genre.name);
            return (
              <button
                key={genre.name}
                onClick={() => handleGenreToggle(genre.name)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md shadow-amber-400/20 font-black'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <span>{genre.icon}</span>
                <span>{genre.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* エリア選択 */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase mb-2.5 flex items-center justify-between">
          <span>開催エリア（東京近郊）</span>
          {selectedAreas.length > 0 && (
            <span className="text-[10px] font-bold bg-amber-400/10 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
              {selectedAreas.length} 選択中
            </span>
          )}
        </label>
        <div className="space-y-2">
          {AREA_LIST.map((area) => {
            const isChecked = selectedAreas.includes(area.name);
            return (
              <label
                key={area.name}
                className={`flex items-start space-x-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  isChecked
                    ? 'bg-slate-900 border-amber-400/40 text-slate-100 shadow-xs'
                    : 'bg-slate-900/20 border-slate-850 text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleAreaToggle(area.name)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-750 bg-slate-950 text-amber-500 focus:ring-amber-500/30 accent-amber-500"
                />
                <div>
                  <span className="text-xs font-bold block">{area.name}</span>
                  <span className="text-[10px] text-slate-500 block leading-tight mt-0.5 font-medium">
                    {area.desc}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
