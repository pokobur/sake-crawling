import { GoogleGenAI } from '@google/genai';
import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { Event } from '../types/event';
import { formatLocalDate } from '../utils/date';

// 環境変数の読み込み (.env.local または .env)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const IS_DRY_RUN = process.env.DRY_RUN === 'true' || !GEMINI_API_KEY || GEMINI_API_KEY.includes('your-gemini');

const EVENTS_JSON_PATH = path.resolve(process.cwd(), 'src/data/events.json');

// ヘルパー: 負荷対策用のスリープ
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ヘルパー: HTTPリクエスト (User-Agent 偽装)
async function fetchWithUserAgent(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: Status ${response.status}`);
  }
  return response.text();
}

/**
 * 既存の events.json を読み込み
 */
function loadExistingEvents(): Event[] {
  try {
    if (fs.existsSync(EVENTS_JSON_PATH)) {
      const content = fs.readFileSync(EVENTS_JSON_PATH, 'utf-8');
      return JSON.parse(content) as Event[];
    }
  } catch (error) {
    console.warn('[JSON] 既存の events.json の読み込みに失敗しました。空配列から開始します:', error);
  }
  return [];
}

/**
 * events.json にイベント一覧を保存
 */
function saveEventsToJson(events: Event[]): void {
  // 開始日順にソート
  const sorted = [...events].sort((a, b) => a.start_date.localeCompare(b.start_date));
  fs.writeFileSync(EVENTS_JSON_PATH, JSON.stringify(sorted, null, 2), 'utf-8');
  console.log(`[JSON] ${sorted.length} 件のイベントを ${EVENTS_JSON_PATH} に保存しました。`);
}

/**
 * 過去イベントのクリーンアップ処理（終了日が今日より前のイベントを削除）
 */
function cleanupPastEvents(events: Event[]): Event[] {
  const todayStr = formatLocalDate(new Date());
  console.log(`[Cleanup] クリーンアップを開始します。基準日: ${todayStr}`);

  const activeEvents = events.filter((e) => e.end_date >= todayStr);
  const removedCount = events.length - activeEvents.length;
  console.log(`[Cleanup] ${removedCount} 件の終了済み過去イベントをクリーンアップしました。`);

  return activeEvents;
}

/**
 * PR TIMES の RSS フィードからお酒関連のイベント候補を取得
 */
async function fetchPRTimesCandidates(): Promise<{ title: string; url: string; description: string }[]> {
  console.log('[Scraper] PR TIMES RSS フィードの取得を開始します...');
  const candidates: { title: string; url: string; description: string }[] = [];

  try {
    const xml = await fetchWithUserAgent('https://prtimes.jp/index.rdf');
    const $ = cheerio.load(xml, { xmlMode: true });

    const sakeKeywords = [
      '酒',
      '日本酒',
      'ビール',
      'ウイスキー',
      'ワイン',
      'ビア',
      'クラフトビール',
      '焼酎',
      '泡盛',
      '発泡酒',
      'ブランデー',
      '洋酒',
      'リキュール',
    ];
    const eventKeywords = [
      'イベント',
      'フェス',
      '祭り',
      'バル',
      '試飲',
      'ビアガーデン',
      '開催',
      'オープン',
      'マルシェ',
      'カレンダー',
      'スケジュール',
    ];

    $('item').each((_, el) => {
      const title = $(el).find('title').text();
      const link = $(el).find('link').text();
      const description = $(el).find('description').text();

      const hasSake = sakeKeywords.some((kw) => title.includes(kw) || description.includes(kw));
      const hasEvent = eventKeywords.some((kw) => title.includes(kw) || description.includes(kw));

      if (hasSake && hasEvent) {
        candidates.push({ title, url: link, description });
      }
    });

    console.log(`[Scraper] PR TIMES からお酒イベント候補を ${candidates.length} 件抽出しました。`);
  } catch (error) {
    console.error('[Scraper] PR TIMES RSS の取得中にエラーが発生しました:', error);
  }

  return candidates;
}

/**
 * ビール女子のイベントカテゴリから記事候補を取得
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
        candidates.push({ title, url: fullUrl });
      }
    });

    console.log(`[Scraper] ビール女子からイベント記事候補を ${candidates.length} 件抽出しました。`);
  } catch (error) {
    console.error('[Scraper] ビール女子の取得中にエラーが発生しました:', error);
  }

  return candidates;
}

/**
 * Let's enjoy TOKYO からビール・お酒イベント候補を取得
 */
async function scrapeEnjoyTokyo(): Promise<{ title: string; url: string }[]> {
  console.log("[Scraper] Let's enjoy TOKYO イベント一覧の取得を開始します...");
  const candidates: { title: string; url: string }[] = [];

  try {
    const html = await fetchWithUserAgent('https://www.enjoytokyo.jp/feature/season/beer/');
    const $ = cheerio.load(html);

    $('a[href*="/feature/"], a[href*="/event/"], a[href*="/amuse/"]').each((_, el) => {
      const href = $(el).attr('href');
      const title = $(el).text().trim() || $(el).attr('title')?.trim();

      if (href && title && title.length > 5) {
        const fullUrl = href.startsWith('http') ? href : `https://www.enjoytokyo.jp${href}`;
        if (!candidates.some((c) => c.url === fullUrl)) {
          candidates.push({ title, url: fullUrl });
        }
      }
    });

    if (candidates.length === 0) {
      $('.featureList li a, .eventList li a, .articleList li a, .list-item a').each((_, el) => {
        const href = $(el).attr('href');
        const title = $(el).text().trim() || $(el).attr('title')?.trim();

        if (href && title && title.length > 5) {
          const fullUrl = href.startsWith('http') ? href : `https://www.enjoytokyo.jp${href}`;
          if (!candidates.some((c) => c.url === fullUrl)) {
            candidates.push({ title, url: fullUrl });
          }
        }
      });
    }

    console.log(`[Scraper] Let's enjoy TOKYO からイベント候補を ${candidates.length} 件抽出しました。`);
  } catch (error) {
    console.warn('[Scraper] Let\'s enjoy TOKYO の取得をスキップしました (他ソースは継続):', error);
  }

  return candidates;
}

/**
 * TIMEOUT Tokyo からフード・ドリンクイベント候補を取得
 */
async function scrapeTimeoutTokyo(): Promise<{ title: string; url: string }[]> {
  console.log('[Scraper] TIMEOUT Tokyo イベント一覧の取得を開始します...');
  const candidates: { title: string; url: string }[] = [];

  try {
    const html = await fetchWithUserAgent('https://www.timeout.jp/tokyo/ja/food-drink');
    const $ = cheerio.load(html);

    $('article a, .card a, .tile a, .article-card a').each((_, el) => {
      const href = $(el).attr('href');
      const title = $(el).text().trim() || $(el).attr('title')?.trim();

      if (href && title && title.length > 5) {
        const fullUrl = href.startsWith('http') ? href : `https://www.timeout.jp${href}`;
        if (!candidates.some((c) => c.url === fullUrl)) {
          candidates.push({ title, url: fullUrl });
        }
      }
    });

    if (candidates.length === 0) {
      $('a[href*="/tokyo/ja/"]').each((_, el) => {
        const href = $(el).attr('href');
        const title = $(el).text().trim();

        if (href && title && title.length > 8 && !href.endsWith('/food-drink')) {
          const fullUrl = href.startsWith('http') ? href : `https://www.timeout.jp${href}`;
          if (!candidates.some((c) => c.url === fullUrl)) {
            candidates.push({ title, url: fullUrl });
          }
        }
      });
    }

    console.log(`[Scraper] TIMEOUT Tokyo からイベント候補を ${candidates.length} 件抽出しました。`);
  } catch (error) {
    console.warn('[Scraper] TIMEOUT Tokyo の取得をスキップしました (他ソースは継続):', error);
  }

  return candidates;
}

/**
 * 詳細記事のテキストを抽出
 */
async function fetchDetailContent(
  url: string,
  sourceType: 'prtimes' | 'beergirl' | 'enjoytokyo' | 'timeout' | 'generic'
): Promise<string> {
  try {
    const html = await fetchWithUserAgent(url);
    const $ = cheerio.load(html);

    let text = '';
    switch (sourceType) {
      case 'beergirl':
        text = $('.articleDetail, .entry-content, .articleBody').text();
        break;
      case 'enjoytokyo':
        text = $('.featureDetail, .eventDetail, .articleDetail, .mainContent, #main').text();
        break;
      case 'timeout':
        text = $('.article-body, .content-body, [data-testid="article-body"]').text();
        break;
      case 'prtimes':
      default:
        text = $('.r-release_body, .description, article, .content').text();
        break;
    }

    if (!text.trim()) {
      text = $('body').text();
    }

    // 不要な空白を削除して最大3000文字に制限
    return text.replace(/\s+/g, ' ').trim().slice(0, 3000);
  } catch (error) {
    console.error(`[Scraper] 詳細ページの取得に失敗しました (${url}):`, error);
    return '';
  }
}

/**
 * Gemini API によるイベントデータの構造化抽出
 */
async function extractEventDataWithGemini(
  ai: GoogleGenAI,
  text: string,
  sourceUrl: string
): Promise<Event | null> {
  try {
    const currentYear = new Date().getFullYear();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `以下のテキストから「お酒に関するイベント情報」を抽出してください。
現在年は ${currentYear} 年です。日付の年が省略されている場合は、原則として ${currentYear} 年として補完してください。

【厳格な判定条件】
- 東京近郊（東京都、神奈川県、埼玉県、千葉県）で開催されるリアルイベントのみを対象とします。
- オンライン限定イベント、新商品の単なる発売情報、お酒と関係ないイベントの場合は "is_alcohol_event": false としてください。
- 公式サイトURL（official_url）は、イベント専用の公式HPや特設サイトのURLを本文から探してください。もし本文内に公式サイトURLが見当たらない場合は、ソース元のURL（${sourceUrl}）を設定してください。

【テキスト】
${text}`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            is_alcohol_event: {
              type: 'BOOLEAN',
              description: 'テキストがお酒に関する東京近郊のリアルイベント情報である場合は true、そうでない場合は false。',
            },
            event: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING', description: 'イベント名。正式名称を抽出してください。' },
                start_date: { type: 'STRING', description: 'イベント開始日。YYYY-MM-DD 形式。' },
                end_date: { type: 'STRING', description: 'イベント終了日。単発イベントの場合は開始日と同じ日付。YYYY-MM-DD 形式。' },
                location_name: { type: 'STRING', description: '会場名（例：日比谷公園、池袋サンシャインシティなど）' },
                address: { type: 'STRING', description: '住所' },
                genre: {
                  type: 'ARRAY',
                  items: {
                    type: 'STRING',
                    enum: ['日本酒', 'ビール', 'ウイスキー', 'ワイン', 'その他'],
                  },
                  description: '該当するお酒のジャンル。複数選択可能。',
                },
                area: {
                  type: 'STRING',
                  enum: ['城北', '城東', '城山', '城西', '臨海部', 'その他東京近郊'],
                  description:
                    '開催エリア。判定基準: 城北(豊島/北/板橋/練馬)、城東(台東/墨田/江東/荒川/足立/葛飾/江戸川)、城山(品川/大田/目黒/港)、城西(新宿/渋谷/中野/杉並)、臨海部(港区・江東区などの東京湾岸沿い・お台場・有明・豊洲など)、その他東京近郊(東京都下、神奈川、埼玉、千葉など)。',
                },
                official_url: { type: 'STRING', description: '公式サイトのURL。不明な場合はソースURL（${sourceUrl}）を設定。' },
                description: { type: 'STRING', description: 'イベントの短い概要（100文字程度）' },
              },
              required: ['title', 'start_date', 'end_date', 'location_name', 'genre', 'area', 'official_url', 'description'],
            },
          },
          required: ['is_alcohol_event'],
        },
      },
    });

    if (!response.text) return null;

    const result = JSON.parse(response.text);
    if (result.is_alcohol_event && result.event) {
      let url = result.event.official_url ? result.event.official_url.trim() : '';
      if (!url || url === '不明' || url === 'なし' || url === 'null') {
        url = sourceUrl;
      }
      if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(url)) {
          url = `https://${url}`;
        } else {
          url = sourceUrl;
        }
      }
      result.event.official_url = url;
      result.event.id = `event-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      return result.event as Event;
    }
  } catch (error) {
    console.error(`[LLM] Gemini によるデータ抽出中にエラーが発生しました (URL: ${sourceUrl}):`, error);
  }

  return null;
}

/**
 * メイン処理
 */
async function main() {
  console.log('=== お酒イベント自動収集パイプライン 起動 ===');
  if (IS_DRY_RUN) {
    console.log('⚠️ 注意: GEMINI_API_KEY が未設定のため [ドライラン (テストモード)] で実行します。');
  }

  const ai = IS_DRY_RUN || !GEMINI_API_KEY ? null : new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  // 1. 既存データの読み込みと過去イベントのクリーンアップ
  let currentEvents = loadExistingEvents();
  currentEvents = cleanupPastEvents(currentEvents);

  // 2. 各ソースから候補を取得
  const prTimesCandidates = await fetchPRTimesCandidates();
  const beerGirlCandidates = await fetchBeerGirlCandidates();
  const enjoyTokyoCandidates = await scrapeEnjoyTokyo();
  const timeoutTokyoCandidates = await scrapeTimeoutTokyo();

  const allCandidates = [
    ...prTimesCandidates.map((c) => ({ ...c, sourceType: 'prtimes' as const })),
    ...beerGirlCandidates.map((c) => ({ ...c, sourceType: 'beergirl' as const, description: '' })),
    ...enjoyTokyoCandidates.map((c) => ({ ...c, sourceType: 'enjoytokyo' as const, description: '' })),
    ...timeoutTokyoCandidates.map((c) => ({ ...c, sourceType: 'timeout' as const, description: '' })),
  ];

  const maxToProcess = 10;
  console.log(`[Pipeline] 抽出された全候補 ${allCandidates.length} 件のうち、最大 ${maxToProcess} 件を処理します。`);

  let addedCount = 0;

  for (const candidate of allCandidates.slice(0, maxToProcess)) {
    // 既存イベントに同じURLがすでにあればスキップ
    const exists = currentEvents.some((e) => e.official_url === candidate.url);
    if (exists) {
      console.log(`ℹ️ すでに登録済みのイベントのためスキップ: ${candidate.title}`);
      continue;
    }

    console.log(`\n[Pipeline] 処理中: ${candidate.title} (${candidate.url})`);

    const detailText = await fetchDetailContent(candidate.url, candidate.sourceType);
    if (!detailText) {
      console.log('⚠️ 本文が取得できなかったためスキップします。');
      continue;
    }

    let eventData: Event | null = null;
    if (IS_DRY_RUN || !ai) {
      console.log('[LLM] [Dry Run] APIキーがないため、シミュレーションデータを生成します。');
      eventData = {
        id: `mock-${Date.now()}`,
        title: candidate.title,
        start_date: formatLocalDate(new Date()),
        end_date: formatLocalDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
        location_name: '都内イベント会場',
        address: '東京都千代田区',
        genre: ['ビール'],
        area: '城山',
        official_url: candidate.url,
        description: `【自動抽出】${candidate.title}。`,
      };
    } else {
      eventData = await extractEventDataWithGemini(ai, detailText, candidate.url);
    }

    if (eventData) {
      console.log(`✨ 新規イベントを追加: ${eventData.title} (${eventData.start_date})`);
      currentEvents.push(eventData);
      addedCount++;
    } else {
      console.log('ℹ️ お酒イベント条件を満たさないためスキップされました。');
    }

    await sleep(1500);
  }

  // 3. events.json に書き込み保存
  saveEventsToJson(currentEvents);

  console.log('\n=== パイプライン処理完了 ===');
  console.log(`新規追加: ${addedCount} 件 / 合計イベント数: ${currentEvents.length} 件`);
}

main().catch(console.error);
