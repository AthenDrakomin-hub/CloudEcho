
/**
 * 本地拼音-中文映射字典（核心映射库）
 * 用于在不使用 AI 的情况下，尝试将拼音文件名还原为中文
 */
const PINYIN_MAP: Record<string, string> = {
  'zhebeizi': '这辈子',
  'kongtouzhipiao': '空头支票',
  'shanggan': '伤感',
  'wangyiyun': '网易云',
  'ziye': '子夜',
  'huixiang': '回响',
  'caijing': '财经',
  'renwu': '人物',
  'jianghu': '江湖',
  'dj': 'DJ',
  'piao': '票',
  'emo': 'emo',
  'yihan': '遗憾',
  'qingtian': '晴天',
  'zhoujielun': '周杰伦',
  'chenduxiu': '陈独秀',
  'dongnanya': '东南亚',
  'langzi': '浪子',
  'shinian': '十年',
  'haojiu_bujian': '好久不见'
};

/**
 * 标签自动关联规则
 */
export const AUTO_TAG_RULES: Record<string, string> = {
  'dj': '#DJ',
  'remix': '#DJ',
  'shanggan': '#emo',
  'xinsui': '#emo',
  'emo': '#emo',
  'folks': '#民谣',
  'minyao': '#民谣',
  'ye': '#民谣',
  'jianghu': '#江湖',
  'wuxia': '#江湖',
  'caijing': '#每日财经',
  'money': '#金融播客',
  'finance': '#金融播客',
  'ziye': '#子夜回响',
  'huixiang': '#子夜回响'
};

/**
 * 贪婪算法本地翻译：将拼音文件名还原为中文
 */
export const localTranslate = (text: string): string => {
  if (!text) return '';
  const normalized = text.toLowerCase().replace(/[-_]/g, ' ').trim();
  if (PINYIN_MAP[normalized]) return PINYIN_MAP[normalized];

  const words = normalized.split(/\s+/);
  let result = '';
  let hasHit = false;

  for (const word of words) {
    if (PINYIN_MAP[word]) {
      result += PINYIN_MAP[word];
      hasHit = true;
    } else {
      let current = word;
      let subHit = false;
      // 尝试子字符串匹配
      for (let i = current.length; i >= 2; i--) {
        const sub = current.substring(0, i);
        if (PINYIN_MAP[sub]) {
          result += PINYIN_MAP[sub];
          current = current.substring(i);
          i = current.length + 1;
          subHit = true;
          hasHit = true;
        }
      }
      if (!subHit) result += word;
      else if (current) result += current;
    }
  }

  return hasHit ? result : text;
};

/**
 * 规则引擎：根据标题和艺术家自动提取标签
 */
export const extractLocalTags = (title: string, artist: string): string[] => {
  const tags = new Set<string>();
  const combined = (title + ' ' + artist).toLowerCase();
  
  Object.entries(AUTO_TAG_RULES).forEach(([key, tag]) => {
    if (combined.includes(key)) {
      tags.add(tag);
    }
  });
  
  if (tags.size === 0) tags.add('#DJ');
  return Array.from(tags);
};
