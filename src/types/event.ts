export type GenreType = '日本酒' | 'ビール' | 'ウイスキー' | 'ワイン' | 'その他';

export type AreaType = '城北' | '城東' | '城山' | '城西' | '臨海部' | 'その他東京近郊';

export type ViewMode = 'calendar' | 'list' | 'map';

export interface Event {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  location_name: string;
  address?: string;
  genre: GenreType[];
  area: AreaType;
  official_url?: string;
  description?: string;
  created_at?: string;
}

export interface EventsApiResponse {
  events: Event[];
  isMock: boolean;
  error?: string;
}
