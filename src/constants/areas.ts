import { AreaType } from '../types/event';

export interface AreaConfig {
  name: AreaType;
  desc: string;
}

export const AREA_LIST: AreaConfig[] = [
  { name: '城北', desc: '豊島・北・板橋・練馬' },
  { name: '城東', desc: '台東・墨田・江東・葛飾など' },
  { name: '城山', desc: '品川・大田・目黒・港' },
  { name: '城西', desc: '新宿・渋谷・中野・杉並' },
  { name: '臨海部', desc: 'お台場・有明・豊洲などの湾岸' },
  { name: 'その他東京近郊', desc: '東京都下・神奈川・埼玉・千葉' },
];
