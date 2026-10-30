'use client';

import React, { useEffect, useState, useRef } from 'react';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Event } from '../types/event';
import { getGenreConfig } from '../constants/genres';
import { findPresetCoordinates } from '../constants/locations';
import { escapeHtml } from '../utils/sanitize';

let L: typeof import('leaflet') | null = null;

interface MapViewProps {
  events: Event[];
  onSelectEvent: (event: Event) => void;
}

// カスタムマーカーアイコンを生成 (サニタイズされたHEXカラーのみ使用)
function createMarkerIcon(color: string) {
  if (!L) return undefined;
  const safeColor = /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : '#f59e0b';

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 30px; height: 30px;
      background: ${safeColor};
      border: 3px solid rgba(255,255,255,0.95);
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      transition: transform 0.2s ease;
    "></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -32],
  });
}

// ジオコーディング (localStorageキャッシュ付き)
const GEO_CACHE_KEY = 'sake-calendar-geocache';

function getGeoCache(): Record<string, [number, number]> {
  try {
    const stored = localStorage.getItem(GEO_CACHE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function setGeoCache(cache: Record<string, [number, number]>) {
  try {
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

async function geocodeAddress(address: string, locationName: string): Promise<[number, number] | null> {
  // 1. まず代表会場マスターから即座に検索 (高速かつ安全)
  const preset = findPresetCoordinates(locationName, address);
  if (preset) return preset;

  // 2. localStorage キャッシュ
  const cacheKey = `${locationName}|${address}`;
  const cache = getGeoCache();
  if (cache[cacheKey]) return cache[cacheKey];
  if (cache[address]) return cache[address];

  // 3. Nominatim API 検索 (フォールバック)
  try {
    const query = address || locationName;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=jp&limit=1`,
      { headers: { 'Accept-Language': 'ja' } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      cache[cacheKey] = coords;
      setGeoCache(cache);
      return coords;
    }
  } catch (e) {
    console.warn('[Map] ジオコーディングに失敗しました:', locationName, address, e);
  }

  return null;
}

export default function MapView({ events, onSelectEvent }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!mapContainerRef.current) return;

      // Leaflet を動的インポート (SSR回避)
      const leaflet = await import('leaflet');
      L = leaflet;

      if (cancelled) return;

      // 既存のマップを安全に破棄
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      // マップ初期化 (東京中心)
      const map = leaflet.map(mapContainerRef.current, {
        center: [35.6762, 139.6503],
        zoom: 11,
        zoomControl: true,
        attributionControl: true,
      });

      // OpenStreetMap タイルレイヤー (CARTO ダークテーマ)
      leaflet.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      // イベントのジオコーディングとマーカー配置
      const total = events.length;
      let processed = 0;

      for (const event of events) {
        if (cancelled) return;

        const address = event.address || event.location_name;
        if (!address) {
          processed++;
          setProgress(Math.round((processed / total) * 100));
          continue;
        }

        const coords = await geocodeAddress(address, event.location_name);
        if (coords && !cancelled) {
          const primaryGenre = event.genre[0] || 'その他';
          const genreConfig = getGenreConfig(primaryGenre);
          const icon = createMarkerIcon(genreConfig.markerColor);

          // XSS 対策: 全ての埋め込みテキストを厳格にエスケープ
          const safeTitle = escapeHtml(event.title);
          const safeLocation = escapeHtml(event.location_name);
          const safeDate = escapeHtml(event.start_date);
          const safeGenre = escapeHtml(primaryGenre);
          const safeMarkerColor = /^#[0-9a-fA-F]{3,8}$/.test(genreConfig.markerColor)
            ? genreConfig.markerColor
            : '#f59e0b';

          const marker = leaflet.marker(coords, { icon })
            .addTo(map)
            .bindPopup(`
              <div style="font-family: inherit; min-width: 190px; padding: 4px 2px;">
                <div style="font-weight: 800; font-size: 13px; color: #f8fafc; margin-bottom: 6px; line-height: 1.4;">${safeTitle}</div>
                <div style="font-size: 11px; color: #94a3b8; margin-bottom: 3px; display: flex; align-items: center; gap: 4px;">
                  <span>📍</span>
                  <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${safeLocation}</span>
                </div>
                <div style="font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 4px;">
                  <span>📅</span>
                  <span>${safeDate}</span>
                </div>
                <div style="margin-top: 10px; display: flex; align-items: center; justify-content: space-between;">
                  <span style="display: inline-block; background: ${safeMarkerColor}22; color: ${safeMarkerColor}; border: 1px solid ${safeMarkerColor}55; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700;">${safeGenre}</span>
                  <span style="font-size: 10px; color: #fbbf24; font-weight: 600;">詳細を見る →</span>
                </div>
              </div>
            `, {
              className: 'dark-popup',
            });

          marker.on('click', () => {
            onSelectEvent(event);
          });

          markersRef.current.push(marker);
        }

        processed++;
        setProgress(Math.round((processed / total) * 100));

        // プリセット・キャッシュ以外の場合のみレートリミットウェイト
        if (!findPresetCoordinates(event.location_name, address)) {
          await new Promise(r => setTimeout(r, 600));
        }
      }

      if (!cancelled) setIsLoading(false);
    }

    initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current = [];
    };
  }, [events, onSelectEvent]);

  return (
    <div className="relative h-full rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl bg-slate-950">
      {/* ローディングオーバーレイ */}
      {isLoading && (
        <div className="absolute inset-0 z-[1000] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center space-y-4">
          <div className="w-56 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-300 font-semibold tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            マップと会場を照合中... {progress}%
          </p>
        </div>
      )}

      {/* マップコンテナ */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[500px]" />

      {/* ダークテーマ用ポップアップスタイル */}
      <style jsx global>{`
        .dark-popup .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(251, 191, 36, 0.2);
          border-radius: 14px;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6);
          color: #f1f5f9;
        }
        .dark-popup .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(251, 191, 36, 0.2);
        }
        .dark-popup .leaflet-popup-close-button {
          color: #94a3b8 !important;
          padding: 6px !important;
        }
        .dark-popup .leaflet-popup-close-button:hover {
          color: #f8fafc !important;
        }
        .custom-marker {
          background: none !important;
          border: none !important;
        }
        .custom-marker:hover div {
          transform: rotate(-45deg) scale(1.15) !important;
        }
      `}</style>
    </div>
  );
}
