/**
 * 本地拼音-中文映射字典（深度优化版）
 * 包含常用音乐标签、情绪词汇及用户提供的特定文案
 */
const PINYIN_MAP: Record<string, string> = {
  // 基础词汇
  // 移除了重复的 'bei', 'zi', 'ye' 键以修复语法错误
  'zhe': '这', 'bei': '辈', 'zi': '子', 'wo': '我', 'ni': '你', 'ta': '他',
  'ai': '爱', 'hen': '恨', 'tong': '痛', 'ku': '苦', 'le': '乐',
  'ye': '夜', 'se': '色', 'hui': '回', 'xiang': '响',
  
  // 组合词
  'zhebeizi': '这辈子',
  'zhe bei zi': '这辈子',
  'wo de': '我的',
  'ni de': '你的',
  'kongtouzhipiao': '空头支票',
  'kong tou zhi piao': '空头支票',
  'renjianshuge': '人间失格',
  'ren jian shi ge': '人间失格',
  'shanggan': '伤感',
  'shang gan': '伤感',
  'shiqu': '失去',
  'shi qu': '失去',
  'huiyi': '回忆',
  'hui yi': '回忆',
  'gudu': '孤独',
  'gu du': '孤独',
  'weilai': '未来',
  'wei lai': '未来',
  'fangshou': '放手',
  'fang shou': '放手',
  'dj': 'DJ',
  'remix': '重混',
  'wangyiyun': '网易云',
  'wang yiyun': '网易云',
  'gequ': '歌曲',
  'ge qu': '歌曲',
  'pinyin': '拼音',
  'yisheng': '一生',
  'yi sheng': '一生',
  'shiguang': '时光',
  'shi guang': '时光',
  'wuhui': '无悔',
  'wu hui': '无悔',
  'nanshou': '难受',
  'nan shou': '难受',
  'xin sui': '心碎',
  'xinsui': '心碎',
  'wuye': '午夜',
  'wu ye': '午夜',
  'diantai': '电台',
  'dian tai': '电台'
};

/**
 * 动态翻译引擎
 * 支持空格分词、连写检测及部分翻译
 */
export const localTranslate = (text: string): string => {
  if (!text) return '';
  
  // 处理常见的连接符
  const normalized = text.toLowerCase().replace(/[-_]/g, ' ').trim();
  
  // 1. 尝试全字匹配
  if (PINYIN_MAP[normalized]) {
    return PINYIN_MAP[normalized];
  }

  // 2. 尝试分词匹配 (空格分隔)
  const words = normalized.split(/\s+/);
  let result = '';
  let foundAny = false;

  for (const word of words) {
    if (PINYIN_MAP[word]) {
      result += PINYIN_MAP[word];
      foundAny = true;
    } else {
      // 尝试对连写的单词进行简单的贪婪匹配（模拟拼音输入法）
      let tempWord = word;
      let subResult = '';
      let subFound = false;
      
      // 这里的逻辑比较简单，仅作示意，实际中拼音切分较复杂
      // 优先匹配长词
      for (const [key, val] of Object.entries(PINYIN_MAP)) {
        if (tempWord.includes(key) && key.length > 2) {
          tempWord = tempWord.replace(key, val);
          subFound = true;
          foundAny = true;
        }
      }
      result += subFound ? tempWord : word;
    }
  }

  return foundAny ? result : text;
};