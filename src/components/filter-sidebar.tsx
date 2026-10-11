'use client';

import React from 'react';
import { Search, Filter, X, Heart } from 'lucide-react';
import { GenreType, AreaType } from '../types/event';
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
  };

  const hasActiveFilters =
    selectedGenres.length > 0 ||
    selectedAreas.length > 0 ||
    searchQuery.trim() !== '' ||
    showFavoritesOnly;

  return (
    <div className="flex flex-col h-full bg-slate-950/70 backdrop-blur-xl border-r border-slate-800 text-slate-100 p-6 overflow-y-auto">
      {/* モバイル用クローズボタンヘッダー */}
      <div className="flex justify-between items-center mb-6 lg:mb-8">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-bold tracking-wider bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            FILTERS
          </h2>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors lg:hidden"
            aria-label="閉じる"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* 件数表示 */}
      <div className="mb-6 p-4 rounded-lg bg-slate-900/50 border border-slate-800/80">
        <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">イベント表示数</p>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-amber-400">{filteredCount}</span>
          <span className="text-sm text-slate-400">/ {totalCount} 件中</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="mt-3 text-xs text-amber-400 hover:text-amber-300 hover:underline transition-colors flex items-center"
          >
            フィルターをクリア
          </button>
        )}
      </div>

      {/* お気に入りフィルター */}
      <div className="mb-8">
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
            showFavoritesOnly
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 shadow-lg shadow-rose-500/5'
              : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-rose-400 text-rose-400' : ''}`} />
            <span className="text-sm font-semibold">お気に入りのみ表示</span>
          </div>
          {favoritesCount > 0 && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                showFavoritesOnly ? 'bg-rose-400/20 text-rose-300' : 'bg-slate-800 text-slate-500'
              }`}
            >
              {favoritesCount}
            </span>
          )}
        </button>
      </div>

      {/* キーワード検索 */}
      <div className="mb-8">
        <label className="block text-xs font-semibold text-slate-400 tracking-wider uppercase mb-3">
          キーワード検索
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="イベント、会場、住所など..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 focus:border-amber-500 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all focus:ring-1 focus:ring-amber-500/20"
          />
        </div>
      </div>

      {/* お酒のジャンル選択 */}
      <div className="mb-8">
        <label className="block text-xs font-semibold text-slate-400 tracking-wider uppercase mb-3 flex items-center justify-between">
          <span>お酒のジャンル</span>
          {selectedGenres.length > 0 && (
            <span className="text-[10px] bg-amber-400/10 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/20">
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
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-lg shadow-amber-400/10 scale-105'
                    : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
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
      <div className="mb-8">
        <label className="block text-xs font-semibold text-slate-400 tracking-wider uppercase mb-3 flex items-center justify-between">
          <span>開催エリア（東京近郊）</span>
          {selectedAreas.length > 0 && (
            <span className="text-[10px] bg-amber-400/10 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/20">
              {selectedAreas.length} 選択中
            </span>
          )}
        </label>
        <div className="space-y-2.5">
          {AREA_LIST.map((area) => {
            const isChecked = selectedAreas.includes(area.name);
            return (
              <label
                key={area.name}
                className={`flex items-start space-x-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  isChecked
                    ? 'bg-slate-900 border-amber-500/50 text-slate-100'
                    : 'bg-slate-900/20 border-slate-900 text-slate-400 hover:bg-slate-900/55 hover:text-slate-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleAreaToggle(area.name)}
                  className="mt-1 h-4 w-4 rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500/30 accent-amber-500"
                />
                <div>
                  <span className="text-sm font-semibold block">{area.name}</span>
                  <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
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
