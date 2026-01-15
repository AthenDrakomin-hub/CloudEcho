
import React, { useState, useMemo } from 'react';
import { Song, Video, Playlist, NotificationType } from '../types';
import { deleteSong, deleteFile } from '../services/s3Service';
import { getPlaylists, createPlaylist } from '../services/playlistService';

const MusicManager: React.FC<any> = ({ songs, videos, onRefresh, onNotify, onViewDetails, onViewVideoDetails, onViewPlaylist }) => {
  const [activeTab, setActiveTab] = useState<'music' | 'videos' | 'playlists'>('music');
  const [query, setQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const data = useMemo(() => {
    let base = activeTab === 'music' ? songs : activeTab === 'videos' ? videos : getPlaylists();
    if (query) {
      const q = query.toLowerCase();
      base = base.filter((item: any) => (item.name || '').toLowerCase().includes(q) || (item.artist || '').toLowerCase().includes(q));
    }
    return base;
  }, [activeTab, songs, videos, query]);

  const handleDelete = async (e: any, item: any) => {
    e.stopPropagation();
    if (!confirm('确定要物理抹除此映射记录吗？')) return;
    const path = decodeURIComponent(item.url.split('public/wangyiyun/')[1]);
    const success = await (activeTab === 'music' ? deleteSong(path) : deleteFile(path));
    if (success) { onNotify('物理抹除成功', 'success'); onRefresh(); }
  };

  const handleItemClick = (item: any) => {
    if (activeTab === 'music') {
      onViewDetails(item);
    } else if (activeTab === 'videos') {
      onViewVideoDetails(item);
    } else if (activeTab === 'playlists') {
      onViewPlaylist(item);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#121212] p-8 md:p-12 overflow-hidden">
      <header className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-12">
        <div className="space-y-4">
          <h2 className="text-3xl font-black italic tracking-tighter">本地库管理</h2>
          <div className="flex bg-white/5 p-1 rounded-full border border-white/5">
            {['music', 'videos', 'playlists'].map(t => (
              <button 
                key={t} onClick={() => setActiveTab(t as any)}
                className={`px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-[#C20C0C] text-white' : 'text-white/40 hover:text-white'}`}
              >
                {t === 'music' ? '单曲' : t === 'videos' ? '映画' : '歌单'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-80">
            <i className="fa-solid fa-filter absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-[10px]"></i>
            <input 
              type="text" placeholder="过滤节点记录..." 
              className="w-full bg-white/5 border border-white/5 rounded-full py-2.5 px-10 text-xs text-white outline-none focus:bg-white/10 transition-all"
              value={query} onChange={e => setQuery(e.target.value)}
            />
          </div>
          {activeTab === 'playlists' && (
            <button onClick={() => setIsCreating(true)} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-white/10"><i className="fa-solid fa-plus text-xs"></i></button>
          )}
          <button onClick={onRefresh} className="w-10 h-10 rounded-full bg-white/5 border border-white/5 text-white/40 hover:text-white transition-all flex items-center justify-center"><i className="fa-solid fa-rotate text-xs"></i></button>
        </div>
      </header>

      {/* 高密度列表 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pb-32">
        {data.map((item: any, idx: number) => (
          <div 
            key={item.id} 
            onClick={() => handleItemClick(item)}
            className="group flex items-center justify-between p-4 rounded-xl border border-transparent hover:bg-white/[0.04] hover:border-white/5 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-6 flex-1 truncate">
              <span className="w-6 text-[10px] font-mono text-white/20 tabular-nums">{idx + 1}</span>
              <div className="truncate">
                <h3 className="text-sm font-black text-white/90 truncate group-hover:text-[#C20C0C] transition-colors">{item.name || '未命名信号'}</h3>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1 truncate italic">{item.artist || 'SYSTEM ECHO'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-8 px-6">
              {activeTab === 'music' && (
                <div className="hidden md:flex gap-2">
                  {item.tags?.slice(0, 2).map((t: string) => (
                    <span key={t} className="text-[8px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-white/40 font-black">{t}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all">
                {activeTab !== 'playlists' && (
                  <button onClick={(e) => handleDelete(e, item)} className="text-white/20 hover:text-red-500 transition-all"><i className="fa-solid fa-trash-can text-xs"></i></button>
                )}
                <i className="fa-solid fa-chevron-right text-[10px] text-white/10"></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isCreating && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#181818] border border-white/10 p-8 rounded-[2rem] w-full max-w-sm space-y-6 shadow-2xl">
            <h3 className="text-lg font-black italic text-[#C20C0C]">#新建歌单映射</h3>
            <input 
              autoFocus placeholder="输入歌单名称..." 
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm text-white outline-none focus:border-[#C20C0C]/50 transition-all" 
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  createPlaylist(e.currentTarget.value);
                  setIsCreating(false);
                  onRefresh();
                }
              }}
            />
            <button onClick={() => setIsCreating(false)} className="w-full text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-all">取消操作</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicManager;
