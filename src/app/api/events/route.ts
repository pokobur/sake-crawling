import { NextResponse } from 'next/server';
import { getServerSupabase, isSupabaseConfigured } from '../../../lib/supabase';
import { getMockEvents } from '../../../data/mock-events';
import { EventsApiResponse } from '../../../types/event';

export async function GET(): Promise<NextResponse<EventsApiResponse>> {
  // Supabaseが未設定の場合はモックデータを返す
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      events: getMockEvents(),
      isMock: true,
    });
  }

  try {
    const supabase = getServerSupabase();
    if (!supabase) {
      throw new Error('Supabase client failed to initialize');
    }

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      events: data || [],
      isMock: false,
    });
  } catch (error) {
    console.error('[API] Database connection error. Falling back to mock data:', error);
    return NextResponse.json({
      events: getMockEvents(),
      isMock: true,
      error: 'Database connection failed. Showing mock data.',
    });
  }
}
