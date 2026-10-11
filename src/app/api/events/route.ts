import { NextResponse } from 'next/server';
import { EventsApiResponse, Event } from '../../../types/event';
import rawEvents from '../../../data/events.json';

export async function GET(): Promise<NextResponse<EventsApiResponse>> {
  try {
    const events = rawEvents as Event[];

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
