
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
    { label: '孤独', color: 'cyan', query: '孤独' },
    { label: '故事感', color: 'amber', query: '有故事' }
  ];

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    MOOD_TAGS.forEach(m => tags.add(m.label));
    songs.forEach(s => s.tags?.forEach(t => {
        if (t.includes('DJ')) tags.add('DJ 热歌');
        else if (t.includes('emo') || t.includes('伤感')) tags.add('伤感');
        else tags.add(t.startsWith('#') ? t.slice(1) : t);
    }));
    return Array.from(tags);
  }, [songs]);

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
    <div className="h-full flex flex-col p-5 md:p-8 overflow-hidden bg-transparent">
      
      <header className="mb-6 md:mb-8 space-y-6 md:space-y-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-5 md:gap-6">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <h2 className="text-2xl md:text-4xl font-[900] text-white tracking-tighter italic aurora-text leading-none">我的音乐库</h2>
              <p className="text-[7px] md:text-[8px] font-black text-white/30 uppercase tracking-[0.4em] mt-1.5">Storage Node Mapping</p>
          </div>

          <div className="bg-white/5 p-1 rounded-2xl flex shadow-xl border border-white/5 backdrop-blur-3xl">
             <button 
                onClick={() => {setActiveTab('music'); setSelectedTag('全部');}} 
                className={`px-6 md:px-8 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase transition-all duration-500 ${activeTab === 'music' ? 'bg-white shadow-lg text-black' : 'text-white/30 hover:text-white'}`}
             >
                音频
             </button>
             <button 
                onClick={() => {setActiveTab('videos'); setSelectedTag('全部');}} 
                className={`px-6 md:px-8 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase transition-all duration-500 ${activeTab === 'videos' ? 'bg-white shadow-lg text-black' : 'text-white/30 hover:text-white'}`}
             >
                视频
             </button>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64 group">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors text-[10px] md:text-xs"></i>
              <input 
                type="text" placeholder="定位存储节点..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 md:py-3 pl-10 md:pl-12 pr-4 text-[10px] md:text-xs font-black text-white focus:bg-white/10 outline-none transition-all placeholder-white/20"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={() => onRefresh()}
              className="w-10 h-10 md:w-12 md:h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-indigo-500 transition-all group"
            >
              <i className="fa-solid fa-rotate group-hover:rotate-180 transition-transform duration-700 text-xs"></i>
            </button>
          </div>
        </div>

        {activeTab === 'music' && (
          <div className="flex flex-col space-y-3 md:space-y-4 bg-white/[0.02] border border-white/5 p-4 md:p-6 rounded-2xl md:rounded-[2rem] shadow-inner">
             <div className="flex items-center space-x-3 md:space-x-4">
                <span className="text-[8px] md:text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em] italic">情感映射:</span>
                <div className="flex-1 h-[1px] bg-white/5"></div>
             </div>
             <div className="flex flex-wrap items-center gap-2 md:gap-3">
                {MOOD_TAGS.map(mood => (
                  <button 
                    key={mood.label}
                    onClick={() => setSelectedTag(mood.label)}
                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[8px] md:text-[10px] font-black tracking-widest uppercase transition-all border flex items-center gap-2 ${selectedTag === mood.label ? 'bg-white text-black border-white shadow-md scale-105' : 'bg-white/5 border-white/5 text-white/30 hover:text-white hover:border-white/20'}`}
                  >
                    {selectedTag === mood.label && <span className={`w-1 h-1 rounded-full bg-indigo-500`}></span>}
                    {mood.label}
                  </button>
                ))}
                
                {allTags.filter(t => !MOOD_TAGS.some(m => m.label === t)).map(tag => (
                   <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[8px] md:text-[10px] font-black uppercase transition-all border ${selectedTag === tag ? 'bg-indigo-500 border-indigo-400 text-white shadow-md scale-105' : 'bg-white/5 border-white/5 text-white/20 hover:text-white'}`}
                   >
                     #{tag}
                   </button>
                ))}
             </div>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pr-1 pb-24">
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-6 py-20">
             <i className="fa-solid fa-box-open text-4xl md:text-6xl"></i>
             <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.8em]">当前维度未发现数据块</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {filteredItems.map((item: any) => (
              <div 
                key={item.id} 
                onClick={() => activeTab === 'music' ? onViewDetails(item) : onViewVideoDetails(item)}
                className="group bg-white/[0.03] border border-white/5 rounded-2xl md:rounded-[2.5rem] p-3 md:p-4 hover:bg-white/[0.08] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,1)] transition-all duration-700 cursor-pointer flex flex-col gap-3 md:gap-4 ring-1 ring-white/5"
              >
                <div className="relative aspect-square rounded-xl md:rounded-[2rem] overflow-hidden shadow-xl ring-1 ring-white/10 group-hover:scale-[1.03] transition-transform duration-700">
                  <img src={item.coverUrl} className="w-full h-full object-cover grayscale-[15%] group-hover:grayscale-0 transition-all duration-700" alt="" />
                  <div className="absolute top-2 right-2 flex flex-col gap-1 items-end opacity-0 group-hover:opacity-100 transition-all duration-500">
                    {activeTab === 'music' && item.tags?.slice(0, 1).map((t: string) => (
                      <span key={t} className="px-2 py-1 bg-black/60 text-white text-[6px] md:text-[7px] font-black rounded-md backdrop-blur-md border border-white/10 shadow-lg uppercase tracking-widest">{t}</span>
                    ))}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-2xl text-black">
                         <i className="fa-solid fa-magnifying-glass-plus text-xs"></i>
                      </div>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 px-1 pb-1">
                  <h4 className="text-[11px] md:text-[13px] font-black text-white truncate tracking-tighter italic group-hover:aurora-text transition-all duration-500">{item.name}</h4>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-[8px] md:text-[9px] font-black text-white/20 uppercase tracking-[0.1em] truncate max-w-[70%] italic group-hover:text-indigo-400 transition-colors">{item.artist || 'Cloud Echo'}</p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if(confirm('确定抹除此记录？')) {
                           const key = decodeURIComponent(item.url.split('public/wangyiyun/')[1]);
                           (activeTab === 'music' ? deleteSong(key) : deleteFile(key)).then(() => onRefresh());
                        }
                      }}
                      className="w-7 h-7 rounded-lg bg-white/5 text-white/10 hover:text-red-500 hover:bg-red-500/20 transition-all flex items-center justify-center border border-transparent hover:border-red-500/20"
                    >
                      <i className="fa-solid fa-trash-can text-[8px] md:text-[10px]"></i>
                    </button>
                  </div>
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
