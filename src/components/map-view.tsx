'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Event } from './calendar-view';

// Leaflet の CSS と JS はクライアントサイドでのみ動的にインポートする
let L: typeof import('leaflet') | null = null;

interface MapViewProps {
  events: Event[];
  onSelectEvent: (event: Event) => void;
}

// ジャンルごとのマーカー色
const GENRE_MARKER_COLORS: { [key: string]: string } = {
  '日本酒': '#06b6d4',   // cyan-500
  'ビール': '#f59e0b',   // amber-500
  'ウイスキー': '#f97316', // orange-500
  'ワイン': '#f43f5e',   // rose-500
  'その他': '#94a3b8',   // slate-400
};

// カスタムマーカーアイコンを生成
function createMarkerIcon(color: string) {
  if (!L) return undefined;
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 28px; height: 28px;
      background: ${color};
      border: 3px solid rgba(255,255,255,0.9);
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  });
}

// Nominatim API でジオコーディング (キャッシュ付き)
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

async function geocodeAddress(address: string): Promise<[number, number] | null> {
  const cache = getGeoCache();
  if (cache[address]) return cache[address];

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=jp&limit=1`,
      { headers: { 'Accept-Language': 'ja' } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      cache[address] = coords;
      setGeoCache(cache);
      return coords;
    }
  } catch (e) {
    console.warn('[Map] ジオコーディングに失敗しました:', address, e);
  }
  return null;
}

export default function MapView({ events, onSelectEvent }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  // Leaflet の動的インポートとマップの初期化
  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!mapContainerRef.current) return;

      // Leaflet を動的にインポート (SSR回避)
      const leaflet = await import('leaflet');
      L = leaflet;

      // CSS を動的に注入
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (cancelled) return;

      // 既存のマップを破棄
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      // マップを初期化 (東京中心)
      const map = leaflet.map(mapContainerRef.current, {
        center: [35.6762, 139.6503],
        zoom: 11,
        zoomControl: true,
        attributionControl: true,
      });

      // OpenStreetMap タイルレイヤー (ダークテーマ風)
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

        const coords = await geocodeAddress(address);
        if (coords && !cancelled) {
          const primaryGenre = event.genre[0] || 'その他';
          const color = GENRE_MARKER_COLORS[primaryGenre] || GENRE_MARKER_COLORS['その他'];
          const icon = createMarkerIcon(color);

          const marker = leaflet.marker(coords, { icon })
            .addTo(map)
            .bindPopup(`
              <div style="font-family: 'Inter', sans-serif; min-width: 180px;">
                <div style="font-weight: 800; font-size: 13px; color: #f1f5f9; margin-bottom: 4px; line-height: 1.3;">${event.title}</div>
                <div style="font-size: 11px; color: #94a3b8; margin-bottom: 2px;">📍 ${event.location_name}</div>
                <div style="font-size: 11px; color: #94a3b8;">📅 ${event.start_date}</div>
                <div style="margin-top: 8px;">
                  <span style="display: inline-block; background: ${color}22; color: ${color}; border: 1px solid ${color}44; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 600;">${primaryGenre}</span>
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

        // Nominatim のレートリミット対策 (1秒に1リクエスト)
        await new Promise(r => setTimeout(r, 1100));
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
    <div className="relative h-full rounded-2xl overflow-hidden border border-slate-800/80">
      {/* ローディングオーバーレイ */}
      {isLoading && (
        <div className="absolute inset-0 z-[1000] bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
          <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 font-semibold tracking-wider">
            マップを読み込み中... {progress}%
          </p>
        </div>
      )}

      {/* マップコンテナ */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[500px]" />

      {/* ダークテーマ用ポップアップスタイル */}
      <style jsx global>{`
        .dark-popup .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(51, 65, 85, 0.5);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          color: #f1f5f9;
        }
        .dark-popup .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(51, 65, 85, 0.5);
        }
        .dark-popup .leaflet-popup-close-button {
          color: #94a3b8 !important;
        }
        .dark-popup .leaflet-popup-close-button:hover {
          color: #f1f5f9 !important;
        }
        .custom-marker {
          background: none !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
