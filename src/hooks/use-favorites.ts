'use client';

import { useSyncExternalStore, useCallback } from 'react';

const STORAGE_KEY = 'sake-calendar-favorites';

// メモリ上のキャッシュ
let cachedFavoritesRaw: string | null = null;
let cachedFavoritesSet: Set<string> = new Set();

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(listener => listener());
}

function getFavoritesSnapshot(): Set<string> {
  if (typeof window === 'undefined') {
    return cachedFavoritesSet;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== cachedFavoritesRaw) {
      cachedFavoritesRaw = raw;
      cachedFavoritesSet = raw ? new Set(JSON.parse(raw)) : new Set();
    }
  } catch (e) {
    console.warn('[Favorites] localStorage read error:', e);
  }
  return cachedFavoritesSet;
}

function getServerSnapshot(): Set<string> {
  return new Set();
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cachedFavoritesRaw = null; // キャッシュ破棄
      callback();
    }
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', handleStorage);
  };
}

/**
 * useSyncExternalStore を用いたお気に入りカスタムフック
 * レンダリングカスケードを防止し、React 19 / Next.js のベストプラクティスに準拠
 */
export function useFavorites() {
  const favoriteIds = useSyncExternalStore(
    subscribe,
    getFavoritesSnapshot,
    getServerSnapshot
  );

  const toggleFavorite = useCallback((eventId: string) => {
    try {
      const current = getFavoritesSnapshot();
      const next = new Set(current);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      const raw = JSON.stringify([...next]);
      localStorage.setItem(STORAGE_KEY, raw);
      cachedFavoritesRaw = raw;
      cachedFavoritesSet = next;
      notify();
    } catch (e) {
      console.warn('[Favorites] localStorage write error:', e);
    }
  }, []);

  const isFavorite = useCallback(
    (eventId: string) => {
      return favoriteIds.has(eventId);
    },
    [favoriteIds]
  );

  return { favoriteIds, toggleFavorite, isFavorite, isLoaded: true };
}
