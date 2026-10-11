'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Event, GenreType, AreaType, EventsApiResponse } from '../types/event';

export interface UseEventsFilters {
  searchQuery: string;
  selectedGenres: GenreType[];
  selectedAreas: AreaType[];
  showFavoritesOnly: boolean;
}

export function useEvents(
  filters: UseEventsFilters,
  isFavorite: (id: string) => boolean
) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [fetchIndex, setFetchIndex] = useState(0);

  const { searchQuery, selectedGenres, selectedAreas, showFavoritesOnly } = filters;

  const refetch = useCallback(() => {
    setLoading(true);
    setFetchIndex(prev => prev + 1);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/events');
        if (!res.ok) {
          throw new Error('APIの取得に失敗しました。');
        }
        const data: EventsApiResponse = await res.json();
        if (!isCancelled) {
          setEvents(data.events || []);
          setIsMock(Boolean(data.isMock));
          setError(null);
        }
      } catch (err: unknown) {
        console.error('[useEvents] Failed to fetch events:', err);
        if (!isCancelled) {
          setError('イベントデータの取得中にエラーが発生しました。');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isCancelled = true;
    };
  }, [fetchIndex]);

  // フィルタリング処理（useMemoで最適化）
  const filteredEvents = useMemo(() => {
    let result = events;

    // 1. お気に入りフィルター
    if (showFavoritesOnly) {
      result = result.filter(event => isFavorite(event.id));
    }

    // 2. キーワード検索
    const trimmedQuery = searchQuery.trim().toLowerCase();
    if (trimmedQuery !== '') {
      result = result.filter(event => {
        return (
          event.title.toLowerCase().includes(trimmedQuery) ||
          event.location_name.toLowerCase().includes(trimmedQuery) ||
          (event.address && event.address.toLowerCase().includes(trimmedQuery)) ||
          (event.description && event.description.toLowerCase().includes(trimmedQuery))
        );
      });
    }

    // 3. お酒ジャンル（OR検索）
    if (selectedGenres.length > 0) {
      result = result.filter(event =>
        event.genre.some(g => selectedGenres.includes(g))
      );
    }

    // 4. エリア（OR検索）
    if (selectedAreas.length > 0) {
      result = result.filter(event =>
        selectedAreas.includes(event.area)
      );
    }

    return result;
  }, [events, searchQuery, selectedGenres, selectedAreas, showFavoritesOnly, isFavorite]);

  return {
    events,
    filteredEvents,
    loading,
    error,
    isMock,
    refetch,
  };
}
