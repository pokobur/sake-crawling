import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 環境変数の読み込み (.env.local または .env)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 簡易的なドライラン（テスト）モードの判定
const IS_DRY_RUN = process.env.DRY_RUN === 'true' || !SUPABASE_URL || SUPABASE_URL.includes('your-supabase') || !GEMINI_API_KEY || GEMINI_API_KEY.includes('your-gemini');

interface EventData {
  title: string;
  start_date: string;
  end_date: string;
  location_name: string;
  address: string;
  genre: ('日本酒' | 'ビール' | 'ウイスキー' | 'ワイン' | 'その他')[];
  area: '城北' | '城東' | '城山' | '城西' | '臨海部' | 'その他東京近郊';
  official_url: string;
  description: string;
}

// ヘルパー: 負荷対策用のスリープ
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ヘルパー: HTTPリクエスト (User-Agent 偽装)
async function fetchWithUserAgent(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: Status ${response.status}`);
  }
  return response.text();
}

/**
 * 1. データベースのクリーンアップ処理
 * 開催終了日が今日より前のイベントを削除
 */
async function cleanupPastEvents(supabase: any) {
  const todayStr = new Date().toISOString().split('T')[0];
  console.log(`[Cleanup] クリーンアップを開始します。基準日: ${todayStr}`);

  if (IS_DRY_RUN) {
    console.log(`[Cleanup] [Dry Run] 基準日 ${todayStr} より前の過去イベントの削除をシミュレートします。`);
    return;
  }

  try {
    const { count, error } = await supabase
      .from('events')
      .delete({ count: 'exact' })
      .lt('end_date', todayStr);

    if (error) {
      throw error;
    }

    console.log(`[Cleanup] ${count || 0}件の過去イベントを削除しました。`);
  } catch (error) {
    console.error('[Cleanup] クリーンアップ中にエラーが発生しました:', error);
  }
}

/**
 * 2. PR TIMES の RSS フィードからお酒関連のイベント候補を取得
 */
async function fetchPRTimesCandidates(): Promise<{ title: string; url: string; description: string }[]> {
  console.log('[Scraper] PR TIMES RSS フィードの取得を開始します...');
  const candidates: { title: string; url: string; description: string }[] = [];

  try {
    const xml = await fetchWithUserAgent('https://prtimes.jp/index.rdf');
    const $ = cheerio.load(xml, { xmlMode: true });

    // お酒関連およびイベント関連のキーワード
    const sakeKeywords = ['酒', '日本酒', 'ビール', 'ウイスキー', 'ワイン', 'ビア', 'クラフトビール', '焼酎', '泡盛', '発泡酒', 'ブランデー', '洋酒', 'リキュール'];
    const eventKeywords = ['イベント', 'フェス', '祭り', 'バル', '試飲', 'ビアガーデン', '開催', 'オープン', 'マルシェ', 'カレンダー', 'スケジュール'];

    $('item').each((_, el) => {
      const title = $(el).find('title').text();
      const link = $(el).find('link').text();
      const description = $(el).find('description').text();

      // キーワードによる簡易フィルタリング
      const hasSake = sakeKeywords.some(kw => title.includes(kw) || description.includes(kw));
      const hasEvent = eventKeywords.some(kw => title.includes(kw) || description.includes(kw));

      if (hasSake && hasEvent) {
        candidates.push({
          title,
          url: link,
          description
        });
      }
    });

    console.log(`[Scraper] PR TIMES からお酒イベント候補を ${candidates.length} 件抽出しました。`);
  } catch (error) {
    console.error('[Scraper] PR TIMES RSS の取得中にエラーが発生しました:', error);
  }

  return candidates;
}

/**
 * 3. ビール女子のイベントカテゴリから記事候補を取得
 */
async function fetchBeerGirlCandidates(): Promise<{ title: string; url: string }[]> {
  console.log('[Scraper] ビール女子 イベントカテゴリの取得を開始します...');
  const candidates: { title: string; url: string }[] = [];

  try {
    const html = await fetchWithUserAgent('https://beergirl.net/category/event/');
    const $ = cheerio.load(html);

    $('.articleList.block2 li').each((_, el) => {
      const href = $(el).find('h3 a').attr('href');
      const title = $(el).find('h3 a').text().trim();

      if (href) {
        const fullUrl = href.startsWith('http') ? href : `https://beergirl.net${href}`;
        candidates.push({
          title,
          url: fullUrl
        });
      }
    });

    console.log(`[Scraper] ビール女子からイベント記事候補を ${candidates.length} 件抽出しました。`);
  } catch (error) {
    console.error('[Scraper] ビール女子の取得中にエラーが発生しました:', error);
  }

  return candidates;
}

/**
 * 4. 詳細ページの本文テキストを抽出
 */
async function fetchDetailContent(url: string, isBeerGirl: boolean): Promise<string> {
  try {
    const html = await fetchWithUserAgent(url);
    const $ = cheerio.load(html);

    let text = '';
    if (isBeerGirl) {
      // ビール女子の本文要素
      text = $('.post .content').text() || $('.post').text() || $('#main').text();
    } else {
      // PR TIMES の本文要素 (一般的なプレスリリース本文は .release-body など)
      text = $('.release-body').text() || $('.description').text() || $('#main').text();
    }

    // 不要な空白文字の整理
    return text.replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error(`[Scraper] 詳細ページ (${url}) の取得に失敗しました:`, error);
    return '';
  }
}

/**
 * 5. Gemini API を使用してお酒イベント情報の判定と構造化
 */
async function extractEventDataWithGemini(ai: GoogleGenAI, text: string, sourceUrl: string): Promise<EventData | null> {
  const prompt = `
以下のテキストは、Webサイトから取得したプレスリリースまたはイベント紹介記事の本文です。
このテキストの内容を分析し、以下の条件を満たす「お酒に関するイベント（日本酒、ビール、ウイスキー、ワイン、フェス、試飲会など）の開催情報」であるかを判定してください。

【対象とするイベントの条件】
1. 主にお酒（日本酒、ビール、ウイスキー、ワイン、その他のアルコール）がテーマ、または提供されるイベントであること。
2. 東京近郊（東京都、神奈川県、埼玉県、千葉県など）で開催されるリアルイベントであること（オンライン限定、東京近郊以外での開催、または単なる新商品の発売・業務提携などのニュースは対象外）。
3. 開催スケジュール（開始日・終了日）が明記されていること。

テキスト：
${text}

ソースURL: ${sourceUrl}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            is_alcohol_event: {
              type: 'BOOLEAN',
              description: 'テキストがお酒に関する東京近郊のリアルイベント情報である場合は true、そうでない場合は false。'
            },
            event: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING', description: 'イベント名。魅力的な正式名称を抽出してください。' },
                start_date: { type: 'STRING', description: 'イベント開始日。YYYY-MM-DD 形式。' },
                end_date: { type: 'STRING', description: 'イベント終了日。単発イベントの場合は開始日と同じ日付。YYYY-MM-DD 形式。' },
                location_name: { type: 'STRING', description: '会場名（例：池袋サンシャインシティ、日比谷公園など）' },
                address: { type: 'STRING', description: '住所（可能な限り市区町村や番地まで詳細に）' },
                genre: {
                  type: 'ARRAY',
                  items: {
                    type: 'STRING',
                    enum: ['日本酒', 'ビール', 'ウイスキー', 'ワイン', 'その他']
                  },
                  description: '該当するお酒のジャンル。複数選択可能。'
                },
                area: {
                  type: 'STRING',
                  enum: ['城北', '城東', '城山', '城西', '臨海部', 'その他東京近郊'],
                  description: '開催エリア。判定基準: 城北(豊島/北/板橋/練馬)、城東(台東/墨田/江東/荒川/足立/葛飾/江戸川)、城山(品川/大田/目黒/港)、城西(新宿/渋谷/中野/杉並)、臨海部(港区・江東区などの東京湾岸沿い・お台場・有明・豊洲など)、その他東京近郊(東京都下、神奈川、埼玉、千葉など)。'
                },
                official_url: { type: 'STRING', description: '公式サイトのURL。不明な場合はソースURL（${sourceUrl}）をそのまま設定。' },
                description: { type: 'STRING', description: 'イベントの短い概要（100文字程度）' }
              },
              required: ['title', 'start_date', 'end_date', 'location_name', 'genre', 'area', 'official_url', 'description']
            }
          },
          required: ['is_alcohol_event']
        }
      }
    });

    if (!response.text) return null;

    const result = JSON.parse(response.text);
    if (result.is_alcohol_event && result.event) {
      let url = result.event.official_url ? result.event.official_url.trim() : '';
      if (!url || url === '不明' || url === 'なし' || url === 'null') {
        url = sourceUrl;
      }
      // プロトコル補完
      if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(url)) {
          url = `https://${url}`;
        } else {
          url = sourceUrl;
        }
      }
      result.event.official_url = url;
      return result.event as EventData;
    }
  } catch (error) {
    console.error(`[LLM] Gemini によるデータ抽出中にエラーが発生しました (URL: ${sourceUrl}):`, error);
  }

  return null;
}

/**
 * 6. 抽出したイベントデータを Supabase に upsert
 */
async function saveEventToDatabase(supabase: any, event: EventData) {
  if (IS_DRY_RUN) {
    console.log('[DB] [Dry Run] 以下のデータをデータベースに保存したと仮定します:');
    console.log(JSON.stringify(event, null, 2));
    return;
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .upsert(event, { onConflict: 'official_url' });

    if (error) {
      throw error;
    }

    console.log(`[DB] 保存成功: ${event.title}`);
  } catch (error) {
    console.error(`[DB] 保存中にエラーが発生しました (${event.title}):`, error);
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('=== お酒イベント自動収集パイプライン 起動 ===');
  if (IS_DRY_RUN) {
    console.log('⚠️ 注意: 環境変数が未設定、またはプレースホルダーのため [ドライラン (テストモード)] で実行します。実際のDB保存やGemini API呼び出しはシミュレートされるか、一部制限されます。');
  }

  // クライアント初期化
  const supabase = IS_DRY_RUN ? null : createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
  const ai = IS_DRY_RUN && !GEMINI_API_KEY ? null : new GoogleGenAI({ apiKey: GEMINI_API_KEY || 'DUMMY_KEY' });

  // 1. クリーンアップ
  await cleanupPastEvents(supabase);

  // 2. 候補リストの取得
  const prTimesCandidates = await fetchPRTimesCandidates();
  const beerGirlCandidates = await fetchBeerGirlCandidates();

  // 3. 詳細取得・構造化・保存
  const allCandidates = [
    ...prTimesCandidates.map(c => ({ ...c, isBeerGirl: false })),
    ...beerGirlCandidates.map(c => ({ ...c, isBeerGirl: true, description: '' }))
  ];

  // 負荷対策のため、順番に処理
  let processedCount = 0;
  let savedCount = 0;

  // テスト時は上限を低くする (PR TIMES, ビール女子それぞれ最新3件程度)
  const maxToProcess = 10; 
  console.log(`[Pipeline] 抽出された全候補 ${allCandidates.length} 件のうち、最大 ${maxToProcess} 件を処理します。`);

  for (const candidate of allCandidates.slice(0, maxToProcess)) {
    processedCount++;
    console.log(`\n[Pipeline] (${processedCount}/${maxToProcess}) 処理中: ${candidate.title}`);
    console.log(`[Pipeline] ソースURL: ${candidate.url}`);

    // 詳細ページ本文取得
    const detailText = await fetchDetailContent(candidate.url, candidate.isBeerGirl);
    if (!detailText) {
      console.log('⚠️ 本文が取得できなかったためスキップします。');
      continue;
    }

    // Gemini APIによる構造化 (ドライランモードでAPIキーもない場合はモックデータを生成)
    let eventData: EventData | null = null;
    if (IS_DRY_RUN && (!GEMINI_API_KEY || GEMINI_API_KEY.includes('your-gemini'))) {
      console.log('[LLM] [Dry Run] APIキーがないため、モックデータを生成します。');
      // モックデータの生成
      eventData = {
        title: candidate.title,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        location_name: candidate.isBeerGirl ? '下北沢SHELTER' : '池袋サンシャインシティ',
        address: candidate.isBeerGirl ? '東京都世田谷区北沢２丁目６−１０' : '東京都豊島区東池袋３丁目１',
        genre: candidate.isBeerGirl ? ['ビール'] : ['日本酒', 'その他'],
        area: candidate.isBeerGirl ? '城西' : '城北',
        official_url: candidate.url,
        description: `【モックデータ】${candidate.title}。お酒と音楽を同時に楽しめる夏限定のフェスティバル。`
      };
    } else if (ai) {
      eventData = await extractEventDataWithGemini(ai, detailText, candidate.url);
    }

    if (eventData) {
      console.log(`✨ イベント情報として検出されました: ${eventData.title} (${eventData.genre.join(', ')})`);
      await saveEventToDatabase(supabase, eventData);
      savedCount++;
    } else {
      console.log('ℹ️ お酒イベント情報ではない、または判定基準を満たさないためスキップされました。');
    }

    // 負荷防止ウェイト (1.5秒)
    await sleep(1500);
  }

  console.log('\n=== パイプライン処理完了 ===');
  console.log(`処理した候補: ${processedCount} 件 / 保存したイベント: ${savedCount} 件`);
}

main().catch(console.error);
