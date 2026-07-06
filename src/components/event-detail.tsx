'use client';

import React from 'react';
import { X, Calendar, MapPin, ExternalLink, Globe, Tag, Info, Search, AlertTriangle } from 'lucide-react';
import { Event } from './calendar-view';

interface EventDetailProps {
  event: Event | null;
  onClose: () => void;
}

const GENRE_BADGES: { [key: string]: string } = {
  '日本酒': 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
  'ビール': 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  'ウイスキー': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'ワイン': 'bg-rose-500/10 text-rose-300 border-rose-500/20',
  'その他': 'bg-slate-500/10 text-slate-300 border-slate-500/20'
};

export default function EventDetail({ event, onClose }: EventDetailProps) {
  if (!event) return null;

  // URLの補正処理 (http:// または https:// で始まらない場合は補完する)
  const getAbsoluteUrl = (url: string | undefined): string => {
    if (!url) return '#';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  // 過去のイベントリンク（前年以前）である可能性を判定する
  const isPastEventUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    const currentYear = new Date().getFullYear(); // 2026
    
    // ニュースや紹介記事自体のドメインは除外
    if (url.includes('prtimes.jp') || url.includes('beergirl.net')) {
      return false;
    }

    // 過去5年分程度の年号がURLに含まれているかチェック
    for (let year = currentYear - 5; year < currentYear; year++) {
      if (url.includes(year.toString())) {
        return true;
      }
    }
    return false;
  };

  const isPastUrl = isPastEventUrl(event.official_url);

  // Google Map検索用のURL作成
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    event.address || event.location_name
  )}`;

  // 日付のフォーマット (YYYY-MM-DD から YYYY年MM月DD日)
  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[0]}年${parts[1]}月${parts[2]}日`;
    }
    return dateStr;
  };

  const isSameDate = event.start_date === event.end_date;

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
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-all border border-transparent hover:border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
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
              const badgeClass = GENRE_BADGES[genre] || GENRE_BADGES['その他'];
              return (
                <span 
                  key={genre}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${badgeClass}`}
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
                  {formatDate(event.start_date)}
                  {!isSameDate && ` 〜 ${formatDate(event.end_date)}`}
                </span>
              </div>
            </div>

            {/* 場所 */}
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
        </div>

        {/* パネルフッター (アクションボタン) */}
        {(() => {
          // 公式サイトURLの性質を判定（ニュースソースか本物の公式サイトか）
          const isSourceUrl = (url: string | undefined): boolean => {
            if (!url) return true;
            return url.includes('prtimes.jp') || url.includes('beergirl.net');
          };

          const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
            event.title + ' ' + (event.location_name || '') + (isPastUrl ? ' 2026 最新' : '')
          )}`;

          const hasOfficialUrl = event.official_url && event.official_url !== '#';
          const showSearchAsMain = !hasOfficialUrl || isSourceUrl(event.official_url) || isPastUrl;

          return (
            <div className="p-6 border-t border-slate-800/50 bg-slate-950/50 flex flex-col gap-3 shrink-0">
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
                      <span>紹介記事（PR TIMES / ビール女子）を見る</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </>
              ) : (
                <>
                  {/* 本物の公式サイトボタン */}
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
          );
        })()}
      </div>

      {/* スライドイン用のカスタム CSS アニメーション */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .animate-slide-in {
          animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </>
  );
}
