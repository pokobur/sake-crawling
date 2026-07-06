-- events テーブルの作成
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location_name TEXT NOT NULL,
    address TEXT,
    genre TEXT[] NOT NULL, -- 例: ['日本酒', 'ビール']
    area TEXT NOT NULL,      -- 例: '城北', '城西' など
    official_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- 重複インサートを防ぐユニーク制約（公式サイトURL）
    CONSTRAINT unique_event_url UNIQUE (official_url)
);

-- 検索・絞り込み高速化のためのインデックス
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events (start_date);
CREATE INDEX IF NOT EXISTS idx_events_end_date ON events (end_date);
CREATE INDEX IF NOT EXISTS idx_events_area ON events (area);
