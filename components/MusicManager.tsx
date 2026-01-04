
import React, { useState } from 'react';
import { Song, Playlist } from '../types';
import { deleteSong, uploadSong } from '../services/s3Service';
import { S3_CONFIG } from '../constants';

interface MusicManagerProps {
  songs: Song[];
  playlists: Playlist[];
  onUpdatePlaylists: (playlists: Playlist[]) => void;
  onRefresh: () => void;
  onViewDetails: (song: Song) => void;
}

const MusicManager: React.FC<MusicManagerProps> = ({ songs, playlists, onUpdatePlaylists, onRefresh, onViewDetails }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'library' | 'playlists'>('library');
  const [showAddMenu, setShowAddMenu] = useState<string | null>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    for (let i = 0; i < files.length; i++) {
      try { await uploadSong(files[i], files[i].name); } catch (e) {}
    }
    onRefresh();
    setIsUploading(false);
  };

  const handleDelete = async (e: React.MouseEvent, key: string, name: string) => {
    e.stopPropagation();
    if (confirm(`确定永久删除 "${name}" 吗？`)) {
      await deleteSong(key);
      onRefresh();
    }
  };

  const createPlaylist = () => {
    const name = prompt("请输入新歌单名称:");
    if (name && name.trim()) {
      const newPlaylist: Playlist = {
        id: Math.random().toString(36).substring(7),
        name: name.trim(),
        songIds: []
      };
      onUpdatePlaylists([...playlists, newPlaylist]);
    }
  };

  const renamePlaylist = (e: React.MouseEvent, id: string, oldName: string) => {
    e.stopPropagation();
    const newName = prompt("重命名歌单:", oldName);
    if (newName && newName.trim()) {
      onUpdatePlaylists(playlists.map(p => p.id === id ? { ...p, name: newName.trim() } : p));
    }
  };

  const deletePlaylist = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (confirm(`确定删除歌单 "${name}" 吗？(库中文件不会被删除)`)) {
      onUpdatePlaylists(playlists.filter(p => p.id !== id));
    }
  };

  const addSongToPlaylist = (songId: string, playlistId: string) => {
    onUpdatePlaylists(playlists.map(p => {
      if (p.id === playlistId) {
        if (!p.songIds.includes(songId)) {
          return { ...p, songIds: [...p.songIds, songId] };
        }
      }
      return p;
    }));
    setShowAddMenu(null);
  };

  const filteredSongs = songs.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-[#020202] p-4 md:p-10 overflow-hidden">
      {/* 顶部标题与切换 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="px-2">
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => setActiveTab('library')}
              className={`text-2xl md:text-3xl font-black italic tracking-tight transition-all ${activeTab === 'library' ? 'text-white' : 'text-zinc-700'}`}
            >
              曲库资源
            </button>
            <button 
              onClick={() => setActiveTab('playlists')}
              className={`text-2xl md:text-3xl font-black italic tracking-tight transition-all ${activeTab === 'playlists' ? 'text-white' : 'text-zinc-700'}`}
            >
              我的歌单
            </button>
          </div>
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1 font-bold">
            {activeTab === 'library' ? 'Cloud Music Repository' : 'Custom Collections'}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 md:w-72">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 text-xs"></i>
            <input 
              type="text" placeholder={activeTab === 'library' ? "搜索曲目..." : "搜索歌单..."} 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-xs focus:outline-none focus:border-red-600 focus:bg-white/[0.08] transition-all text-white"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          
          {activeTab === 'library' ? (
            <label className={`cursor-pointer px-5 py-3 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center space-x-2 shrink-0 ${isUploading ? 'bg-zinc-800 text-zinc-600' : 'bg-red-600 text-white shadow-lg shadow-red-600/20 active:scale-95'}`}>
               <i className={`fa-solid ${isUploading ? 'fa-spinner animate-spin' : 'fa-plus'}`}></i>
               <span>{isUploading ? '同步中' : '上传'}</span>
               <input type="file" multiple className="hidden" onChange={e => handleFileUpload(e.target.files)} accept="audio/*" />
            </label>
          ) : (
            <button onClick={createPlaylist} className="bg-red-600 text-white shadow-lg shadow-red-600/20 px-5 py-3 rounded-2xl text-[10px] font-black uppercase active:scale-95 transition-all flex items-center space-x-2">
              <i className="fa-solid fa-folder-plus"></i>
              <span>创建歌单</span>
            </button>
          )}
        </div>
      </div>

      {/* 列表显示 */}
      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar px-1">
        {activeTab === 'library' ? (
          filteredSongs.length > 0 ? filteredSongs.map(song => (
            <div key={song.id} className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:bg-white/[0.06] transition-all cursor-pointer active:scale-[0.98]" onClick={() => onViewDetails(song)}>
              <div className="flex items-center space-x-4 flex-1 truncate">
                <img src={song.coverUrl} className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-lg" />
                <div className="truncate">
                  <p className="text-sm font-black text-zinc-100 truncate">{song.name}</p>
                  <p className="text-[10px] text-zinc-600 uppercase font-black tracking-tight mt-1">{song.artist}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1 relative">
                 <div className="relative">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowAddMenu(showAddMenu === song.id ? null : song.id); }}
                      className="p-3 text-zinc-600 hover:text-white transition-colors"
                      title="加入歌单"
                    >
                      <i className="fa-solid fa-plus-circle"></i>
                    </button>
                    {showAddMenu === song.id && (
                      <div className="absolute right-0 bottom-full mb-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-[110] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="p-2 border-b border-white/5 bg-black/40">
                           <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest text-center">选择歌单</p>
                        </div>
                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                           {playlists.length > 0 ? playlists.map(p => (
                             <button 
                               key={p.id} 
                               onClick={() => addSongToPlaylist(song.id, p.id)}
                               className="w-full text-left px-4 py-3 text-[10px] font-bold text-zinc-400 hover:bg-red-600 hover:text-white transition-all border-b border-white/5 last:border-0"
                             >
                               {p.name}
                             </button>
                           )) : (
                             <div className="p-4 text-center text-[9px] text-zinc-700 italic">暂无歌单，请先创建</div>
                           )}
                        </div>
                      </div>
                    )}
                 </div>
                 <button onClick={(e) => { e.stopPropagation(); onViewDetails(song); }} className="p-3 text-zinc-600 hover:text-white transition-colors"><i className="fa-solid fa-pen-nib"></i></button>
                 <button onClick={(e) => {
                   const urlParts = song.url.split('/');
                   const key = decodeURIComponent(urlParts.slice(urlParts.indexOf(S3_CONFIG.bucketName) + 1).join('/'));
                   handleDelete(e, key, song.name);
                 }} className="p-3 text-zinc-600 hover:text-red-600 transition-colors"><i className="fa-solid fa-trash-can"></i></button>
              </div>
            </div>
          )) : (
            <div className="h-64 flex flex-col items-center justify-center text-zinc-700 space-y-4">
               <i className="fa-solid fa-music text-5xl opacity-20"></i>
               <p className="text-sm font-bold tracking-widest uppercase">曲库暂无相关资源</p>
            </div>
          )
        ) : (
          playlists.length > 0 ? playlists.map(playlist => (
            <div key={playlist.id} className="bg-white/[0.03] border border-white/5 p-5 rounded-2xl flex items-center justify-between group hover:bg-white/[0.06] transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-red-600">
              <div className="flex items-center space-x-5">
                <div className="w-14 h-14 bg-zinc-900 rounded-xl flex items-center justify-center shadow-inner relative overflow-hidden">
                   <i className="fa-solid fa-folder-open text-zinc-700 text-xl z-10"></i>
                   <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent"></div>
                </div>
                <div>
                  <h4 className="text-base font-black text-white">{playlist.name}</h4>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1">
                    {playlist.songIds.length} 首歌曲
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                 <button onClick={(e) => renamePlaylist(e, playlist.id, playlist.name)} className="p-3 text-zinc-600 hover:text-white transition-colors"><i className="fa-solid fa-i-cursor"></i></button>
                 <button onClick={(e) => deletePlaylist(e, playlist.id, playlist.name)} className="p-3 text-zinc-600 hover:text-red-600 transition-colors"><i className="fa-solid fa-folder-minus"></i></button>
              </div>
            </div>
          )) : (
            <div className="h-64 flex flex-col items-center justify-center text-zinc-700 space-y-4">
               <i className="fa-solid fa-folder-closed text-5xl opacity-20"></i>
               <p className="text-sm font-bold tracking-widest uppercase">暂无歌单，点击上方创建</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default MusicManager;
