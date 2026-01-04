
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

export const EMOTIONAL_QUOTES: Quote[] = [
  { id: 1, category: 'sad', content: '我这辈子得到了很多空头支票，小时候爸妈答应买的玩具，旅途中和朋友的约定，恋人口中的永远。' },
  { id: 2, category: 'sad', content: '我清楚且明白这是一个永恒的谎言，即便如此我还是会在脑海里把万一实现的场景演了练一千遍。' },
  { id: 3, category: 'sad', content: '这个世界太尖锐了，不允许我哭，却赐予了我很多痛苦，怎么痛也痛不完，我痛恨这一切。' },
  { id: 4, category: 'sad', content: '后来才明白，原来什么都可以是假，只有痛苦是真的。' },
  { id: 5, category: 'sad', content: '爱是裹了奶油的狗屎，你总是傻傻的赌它是一块蛋糕，抿到一点甜就相信它是甜的。' },
  { id: 6, category: 'sad', content: '品尝到奇怪的味道只怀疑自己的味觉出了问题，直到内部腐烂的气味传来，露出了它本来的面目，我才明白自己又错了。' },
  { id: 7, category: 'sad', content: '无所谓 命不好的人 怎么走都是错 甚至 有时我也想问问为什么。' },
  { id: 8, category: 'sad', content: '你看不到我爆仓时掉眼泪，你只知道我好起来会带你高消费。' },
  { id: 9, category: 'sad', content: '泪眼朦胧间 我看到那年17岁的少女扎着高马尾站在黄昏里 笑意盈盈的对我说 宝宝 往前走 别原谅她 她不是我。' },
  { id: 10, category: 'sad', content: '我想我已经接受了我们的现状，现在却如云烟一般消散了，没有未来，也回不去了。' },
  { id: 11, category: 'sad', content: '情绪不好的时候 问问自己 是不是又在强求不属于自己。' }
];

export const DEFAULT_COVERS = [
  'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1514525253361-bee87184f830?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800'
];
