'use client';

import React, { useEffect } from 'react';
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
  // Escape キーでモーダルを閉じるアクセシビリティ対応
  useEffect(() => {
    if (!event) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [event, onClose]);

  if (!event) return null;

  const isPastUrl = isPastEventUrl(event.official_url);
  const isSourceUrl = isNewsSourceUrl(event.official_url);
  const absoluteUrl = getAbsoluteUrl(event.official_url);
  const hasOfficialUrl = Boolean(event.official_url && absoluteUrl !== '#');
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
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-40 transition-opacity animate-fade-in"
        aria-hidden="true"
      />

      {/* スライドオーバーパネル (デスクトップ: 右スライド / モバイル: ボトムシート) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-detail-title"
        className="fixed bottom-0 sm:bottom-auto sm:top-0 right-0 max-h-[92vh] sm:max-h-full h-auto sm:h-full w-full sm:w-[480px] bg-slate-950/95 backdrop-blur-2xl border-t sm:border-t-0 sm:border-l border-slate-800 shadow-2xl text-slate-100 z-50 flex flex-col rounded-t-3xl sm:rounded-none animate-slide-in"
      >
        {/* モバイル用ドラッグハンドル */}
        <div className="w-12 h-1.5 bg-slate-700/60 rounded-full mx-auto mt-3 sm:hidden" />

        {/* パネルヘッダー */}
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-800/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Info className="w-4 h-4" />
            </div>
            <span className="text-xs font-black tracking-widest text-slate-300 uppercase">
              EVENT DETAIL
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* お気に入りボタン */}
            {onToggleFavorite && (
              <button
                onClick={() => onToggleFavorite(event.id)}
                className={`p-2 rounded-xl transition-all border ${
                  isFavorite
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-sm'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-rose-400'
                }`}
                title={isFavorite ? 'お気に入りを解除' : 'お気に入りに追加'}
                aria-label={isFavorite ? 'お気に入りを解除' : 'お気に入りに追加'}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-400' : ''}`} />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-100 transition-all"
              aria-label="詳細パネルを閉じる (Esc)"
              title="閉じる (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* パネルボディ (スクロール可能) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* イベント名 */}
          <div>
            <h3
              id="event-detail-title"
              className="text-xl sm:text-2xl font-black tracking-tight text-slate-100 leading-snug"
            >
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
                  className={`px-3 py-1 rounded-full text-xs font-extrabold border ${genreConfig.badgeClass} shadow-xs flex items-center gap-1.5`}
                >
                  <span>{genreConfig.icon}</span>
                  <span>{genre}</span>
                </span>
              );
            })}
            <span className="px-3 py-1 rounded-full text-xs font-bold border bg-slate-900 text-slate-300 border-slate-750 flex items-center space-x-1.5">
              <Tag className="w-3 h-3 text-slate-400" />
              <span>{event.area}</span>
            </span>
          </div>

          {/* イベント詳細情報カード */}
          <div className="space-y-4 bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-inner">
            {/* 日程 */}
            <div className="flex items-start space-x-3.5">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 border border-slate-700">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">開催日程</span>
                <span className="text-sm font-extrabold text-slate-100 block mt-0.5">
                  {formatDateRange(event.start_date, event.end_date)}
                </span>
              </div>
            </div>

            {/* 会場・住所 */}
            <div className="flex items-start space-x-3.5 border-t border-slate-800/80 pt-4">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 border border-slate-700">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">会場・所在地</span>
                <span className="text-sm font-extrabold text-slate-100 block mt-0.5">
                  {event.location_name}
                </span>
                {event.address && (
                  <span className="text-xs text-slate-400 block mt-0.5 leading-relaxed">
                    {event.address}
                  </span>
                )}
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs text-amber-400 hover:text-amber-300 hover:underline transition-colors mt-2.5 font-bold space-x-1"
                >
                  <span>Google マップでルート案内</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* 過去URLの可能性がある場合の警告 */}
          {isPastUrl && (
            <div className="flex items-start space-x-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-extrabold text-amber-300">過去の開催サイトの可能性があります</p>
                <p className="text-slate-300 leading-relaxed">
                  公式サイトURLに過去の年号が含まれています。下部の「Googleでイベントを検索」ボタンから今年度の最新日程・開催要項をご確認ください。
                </p>
              </div>
            </div>
          )}

          {/* イベント概要 */}
          {event.description && (
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">
                イベント概要
              </label>
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-4 text-xs sm:text-sm text-slate-300 leading-relaxed shadow-inner">
                {event.description}
              </div>
            </div>
          )}

          {/* SNS シェアボタン */}
          <div className="space-y-2">
            <label className="flex items-center space-x-1.5 text-xs font-black text-slate-400 uppercase tracking-widest">
              <Share2 className="w-3.5 h-3.5" />
              <span>SNS SHARE</span>
            </label>
            <div className="flex gap-3">
              {/* X (Twitter) シェア */}
              <a
                href={xShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-bold transition-all shadow-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>Xでポスト</span>
              </a>
              {/* LINE シェア */}
              <a
                href={lineShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-[#06C755]/10 hover:bg-[#06C755]/20 border border-[#06C755]/30 hover:border-[#06C755]/50 text-[#06C755] text-xs font-bold transition-all shadow-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
                <span>LINEで送る</span>
              </a>
            </div>
          </div>
        </div>

        {/* パネルフッター (アクションボタン) */}
        <div className="p-5 sm:p-6 border-t border-slate-800/80 bg-slate-950/80 flex flex-col gap-3 shrink-0">
          {/* Googleカレンダーに追加ボタン */}
          <a
            href={googleCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-400 hover:to-blue-400 text-white py-3 px-4 rounded-xl text-xs sm:text-sm font-black tracking-widest text-center flex items-center justify-center space-x-2 transition-all shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-95"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Googleカレンダーに追加</span>
          </a>

          {showSearchAsMain ? (
            <>
              {/* Google 検索ボタン */}
              <a
                href={googleSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 py-3 px-4 rounded-xl text-xs sm:text-sm font-black tracking-widest text-center flex items-center justify-center space-x-2 transition-all shadow-lg shadow-orange-500/15 hover:shadow-orange-500/25 active:scale-95"
              >
                <Search className="w-4 h-4" />
                <span>Googleで最新情報を検索</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              {/* 元のソース記事へのサブリンク */}
              {hasOfficialUrl && (
                <a
                  href={absoluteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 py-2.5 px-4 rounded-xl text-xs font-bold text-center flex items-center justify-center space-x-1.5 transition-all"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>紹介・プレス記事を見る</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </>
          ) : (
            <>
              {/* 公式サイトボタン */}
              <a
                href={absoluteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 py-3 px-4 rounded-xl text-xs sm:text-sm font-black tracking-widest text-center flex items-center justify-center space-x-2 transition-all shadow-lg shadow-orange-500/15 hover:shadow-orange-500/25 active:scale-95"
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
                className="w-full bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 py-2.5 px-4 rounded-xl text-xs font-bold text-center flex items-center justify-center space-x-1.5 transition-all"
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
