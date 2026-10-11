'use client';

import React from 'react';
import {
  X,
  Calendar,
  MapPin,
  ExternalLink,
  Globe,
  Tag,
  Info,
  Search,
  AlertTriangle,
  Heart,
  CalendarPlus,
  Share2,
} from 'lucide-react';
import { Event } from '../types/event';
import { getGenreConfig } from '../constants/genres';
import { formatDateRange, buildGoogleCalendarUrl } from '../utils/date';
import {
  getAbsoluteUrl,
  isPastEventUrl,
  isNewsSourceUrl,
  buildGoogleSearchUrl,
  buildGoogleMapsUrl,
  buildSnsShareUrls,
} from '../utils/url';

interface EventDetailProps {
  event: Event | null;
  onClose: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (eventId: string) => void;
}

export default function EventDetail({
  event,
  onClose,
  isFavorite = false,
  onToggleFavorite,
}: EventDetailProps) {
  if (!event) return null;

  const isPastUrl = isPastEventUrl(event.official_url);
  const isSourceUrl = isNewsSourceUrl(event.official_url);
  const hasOfficialUrl = Boolean(event.official_url && event.official_url !== '#');
  const showSearchAsMain = !hasOfficialUrl || isSourceUrl || isPastUrl;

  const googleMapsUrl = buildGoogleMapsUrl(event.location_name, event.address);
  const googleSearchUrl = buildGoogleSearchUrl(event.title, event.location_name, isPastUrl);
  const googleCalendarUrl = buildGoogleCalendarUrl(event);
  const { xShareUrl, lineShareUrl } = buildSnsShareUrls(event);

  return (
    <>
      {/* 半透明バックドロップ (クリックで閉じる) */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity animate-fade-in"
      />

      {/* スライドオーバーパネル */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[460px] bg-slate-950/90 backdrop-blur-2xl border-l border-slate-800/80 shadow-2xl text-slate-100 z-50 flex flex-col transition-transform duration-300 animate-slide-in">
        {/* パネルヘッダー */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800/50">
          <div className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold tracking-widest text-slate-400 uppercase">
              EVENT DETAIL
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {/* お気に入りボタン */}
            {onToggleFavorite && (
              <button
                onClick={() => onToggleFavorite(event.id)}
                className={`p-1.5 rounded-lg transition-all border ${
                  isFavorite
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 hover:bg-rose-500/30'
                    : 'hover:bg-slate-800 border-transparent hover:border-slate-700 text-slate-400 hover:text-rose-400'
                }`}
                title={isFavorite ? 'お気に入りを解除' : 'お気に入りに追加'}
                aria-label={isFavorite ? 'お気に入りを解除' : 'お気に入りに追加'}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-400' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-all border border-transparent hover:border-slate-700"
              aria-label="閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* パネルボディ (スクロール可能) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* イベント名 */}
          <div>
            <h3 className="text-2xl font-black tracking-tight text-slate-100 leading-tight">
              {event.title}
            </h3>
          </div>

          {/* バッジ（ジャンル & エリア） */}
          <div className="flex flex-wrap gap-2">
            {event.genre.map((genre) => {
              const genreConfig = getGenreConfig(genre);
              return (
                <span
                  key={genre}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${genreConfig.badgeClass}`}
                >
                  {genre}
                </span>
              );
            })}
            <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-slate-800/50 text-slate-300 border-slate-700/50 flex items-center space-x-1">
              <Tag className="w-3 h-3 text-slate-400" />
              <span>{event.area}</span>
            </span>
          </div>

          {/* イベント詳細情報カード */}
          <div className="space-y-4 bg-slate-900/40 border border-slate-800/50 rounded-xl p-5">
            {/* 日程 */}
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-slate-500 block">開催日程</span>
                <span className="text-sm font-semibold text-slate-200">
                  {formatDateRange(event.start_date, event.end_date)}
                </span>
              </div>
            </div>

            {/* 会場・住所 */}
            <div className="flex items-start space-x-3 border-t border-slate-800/50 pt-4">
              <MapPin className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="text-xs text-slate-500 block">会場・住所</span>
                <span className="text-sm font-semibold text-slate-200 block">
                  {event.location_name}
                </span>
                {event.address && (
                  <span className="text-xs text-slate-400 block mt-0.5">
                    {event.address}
                  </span>
                )}
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs text-amber-400 hover:text-amber-300 hover:underline transition-colors mt-2 space-x-1"
                >
                  <span>Google マップでルートを見る</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* 過去URLの可能性がある場合の警告 */}
          {isPastUrl && (
            <div className="flex items-start space-x-2.5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold">過去のイベントサイトの可能性があります</p>
                <p className="text-slate-400 leading-normal">
                  公式サイトのURLに過去の年（2025年など）が含まれています。古い情報やリンク切れである可能性があるため、下部の「Googleでイベントを検索」から今年の最新情報を確認することをお勧めします。
                </p>
              </div>
            </div>
          )}

          {/* イベント概要 (LLM説明) */}
          {event.description && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                イベント概要
              </label>
              <div className="bg-slate-900/20 border border-slate-900 rounded-xl p-4 text-sm text-slate-300 leading-relaxed">
                {event.description}
              </div>
            </div>
          )}

          {/* SNS シェアボタン */}
          <div className="space-y-2">
            <label className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <Share2 className="w-3.5 h-3.5" />
              <span>SHARE</span>
            </label>
            <div className="flex gap-3">
              {/* X (Twitter) シェア */}
              <a
                href={xShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>ポスト</span>
              </a>
              {/* LINE シェア */}
              <a
                href={lineShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-[#06C755]/10 hover:bg-[#06C755]/20 border border-[#06C755]/30 hover:border-[#06C755]/50 text-[#06C755] text-xs font-semibold transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
                <span>LINE</span>
              </a>
            </div>
          </div>
        </div>

        {/* パネルフッター (アクションボタン) */}
        <div className="p-6 border-t border-slate-800/50 bg-slate-950/50 flex flex-col gap-3 shrink-0">
          {/* Googleカレンダーに追加ボタン */}
          <a
            href={googleCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-400 hover:to-blue-400 text-white py-3 px-4 rounded-xl text-sm font-black tracking-widest text-center flex items-center justify-center space-x-2 transition-all shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-95"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Googleカレンダーに追加</span>
          </a>

          {showSearchAsMain ? (
            <>
              {/* Google 検索ボタンをメインに表示 */}
              <a
                href={googleSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 py-3.5 px-4 rounded-xl text-sm font-black tracking-widest text-center flex items-center justify-center space-x-2 transition-all shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-95"
              >
                <Search className="w-4 h-4" />
                <span>Googleでイベントを検索</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              {/* 元のソース記事へのサブリンク */}
              {hasOfficialUrl && (
                <a
                  href={getAbsoluteUrl(event.official_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 py-2.5 px-4 rounded-xl text-xs font-semibold text-center flex items-center justify-center space-x-1.5 transition-all"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>紹介記事を見る</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </>
          ) : (
            <>
              {/* 公式サイトボタン */}
              <a
                href={getAbsoluteUrl(event.official_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 py-3.5 px-4 rounded-xl text-sm font-black tracking-widest text-center flex items-center justify-center space-x-2 transition-all shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-95"
              >
                <Globe className="w-4 h-4" />
                <span>詳細・公式サイトを見る</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              {/* Google 検索へのサブリンク */}
              <a
                href={googleSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 py-2.5 px-4 rounded-xl text-xs font-semibold text-center flex items-center justify-center space-x-1.5 transition-all"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Googleでこのイベントを検索</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </>
          )}
        </div>
      </div>
    </>
  );
}
