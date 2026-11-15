import { NextResponse } from 'next/server';
import { EventsApiResponse, Event } from '../../../types/event';
import bundledEvents from '../../../data/events.json';

const GITHUB_EVENTS_RAW_URL =
  'https://raw.githubusercontent.com/pokobur/sake-crawling/main/src/data/events.json';

function isValidEventList(data: unknown): data is Event[] {
  return (
    Array.isArray(data) &&
    data.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof (item as Event).id === 'string' &&
        typeof (item as Event).title === 'string' &&
        typeof (item as Event).start_date === 'string' &&
        typeof (item as Event).end_date === 'string'
    )
  );
}

async function fetchLatestEventsFromGitHub(): Promise<Event[] | null> {
  try {
    const res = await fetch(GITHUB_EVENTS_RAW_URL, {
      next: { revalidate: 300 }, // 5分キャッシュで自動最新化
    });
    if (!res.ok) return null;

    const data: unknown = await res.json();
    if (isValidEventList(data)) {
      return data;
    }
  } catch (error) {
    console.warn('[API] Failed to fetch latest events.json from GitHub, using bundled fallback:', error);
  }
  return null;
}

export async function GET(): Promise<NextResponse<EventsApiResponse>> {
  try {
    const remoteEvents = await fetchLatestEventsFromGitHub();
    const events = remoteEvents ?? (bundledEvents as Event[]);

    // 開始日順にソート
    const sortedEvents = [...events].sort((a, b) => {
      return a.start_date.localeCompare(b.start_date);
    });

    return NextResponse.json({
      events: sortedEvents,
      isMock: false,
    });
  } catch (error) {
    console.error('[API] Failed to load events data:', error);
    return NextResponse.json(
      {
        events: [],
        isMock: false,
        error: 'イベントデータの読み込みに失敗しました。',
      },
      { status: 500 }
    );
  }
}
