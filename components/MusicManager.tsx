
import React, { useState, useMemo } from 'react';
import { Song, Video, NotificationType } from '../types';
import { deleteSong, deleteFile } from '../services/s3Service';

interface MusicManagerProps {
  songs: Song[];
  videos: Video[];
  onRefresh: () => void;
  onNotify: (message: string, type: NotificationType) => void;
  onViewDetails: (song: Song) => void;
  onViewVideoDetails: (video: Video) => void;
}

const MusicManager: React.FC<MusicManagerProps> = ({ 
  songs, videos, onRefresh, onNotify, onViewDetails, onViewVideoDetails 
}) => {
  const [activeTab, setActiveTab] = useState<'music' | 'videos'>('music');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('全部');

  const MOOD_TAGS = [
    { label: '全部', color: 'gray', query: '全部' },
    { label: '伤感', color: 'indigo', query: '伤感' },
    { label: 'DJ 热歌', color: 'pink', query: 'DJ' },
    { label: '深夜民谣', color: 'purple', query: '民谣' },
    { label: '空头支票', color: 'red', query: '空头支票' },
    { label: '孤独', color: 'cyan', query: '孤独' }
  ];

  const filteredItems = useMemo(() => {
    const base = activeTab === 'music' ? songs : videos;
    return base.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.artist.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesTag = selectedTag === '全部';
      if (!matchesTag && activeTab === 'music') {
        const songTags = (item as Song).tags?.map(t => t.toLowerCase()) || [];
        const normalizedSelected = selectedTag.toLowerCase();
        
        matchesTag = songTags.some(t => {
            if (normalizedSelected === 'dj 热歌') return t.includes('dj');
            if (normalizedSelected === '伤感') return t.includes('emo') || t.includes('伤感');
            if (normalizedSelected === '深夜民谣') return t.includes('民谣');
            if (normalizedSelected === '空头支票') return t.includes('空头支票');
            return t.includes(normalizedSelected) || t.replace('#', '').includes(normalizedSelected);
        });
      }
      
      return matchesSearch && matchesTag;
    });
  }, [activeTab, songs, videos, searchQuery, selectedTag]);

  return (
    <div className="h-full flex flex-col p-4 md:p-8 overflow-hidden bg-transparent">
      
      <header className="mb-8 space-y-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-6">
              <h2 className="text-2xl md:text-3xl font-[900] text-white tracking-tighter italic aurora-text leading-none">内容库管理</h2>
              <div className="bg-white/10 p-1 rounded-xl flex border border-white/10 backdrop-blur-3xl">
                <button 
                    onClick={() => {setActiveTab('music'); setSelectedTag('全部');}} 
                    className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all duration-300 ${activeTab === 'music' ? 'bg-white shadow-xl text-black' : 'text-white/60 hover:text-white'}`}
                >
                    单曲音频
                </button>
                <button 
                    onClick={() => {setActiveTab('videos'); setSelectedTag('全部');}} 
                    className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all duration-300 ${activeTab === 'videos' ? 'bg-white shadow-xl text-black' : 'text-white/60 hover:text-white'}`}
                >
                    精选视频
                </button>
              </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64 group">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-indigo-400 transition-colors text-sm"></i>
              <input 
                type="text" placeholder="快速过滤名称..." 
                className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-12 pr-4 text-xs font-black text-white focus:bg-white/20 outline-none transition-all placeholder-white/40"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={() => onRefresh()}
              className="w-12 h-12 bg-indigo-600 border border-indigo-400 rounded-xl flex items-center justify-center text-white shadow-lg hover:scale-105 active:scale-95 transition-all group"
            >
              <i className="fa-solid fa-rotate group-hover:rotate-180 transition-transform duration-700"></i>
            </button>
          </div>
        </div>

        {activeTab === 'music' && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest italic mr-2">分类过滤:</span>
            {MOOD_TAGS.map(mood => (
              <button 
                key={mood.label}
                onClick={() => setSelectedTag(mood.label)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all border ${selectedTag === mood.label ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg' : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/40'}`}
              >
                {mood.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pr-1 pb-32">
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40 space-y-6 py-20 text-center">
             <i className="fa-solid fa-box-open text-6xl text-white/20"></i>
             <div className="space-y-2">
               <p className="text-sm font-black uppercase tracking-[0.4em] text-white">列表空空如也</p>
               <p className="text-[10px] font-bold text-white/40">尝试更换关键词或刷新库</p>
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 md:gap-6">
            {filteredItems.map((item: any) => (
              <div 
                key={item.id} 
                onClick={() => activeTab === 'music' ? onViewDetails(item) : onViewVideoDetails(item)}
                className="group virtual-list-item bg-white/[0.04] border border-white/10 rounded-2xl p-3 md:p-4 hover:bg-white/[0.1] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-500 cursor-pointer flex flex-col gap-4 relative ring-1 ring-white/5 overflow-hidden"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/20">
                  <img src={item.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" alt="" />
                  
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black scale-50 group-hover:scale-100 transition-transform">
                         <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                      </div>
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if(confirm('确定要从云端物理抹除此文件吗？此操作不可逆！')) {
                        const key = decodeURIComponent(item.url.split('public/wangyiyun/')[1]);
                        (activeTab === 'music' ? deleteSong(key) : deleteFile(key)).then(() => onRefresh());
                      }
                    }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/80 text-white/60 hover:text-red-500 hover:bg-red-500/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                  >
                    <i className="fa-solid fa-trash-can text-[10px]"></i>
                  </button>
                </div>
                
                <div className="flex-1 min-w-0 pb-1">
                  <h4 className="text-[11px] md:text-[13px] font-black text-white truncate tracking-tight group-hover:text-indigo-300 transition-colors leading-tight">{item.name}</h4>
                  <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest truncate mt-1 group-hover:text-white/80 transition-colors italic">{item.artist || '子夜回响'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicManager;
