
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

  // 提取所有唯一标签，并确保新要求的标签排在前面
  const allTags = useMemo(() => {
    const tags = new Set<string>(['全部']);
    songs.forEach(s => s.tags?.forEach(t => tags.add(t)));
    // 确保一些核心标签即便没数据也可能展示（可选逻辑）
    return Array.from(tags);
  }, [songs]);

  const filteredItems = useMemo(() => {
    const base = activeTab === 'music' ? songs : videos;
    return base.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = selectedTag === '全部' || (activeTab === 'music' && (item as Song).tags?.includes(selectedTag));
      return matchesSearch && matchesTag;
    });
  }, [activeTab, songs, videos, searchQuery, selectedTag]);

  return (
    <div className="h-full flex flex-col p-4 md:p-10 overflow-hidden bg-transparent">
      
      <header className="mb-8 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* 选项卡字体颜色优化：使用亮色 text-white/text-indigo-200 */}
          <div className="bg-white/10 p-1.5 rounded-[2rem] flex space-x-1 shadow-2xl border border-white/10 backdrop-blur-xl">
             <button 
                onClick={() => setActiveTab('music')} 
                className={`px-8 py-3 rounded-[1.5rem] text-xs font-black uppercase transition-all ${activeTab === 'music' ? 'bg-white shadow-md text-indigo-600 scale-105' : 'text-white/40 hover:text-white'}`}
             >
                音乐库
             </button>
             <button 
                onClick={() => setActiveTab('videos')} 
                className={`px-8 py-3 rounded-[1.5rem] text-xs font-black uppercase transition-all ${activeTab === 'videos' ? 'bg-white shadow-md text-indigo-600 scale-105' : 'text-white/40 hover:text-white'}`}
             >
                视频库
             </button>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            {/* 搜索框颜色优化：text-white */}
            <div className="relative flex-1 lg:w-64 group">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-indigo-400 transition-colors text-xs"></i>
              <input 
                type="text" placeholder="快速定位节点..." 
                className="w-full bg-white/10 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-[11px] font-black text-white focus:bg-white/20 outline-none transition-all placeholder-white/20"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={() => onRefresh()}
              className="px-6 py-3 bg-white/10 border border-white/10 rounded-2xl font-black text-[10px] uppercase text-white hover:bg-white/20 transition-all flex items-center shadow-lg"
            >
              <i className="fa-solid fa-rotate mr-2 text-indigo-400"></i>刷新
            </button>
          </div>
        </div>

        {/* 标签过滤栏优化：采用横向滚动和霓虹色调 */}
        {activeTab === 'music' && (
          <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar pb-3 px-1">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`flex-shrink-0 px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${selectedTag === tag ? 'bg-indigo-500 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] scale-110' : 'bg-white/5 border-white/5 text-white/30 hover:text-white hover:border-white/20'}`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-6 md:gap-10">
          {filteredItems.map((item: any) => (
            <div 
              key={item.id} 
              onClick={() => activeTab === 'music' ? onViewDetails(item) : onViewVideoDetails(item)}
              className="group bg-white/[0.03] border border-white/5 rounded-[3.5rem] p-5 hover:bg-white/[0.08] hover:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] transition-all duration-700 cursor-pointer flex flex-col gap-5 border border-white/5"
            >
              <div className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-white/10">
                <img src={item.coverUrl} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000" alt="" />
                <div className="absolute top-4 right-4 flex flex-col gap-2 items-end opacity-0 group-hover:opacity-100 transition-all duration-500">
                  {activeTab === 'music' && item.tags?.slice(0, 3).map((t: string) => (
                    <span key={t} className="px-3 py-1 bg-indigo-500/80 text-white text-[8px] font-black rounded-lg backdrop-blur-md border border-white/10 shadow-lg">{t}</span>
                  ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              
              <div className="flex-1 min-w-0 px-2 pb-2">
                <h4 className="text-[13px] font-black text-white truncate tracking-tighter aurora-text">{item.name}</h4>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest truncate max-w-[70%] italic">{item.artist || 'Cloud Echo'}</p>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if(confirm('确定从云端永久抹除此记录？')) {
                         const key = decodeURIComponent(item.url.split('public/wangyiyun/')[1]);
                         (activeTab === 'music' ? deleteSong(key) : deleteFile(key)).then(() => onRefresh());
                      }
                    }}
                    className="w-8 h-8 rounded-xl bg-white/5 text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all flex items-center justify-center border border-transparent hover:border-red-500/20"
                  >
                    <i className="fa-solid fa-trash-can text-[11px]"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MusicManager;
