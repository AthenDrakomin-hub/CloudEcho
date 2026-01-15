
import React, { useState } from 'react';
import { Playlist, Song, NotificationType } from '../types';
import { removeSongFromPlaylist, renamePlaylist, reorderPlaylistSongs } from '../services/playlistService';

interface PlaylistDetailProps {
  playlist: Playlist;
  allSongs: Song[];
  onBack: () => void;
  onPlaySong: (song: Song, queue: Song[]) => void;
  onNotify: (message: string, type: NotificationType) => void;
  onUpdate: () => void;
}

const PlaylistDetail: React.FC<PlaylistDetailProps> = ({ 
  playlist, allSongs, onBack, onPlaySong, onNotify, onUpdate 
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(playlist.name);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const playlistSongs = playlist.songIds
    .map(id => allSongs.find(s => s.id === id))
    .filter((s): s is Song => !!s);

  const handleRename = () => {
    if (!tempName.trim()) {
      setTempName(playlist.name);
      setIsEditingName(false);
      return;
    }
    renamePlaylist(playlist.id, tempName.trim());
    setIsEditingName(false);
    onUpdate();
    onNotify('映射名称已更新', 'success');
  };

  const handleRemove = (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    removeSongFromPlaylist(playlist.id, songId);
    onUpdate();
    onNotify('已从当前轨道映射中移除', 'info');
  };

  // 拖拽核心逻辑
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    // 设置拖拽预览透明
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (overIdx !== index) setOverIdx(index);
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setOverIdx(null);
      return;
    }

    const newSongIds = [...playlist.songIds];
    const [movedId] = newSongIds.splice(draggedIdx, 1);
    newSongIds.splice(targetIdx, 0, movedId);

    reorderPlaylistSongs(playlist.id, newSongIds);
    setDraggedIdx(null);
    setOverIdx(null);
    onUpdate();
    onNotify('轨道序列重排完成', 'success');
  };

  return (
    <div className="h-full flex flex-col p-6 md:p-12 lg:p-20 overflow-y-auto custom-scrollbar bg-transparent animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="max-w-5xl mx-auto w-full space-y-16 pb-32">
        {/* 顶部导航 */}
        <nav>
          <button onClick={onBack} className="flex items-center space-x-4 text-white/30 hover:text-white transition-all font-black uppercase tracking-widest text-[10px] group">
            <i className="fa-solid fa-chevron-left group-hover:-translate-x-1 transition-transform"></i>
            <span>返回内容库控制台</span>
          </button>
        </nav>

        {/* 头部信息 */}
        <header className="flex flex-col md:flex-row items-center md:items-end gap-12">
          <div className="w-56 h-56 md:w-72 md:h-72 rounded-[4rem] bg-gradient-to-br from-red-600/30 to-indigo-600/30 flex items-center justify-center border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden relative group">
            {playlistSongs.length > 0 ? (
              <img src={playlistSongs[0].coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Playlist Cover" />
            ) : (
              <i className="fa-solid fa-music text-7xl text-white/5"></i>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
               <i className="fa-solid fa-camera-retro text-white/40"></i>
            </div>
          </div>

          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-4">
                {isEditingName ? (
                  <input 
                    autoFocus
                    value={tempName} 
                    onChange={e => setTempName(e.target.value)}
                    onBlur={handleRename}
                    onKeyDown={e => e.key === 'Enter' && handleRename()}
                    className="bg-white/5 border-b-2 border-red-500 text-3xl md:text-5xl font-black text-white outline-none py-1 italic"
                  />
                ) : (
                  <>
                    <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter italic aurora-text">{playlist.name}</h1>
                    <button onClick={() => setIsEditingName(true)} className="text-white/20 hover:text-white transition-colors"><i className="fa-solid fa-pen-nib text-xl"></i></button>
                  </>
                )}
              </div>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] leading-relaxed">
                Collection Protocol · {playlistSongs.length} Tracks · Created at {new Date(playlist.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <button 
                onClick={() => playlistSongs.length > 0 && onPlaySong(playlistSongs[0], playlistSongs)}
                className="px-12 py-5 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-red-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
              >
                <i className="fa-solid fa-play"></i>
                <span>播放全部轨道</span>
              </button>
              <button className="px-8 py-5 glass-dark-morphism text-white/60 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all">
                <i className="fa-solid fa-share-nodes"></i>
              </button>
            </div>
          </div>
        </header>

        {/* 歌曲列表 */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">映射轨道清单 (按住并拖动以排序)</h3>
            <div className="flex items-center gap-2">
               <span className="text-[9px] font-black text-red-500/40 uppercase italic">Signal Stable</span>
               <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
            </div>
          </div>

          {playlistSongs.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center space-y-6 opacity-10">
               <i className="fa-solid fa-compact-disc text-6xl animate-spin-slow"></i>
               <p className="text-xs font-black uppercase tracking-[0.5em]">暂无映射信号，请从控制台添加</p>
            </div>
          ) : (
            <div className="space-y-3">
              {playlistSongs.map((song, idx) => (
                <div 
                  key={song.id} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={() => { setDraggedIdx(null); setOverIdx(null); }}
                  onClick={() => onPlaySong(song, playlistSongs)}
                  className={`group flex items-center p-5 rounded-3xl border transition-all duration-300 cursor-pointer ${
                    draggedIdx === idx ? 'opacity-20 scale-95 border-dashed border-white/20' : 'opacity-100'
                  } ${
                    overIdx === idx && draggedIdx !== idx ? 'bg-indigo-600/10 border-indigo-500/50 -translate-y-1' : 'bg-white/[0.03] border-transparent hover:bg-white/[0.07] hover:border-white/10'
                  }`}
                >
                  {/* 拖拽手柄 */}
                  <div className="w-8 flex items-center justify-center mr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <i className="fa-solid fa-grip-vertical text-[10px] text-white/20"></i>
                  </div>
                  
                  <span className="w-8 text-[10px] font-black text-white/20 tabular-nums">{idx + 1}</span>
                  
                  <div className="w-12 h-12 rounded-xl overflow-hidden mr-6 shadow-2xl relative">
                    <img src={song.coverUrl} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                       <i className="fa-solid fa-play text-white text-[10px]"></i>
                    </div>
                  </div>

                  <div className="flex-1 truncate">
                    <p className="text-sm md:text-base font-black text-white truncate group-hover:text-red-500 transition-colors">{song.name}</p>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1 italic">{song.artist}</p>
                  </div>

                  <div className="flex items-center gap-6">
                    <span className="hidden md:block text-[9px] font-mono text-white/10 uppercase tracking-widest">Linked Node</span>
                    <button 
                      onClick={(e) => handleRemove(e, song.id)}
                      className="w-10 h-10 rounded-xl bg-white/0 hover:bg-red-500/10 text-white/10 hover:text-red-500 transition-all flex items-center justify-center"
                    >
                      <i className="fa-solid fa-link-slash text-sm"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 底部装饰 */}
        <footer className="pt-20 text-center space-y-4 opacity-10">
           <div className="h-px w-32 bg-white/20 mx-auto"></div>
           <p className="text-[9px] font-black uppercase tracking-[0.8em]">End of Memory Stream</p>
        </footer>
      </div>
    </div>
  );
};

export default PlaylistDetail;
