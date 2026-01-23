
import { Quote } from './types';

export const S3_CONFIG = {
  endpoint: 'https://zlbemopcgjohrnyyiwvs.storage.supabase.co/storage/v1/s3',
  region: 'ap-south-1',
  accessKeyId: 'ba6e8c48abfa6b6c6226c75aa59d1acf',
  secretAccessKey: '278cc809ba584fcccebd097ec4e148d58d1cabca2c0d782548837e5419037288',
  bucketName: 'wangyiyun', 
  folderPrefix: 'free music/',
  videoFolderPrefix: 'jingxuanshipin/'
};

export const EDGE_FUNCTION_CONFIG = {
  baseUrl: 'https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/wangyiyun-storage',
  devKey: 'ba6e8c48abfa6b6c6226c75aa59d1acf' 
};

export const BRAND_COLORS = {
  neteaseRed: '#E60026',
  neteaseDark: '#050505',
  auroraIndigo: '#4f46e5',
  midnightBlue: '#020617'
};

export const EMOTIONAL_QUOTES: Quote[] = [
  { id: 22, category: 'sad', content: '我这辈子得到了很多空头支票，小时候爸妈答应买的玩具，恋人口中的永远。' },
  { id: 101, category: 'sad', content: '东南亚的晚风很潮湿，像极了在异乡深夜里偷偷擦掉的眼泪。' },
  { id: 106, category: 'sad', content: 'DJ 震得碎的是耳膜，震不碎的是心底那份挥之不去的落寞。' },
  { id: 107, category: 'sad', content: '我们在最没有能力的年纪，遇到了那个最想承诺一生的人。' },
  { id: 108, category: 'sad', content: '所谓的浪子，不过是把那些没兑现的“永远”，换成了不同城市的烈酒。' },
  { id: 109, category: 'sad', content: '这张名为“未来”的空头支票，我还要在异乡透支多少年？' },
  { id: 102, category: 'sad', content: '网易云最扎心的评论：你努力合群的样子，真的很孤独。' },
  { id: 110, category: 'sad', content: '东南亚深夜电台：给每一个不回家的灵魂，找个能安放遗憾的地方。' },
  { id: 104, category: 'sad', content: '有时候，我们听的不是歌，而是那个无法言说的自己。' },
  { id: 105, category: 'sad', content: '生活是一场明目张胆的欺骗，而我们却在为了那张空头支票拼命。' },
  { id: 1, category: 'sad', content: '现在的状态，不是不开心，也不是难过，就是一种淡淡的无能为力和麻木。' },
  { id: 111, category: 'sad', content: '酒杯里晃动的不是冰块，是那些被我们嚼碎了咽下去的乡愁。' }
];

export const DEFAULT_COVERS = [
  'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1514525253361-bee87184f830?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1510784722466-f2aa9c52ff6f?auto=format&fit=crop&q=80&w=1200'
];
