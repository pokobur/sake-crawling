import { Event } from '../types/event';
import { formatDate } from './date';

/**
 * URLが安全なHTTP / HTTPSプロトコルであるか判定
 */
export function isSafeUrl(url: string | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();

  // 空文字または # のみはセーフ（ページ内リンク等）
  if (trimmed === '#' || trimmed === '') return true;

  // 危険なスキームをブラックリスト遮断
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return false;
  }

  // http / https で始まるか、または有効なドメイン形式か
  try {
    const parsed = new URL(trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * URLがプロトコルで始まっていない場合に https:// を補正し、危険なスキームを無害化
 */
export function getAbsoluteUrl(url: string | undefined): string {
  if (!url) return '#';
  const trimmed = url.trim();

  // 危険なスキームは強制的に '#' に無害化
  if (!isSafeUrl(trimmed)) {
    return '#';
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return '#';
}

/**
 * 公式サイトURLが過去年（今年より前の年号）を含むか判定
 */
export function isPastEventUrl(url: string | undefined): boolean {
  if (!url) return false;
  const currentYear = new Date().getFullYear();

  // ニュースソース自体のURL（過去記事URLの再利用等）は除外
  if (isNewsSourceUrl(url)) {
    return false;
  }

  // 直近5年分の過去年号が含まれているかチェック
  for (let year = currentYear - 5; year < currentYear; year++) {
    if (url.includes(year.toString())) {
      return true;
    }
  }
  return false;
}

/**
 * ニュースサイトやプレスリリースサイト自体のドメインかを判定
 */
export function isNewsSourceUrl(url: string | undefined): boolean {
  if (!url) return false;
  return (
    url.includes('prtimes.jp') ||
    url.includes('beergirl.net') ||
    url.includes('enjoytokyo.jp') ||
    url.includes('timeout.jp')
  );
}

/**
 * Google 検索用URLを生成
 */
export function buildGoogleSearchUrl(title: string, locationName?: string, isPastUrl = false): string {
  const currentYear = new Date().getFullYear();
  const query = [
    title,
    locationName || '',
    isPastUrl ? `${currentYear} 最新` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/**
 * Google マップ検索用URLを生成
 */
export function buildGoogleMapsUrl(locationName: string, address?: string): string {
  const query = address || locationName;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * SNSシェア用URL（X / LINE）を生成
 */
export function buildSnsShareUrls(event: Pick<Event, 'title' | 'location_name' | 'start_date' | 'official_url'>) {
  const formattedDate = formatDate(event.start_date);
  const shareText = `🍺 ${event.title} @ ${event.location_name}（${formattedDate}）#お酒イベント`;
  const shareUrl = event.official_url ? getAbsoluteUrl(event.official_url) : '';
  const safeShareUrl = shareUrl !== '#' ? shareUrl : '';

  const xShareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}${
    safeShareUrl ? `&url=${encodeURIComponent(safeShareUrl)}` : ''
  }`;

  const lineTargetUrl = safeShareUrl || buildGoogleSearchUrl(event.title, event.location_name);
  const lineShareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(lineTargetUrl)}`;

  return { xShareUrl, lineShareUrl };
}
