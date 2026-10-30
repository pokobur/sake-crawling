import { Event } from '../types/event';

/**
 * Date オブジェクトからユーザーのローカル時間基準の YYYY-MM-DD 文字列を取得
 * toISOString() は UTC に変換されるため、日本時間(UTC+9)環境で1日前の日付になるバグを防ぐ
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * YYYY-MM-DD 形式の日付文字列を「YYYY年M月D日」に変換
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    return `${year}年${month}月${day}日`;
  }
  return dateStr;
}

/**
 * 開催期間を「YYYY年M月D日 〜 YYYY年M月D日」形式で表示（単日の場合は「YYYY年M月D日」）
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const formattedStart = formatDate(startDate);
  if (!endDate || startDate === endDate) {
    return formattedStart;
  }
  return `${formattedStart} 〜 ${formatDate(endDate)}`;
}

/**
 * 短縮形式の日付範囲表示（リストビューやカード用）
 * 例: "2026/07/20" または "2026/07/20 - 07/22"
 */
export function formatShortDateRange(startDate: string, endDate: string): string {
  if (!startDate) return '';
  const startShort = startDate.replace(/-/g, '/');
  if (!endDate || startDate === endDate) {
    return startShort;
  }
  const endParts = endDate.split('-');
  const endShort = endParts.length === 3 ? `${endParts[1]}/${endParts[2]}` : endDate;
  return `${startShort} - ${endShort}`;
}

/**
 * イベントが今週末（直近の土曜・日曜）に開催中か判定
 */
export function isEventInWeekend(startDate: string, endDate: string): boolean {
  const now = new Date();
  const currentDay = now.getDay(); // 0:日, 1:月, ... 6:土

  // 直近の土曜日の計算
  const saturday = new Date(now);
  const daysUntilSaturday = currentDay === 0 ? -1 : currentDay === 6 ? 0 : 6 - currentDay;
  saturday.setDate(now.getDate() + daysUntilSaturday);

  // 直近の日曜日の計算
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);

  const satStr = formatLocalDate(saturday);
  const sunStr = formatLocalDate(sunday);

  // イベントの期間と [satStr, sunStr] が重複しているか
  return !(endDate < satStr || startDate > sunStr);
}

/**
 * イベントが今月（当月1日〜末日）に開催中か判定
 */
export function isEventInCurrentMonth(startDate: string, endDate: string): boolean {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const firstDayStr = formatLocalDate(firstDay);
  const lastDayStr = formatLocalDate(lastDay);

  // イベントの期間と [firstDayStr, lastDayStr] が重複しているか
  return !(endDate < firstDayStr || startDate > lastDayStr);
}

/**
 * Googleカレンダー登録用URLを生成
 */
export function buildGoogleCalendarUrl(
  event: Pick<Event, 'title' | 'start_date' | 'end_date' | 'location_name' | 'address' | 'description'>
): string {
  const startDateGcal = event.start_date.replace(/-/g, '');

  // 終日イベントの場合、Googleカレンダー仕様として終了日は「翌日」を指定
  const endParts = event.end_date.split('-').map(Number);
  const endDateObj = new Date(endParts[0], endParts[1] - 1, endParts[2] + 1);
  const endDateGcal = formatLocalDate(endDateObj).replace(/-/g, '');

  const location = event.address
    ? `${event.location_name} (${event.address})`
    : event.location_name;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startDateGcal}/${endDateGcal}`,
    location,
    details: event.description || `${event.title}の詳細は公式サイトまたはWeb検索でご確認ください。`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
