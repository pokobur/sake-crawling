import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// モック用の高品質なイベントデータ（Supabase未設定時またはエラー時のフォールバック用）
function getMockEvents() {
  const today = new Date();
  
  // 今月の日付を動的に計算するヘルパー
  const getRelativeDateStr = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'mock-1',
      title: '日比谷オクトーバーフェスト 2026 Summer',
      start_date: getRelativeDateStr(2),
      end_date: getRelativeDateStr(12),
      location_name: '日比谷公園 噴水広場',
      address: '東京都千代田区日比谷公園１−６',
      genre: ['ビール'],
      area: '城山',
      official_url: 'https://oktober-fest.jp/hibiya/',
      description: '本場ドイツのビールとソーセージが楽しめる、都内最大級のオクトーバーフェスト。爽やかな青空の下で極上の1杯を。',
      created_at: today.toISOString()
    },
    {
      id: 'mock-2',
      title: '日本酒天国 in 池袋 2026',
      start_date: getRelativeDateStr(5),
      end_date: getRelativeDateStr(5),
      location_name: '池袋サンシャインシティ 展示ホールB',
      address: '東京都豊島区東池袋３丁目１−４',
      genre: ['日本酒'],
      area: '城北',
      official_url: 'https://sake-tengoku-ikebukuro.org/',
      description: '全国から50以上の蔵元が集結！大人気の銘柄から入手困難な限定酒まで、心ゆくまで試飲が楽しめる日本酒ファンのための祭典。',
      created_at: today.toISOString()
    },
    {
      id: 'mock-3',
      title: 'クラフトビール列車 2026',
      start_date: getRelativeDateStr(19),
      end_date: getRelativeDateStr(19),
      location_name: '西武新宿駅（発着）',
      address: '東京都新宿区歌舞伎町１丁目３０−１',
      genre: ['ビール'],
      area: '城西',
      official_url: 'https://beergirl.net/shima-beertrain_e/',
      description: '【ビール女子×志摩醸造コラボ】特別貸切列車で移動しながら、クラフトビール飲み放題と車内でのペアリングおつまみを楽しむプレミアム体験。',
      created_at: today.toISOString()
    },
    {
      id: 'mock-4',
      title: 'TOKYO WINE FESTIVAL in お台場',
      start_date: getRelativeDateStr(-2), // 過去〜未来にまたがるイベント
      end_date: getRelativeDateStr(3),
      location_name: 'お台場シンボルプロムナード公園',
      address: '東京都江東区青海１丁目１',
      genre: ['ワイン'],
      area: '臨海部',
      official_url: 'https://tokyo-wine-fes.com/',
      description: '東京湾を望む絶景ロケーションで、世界のワイン100種以上を飲み比べ。心地よい海風を感じながらお気に入りの1本を見つけましょう。',
      created_at: today.toISOString()
    },
    {
      id: 'mock-5',
      title: 'ウイスキー＆スピリッツ ラヴァーズ TOKYO',
      start_date: getRelativeDateStr(12),
      end_date: getRelativeDateStr(13),
      location_name: '浅草花やしきホール',
      address: '東京都台東区浅草２丁目２８−１',
      genre: ['ウイスキー', 'その他'],
      area: '城東',
      official_url: 'https://whisky-lovers-tokyo.jp/',
      description: 'ジャパニーズウイスキーから海外のレアボトル、ジンやラムなどのクラフトスピリッツまで網羅した、大人のためのテイスティングイベント。',
      created_at: today.toISOString()
    },
    {
      id: 'mock-6',
      title: '吉祥寺 秋の立ち飲みバル巡り 2026',
      start_date: getRelativeDateStr(25),
      end_date: getRelativeDateStr(28),
      location_name: '吉祥寺ハモニカ横丁周辺',
      address: '東京都武蔵野市吉祥寺本町１丁目１',
      genre: ['日本酒', 'ビール', 'ワイン', 'その他'],
      area: 'その他東京近郊',
      official_url: 'https://kichijoji-bar-crawl.net/',
      description: '吉祥寺の人気飲食店をはしご酒！参加バッジを購入すると、各店自慢の限定おつまみとお酒のセットがお得に楽しめる街歩きイベント。',
      created_at: today.toISOString()
    },
    {
      id: 'mock-7',
      title: '横浜みなとみらい クラフトビールフェスタ',
      start_date: getRelativeDateStr(8),
      end_date: getRelativeDateStr(10),
      location_name: '臨港パーク',
      address: '神奈川県横浜市西区みなとみらい１丁目１−１',
      genre: ['ビール'],
      area: 'その他東京近郊',
      official_url: 'https://mm-craftbeer-festa.com/',
      description: '神奈川県の地元マイクロブルワリーを中心に、日本全国から人気のクラフトビールが集結。ステージライブ演奏と共に乾杯！',
      created_at: today.toISOString()
    }
  ];
}

export async function GET() {
  // Supabaseが未設定の場合はモックデータを返す
  const isSupabaseConfigured = 
    SUPABASE_URL && 
    SUPABASE_SERVICE_ROLE_KEY && 
    !SUPABASE_URL.includes('your-supabase-project');

  if (!isSupabaseConfigured) {
    console.log('[API] Supabase credentials not set. Returning mock data.');
    return NextResponse.json({ events: getMockEvents(), isMock: true });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // イベントデータを全件取得
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ events: data || [], isMock: false });
  } catch (error) {
    console.error('[API] Database connection error. Falling back to mock data:', error);
    // エラー時はフェイルセーフとしてモックデータを返却
    return NextResponse.json({ events: getMockEvents(), isMock: true, error: 'Database connection failed. Showing mock data.' });
  }
}
