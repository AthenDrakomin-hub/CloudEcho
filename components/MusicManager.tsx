
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
    <div className="h-full flex flex-col p-4 md:p-6 overflow-hidden bg-transparent">
      
      <header className="mb-4 md:mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
              <h2 className="text-xl md:text-2xl font-[900] text-white tracking-tighter italic aurora-text leading-none">音乐库</h2>
              <div className="bg-white/5 p-0.5 rounded-lg flex border border-white/5 backdrop-blur-3xl">
                <button 
                    onClick={() => {setActiveTab('music'); setSelectedTag('全部');}} 
                    className={`px-4 py-1.5 rounded-md text-[8px] font-black uppercase transition-all duration-500 ${activeTab === 'music' ? 'bg-white shadow-md text-black' : 'text-white/30 hover:text-white'}`}
                >
                    音频
                </button>
                <button 
                    onClick={() => {setActiveTab('videos'); setSelectedTag('全部');}} 
                    className={`px-4 py-1.5 rounded-md text-[8px] font-black uppercase transition-all duration-500 ${activeTab === 'videos' ? 'bg-white shadow-md text-black' : 'text-white/30 hover:text-white'}`}
                >
                    视频
                </button>
              </div>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-56 group">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors text-[9px]"></i>
              <input 
                type="text" placeholder="快速定位..." 
                className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-9 pr-3 text-[9px] font-black text-white focus:bg-white/10 outline-none transition-all placeholder-white/10"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={() => onRefresh()}
              className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-indigo-500 transition-all group"
            >
              <i className="fa-solid fa-rotate group-hover:rotate-180 transition-transform duration-700 text-[10px]"></i>
            </button>
          </div>
        </div>

        {activeTab === 'music' && (
          <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
            <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest italic mr-2">映射器:</span>
            {MOOD_TAGS.map(mood => (
              <button 
                key={mood.label}
                onClick={() => setSelectedTag(mood.label)}
                className={`px-2.5 py-1 rounded-md text-[8px] font-black tracking-widest uppercase transition-all border ${selectedTag === mood.label ? 'bg-white text-black border-white shadow-sm scale-105' : 'bg-white/5 border-white/5 text-white/20 hover:text-white hover:border-white/20'}`}
              >
                {mood.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pr-1 pb-24">
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-4 py-20">
             <i className="fa-solid fa-box-open text-3xl"></i>
             <p className="text-[7px] font-black uppercase tracking-[0.5em]">未发现共鸣</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10 gap-2 md:gap-3">
            {filteredItems.map((item: any) => (
              <div 
                key={item.id} 
                onClick={() => activeTab === 'music' ? onViewDetails(item) : onViewVideoDetails(item)}
                className="group virtual-list-item bg-white/[0.02] border border-white/5 rounded-lg p-1.5 md:p-2 hover:bg-white/[0.06] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,1)] transition-all duration-500 cursor-pointer flex flex-col gap-2 relative ring-1 ring-white/5 overflow-hidden"
              >
                <div className="relative aspect-square rounded-md overflow-hidden shadow-lg ring-1 ring-white/10">
                  <img src={item.coverUrl} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500 scale-105 group-hover:scale-100" alt="" />
                  
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <div className="w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center text-black scale-50 group-hover:scale-100 transition-transform">
                         <i className="fa-solid fa-magnifying-glass-plus text-[10px]"></i>
                      </div>
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if(confirm('抹除记录？')) {
                        const key = decodeURIComponent(item.url.split('public/wangyiyun/')[1]);
                        (activeTab === 'music' ? deleteSong(key) : deleteFile(key)).then(() => onRefresh());
                      }
                    }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-md bg-black/80 text-white/20 hover:text-red-500 hover:bg-red-500/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                  >
                    <i className="fa-solid fa-trash-can text-[7px]"></i>
                  </button>
                </div>
                
                <div className="flex-1 min-w-0 pb-1">
                  <h4 className="text-[9px] md:text-[10px] font-black text-white truncate tracking-tight group-hover:text-indigo-300 transition-colors leading-tight">{item.name}</h4>
                  <p className="text-[7px] font-bold text-white/10 uppercase tracking-tighter truncate mt-0.5 group-hover:text-white/30 transition-colors italic">{item.artist || 'Echo'}</p>
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
