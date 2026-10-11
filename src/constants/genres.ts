import { GenreType } from '../types/event';

export interface GenreConfig {
  name: GenreType;
  icon: string;
  badgeClass: string;
  calendar: {
    bg: string;
    text: string;
    dot: string;
  };
  markerColor: string; // HEX for Leaflet markers
}

export const GENRE_CONFIGS: Record<GenreType, GenreConfig> = {
  '日本酒': {
    name: '日本酒',
    icon: '🍶',
    badgeClass: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    calendar: {
      bg: 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30',
      text: 'text-cyan-300',
      dot: 'bg-cyan-400',
    },
    markerColor: '#06b6d4',
  },
  'ビール': {
    name: 'ビール',
    icon: '🍺',
    badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    calendar: {
      bg: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30',
      text: 'text-amber-300',
      dot: 'bg-amber-400',
    },
    markerColor: '#f59e0b',
  },
  'ウイスキー': {
    name: 'ウイスキー',
    icon: '🥃',
    badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    calendar: {
      bg: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30',
      text: 'text-orange-400',
      dot: 'bg-orange-500',
    },
    markerColor: '#f97316',
  },
  'ワイン': {
    name: 'ワイン',
    icon: '🍷',
    badgeClass: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
    calendar: {
      bg: 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30',
      text: 'text-rose-300',
      dot: 'bg-rose-400',
    },
    markerColor: '#f43f5e',
  },
  'その他': {
    name: 'その他',
    icon: '🍹',
    badgeClass: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
    calendar: {
      bg: 'bg-slate-500/10 hover:bg-slate-500/20 border-slate-500/30',
      text: 'text-slate-300',
      dot: 'bg-slate-400',
    },
    markerColor: '#94a3b8',
  },
};

export const GENRE_LIST: GenreConfig[] = Object.values(GENRE_CONFIGS);

export function getGenreConfig(genre: string): GenreConfig {
  return GENRE_CONFIGS[genre as GenreType] || GENRE_CONFIGS['その他'];
}
