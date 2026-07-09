'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'sake-calendar-favorites';

/**
 * お気に入り（ブックマーク）管理用カスタムフック
 * localStorage にイベントIDのリストを保存し、デバイス間でなくとも
 * ブラウザを閉じても状態が維持される。
 */
export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  // localStorage から読み込み (初回マウント時)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: string[] = JSON.parse(stored);
        setFavoriteIds(new Set(parsed));
      }
    } catch (e) {
      console.warn('[Favorites] localStorageの読み込みに失敗しました', e);
    }
    setIsLoaded(true);
  }, []);

  // localStorage への書き込み (状態変更時)
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...favoriteIds]));
    } catch (e) {
      console.warn('[Favorites] localStorageの書き込みに失敗しました', e);
    }
  }, [favoriteIds, isLoaded]);

  const toggleFavorite = useCallback((eventId: string) => {
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  }, []);

  const isFavorite = useCallback((eventId: string) => {
    return favoriteIds.has(eventId);
  }, [favoriteIds]);

  return { favoriteIds, toggleFavorite, isFavorite, isLoaded };
}
