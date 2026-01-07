
import React, { useState } from 'react';
import { Song, Playlist } from '../types';
import { deleteSong, uploadSong, renameSong, saveVirtualName } from '../services/s3Service';
import { S3_CONFIG } from '../constants';
import { localTranslate } from '../services/translationService';

interface MusicManagerProps {
  songs: Song[];
  playlists: Playlist[];
  onUpdatePlaylists: (playlists: Playlist[]) => void;
  onRefresh: () => void;
  onViewDetails: (song: Song) => void;
}

const MusicManager: React.FC<MusicManagerProps> = ({ songs, playlists, onUpdatePlaylists, onRefresh, onViewDetails }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'library' | 'playlists'>('library');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    for (let i = 0; i < files.length; i++) {
      setUploadProgress(0);
      try { 
        await uploadSong(files[i], files[i].name, (p) => setUploadProgress(p)); 
      } catch (e) {}
    }
    onRefresh();
    setIsUploading(false);
  };

  const isPinyin = (text: string) => {
    return /^[a-zA-Z\s\-0-9]+$/.test(text) && text.length > 2;
  };

  // 虚拟重命名：仅修改显示名称，不改变 S3 物理文件名
  const handleVirtualRename = async (e: React.MouseEvent, song: Song, newName: string) => {
    e.stopPropagation();
    setIsProcessing(song.id);
    try {
      await saveVirtualName(song.id, newName);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(null);
    }
  };

  const filteredSongs = songs.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-[#020202] p-4 md:p-10 overflow-hidden relative">
      {isUploading && (
        <div className="absolute top-0 left-0 right-0 h-1 z-[120] bg-zinc-900">
           <div className="h-full bg-red-600 shadow-[0_0_15px_rgba(194,12,12,0.8)] transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="px-2">
          <div className="flex items-center space-x-6">
            <button onClick={() => setActiveTab('library')} className={`text-2xl md:text-3xl font-black italic tracking-tight transition-all ${activeTab === 'library' ? 'text-white' : 'text-zinc-700'}`}>曲库资源</button>
            <button onClick={() => setActiveTab('playlists')} className={`text-2xl md:text-3xl font-black italic tracking-tight transition-all ${activeTab === 'playlists' ? 'text-white' : 'text-zinc-700'}`}>我的歌单</button>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
              {activeTab === 'library' ? 'Cloud Music Repository' : 'Custom Collections'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 md:w-72">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 text-xs"></i>
            <input type="text" placeholder="搜索歌曲、拼音..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-xs focus:outline-none focus:border-red-600 transition-all text-white font-medium" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          
          {activeTab === 'library' && (
            <label className={`cursor-pointer px-5 py-3 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center space-x-2 shrink-0 ${isUploading ? 'bg-zinc-800 text-zinc-600 animate-pulse' : 'bg-red-600 text-white shadow-lg active:scale-95'}`}>
               <i className={`fa-solid ${isUploading ? 'fa-spinner animate-spin' : 'fa-plus'}`}></i>
               <span>{isUploading ? `同步 ${uploadProgress}%` : '上传资源'}</span>
               {!isUploading && <input type="file" multiple className="hidden" onChange={e => handleFileUpload(e.target.files)} accept="audio/*" />}
            </label>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar px-1">
        {activeTab === 'library' ? (
          filteredSongs.length > 0 ? filteredSongs.map(song => {
            const needsTranslation = isPinyin(song.name);
            const translation = needsTranslation ? localTranslate(song.name) : null;
            const hasTranslation = translation && translation !== song.name;

            return (
              <div key={song.id} className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:bg-white/[0.06] transition-all cursor-pointer" onClick={() => onViewDetails(song)}>
                <div className="flex items-center space-x-4 flex-1 truncate">
                  <div className="relative flex-shrink-0">
                    <img src={song.coverUrl} className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-lg" />
                    {isProcessing === song.id && (
                      <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                        <i className="fa-solid fa-spinner animate-spin text-xs text-white"></i>
                      </div>
                    )}
                  </div>
                  <div className="truncate flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-black text-zinc-100 truncate">{song.name}</p>
                      {needsTranslation && (
                        <span className="text-[8px] bg-red-600/10 text-red-500 border border-red-600/20 px-1.5 py-0.5 rounded font-black tracking-tighter uppercase">Virtual mapping</span>
                      )}
                    </div>
                    {hasTranslation ? (
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-[10px] text-zinc-600 font-black flex items-center space-x-1">
                          <i className="fa-solid fa-lightbulb text-red-600/40"></i>
                          <span>建议：{translation}</span>
                        </span>
                        <button 
                          onClick={(e) => handleVirtualRename(e, song, translation)}
                          className="text-[8px] bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/5 px-1.5 py-0.5 rounded font-black transition-all"
                        >
                          采用此映射
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10px] text-zinc-600 uppercase font-black tracking-tight mt-1">{song.artist}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                   <button onClick={(e) => { e.stopPropagation(); onViewDetails(song); }} className="p-3 text-zinc-600 hover:text-white transition-colors flex items-center space-x-2">
                      <i className="fa-solid fa-pen-nib text-xs"></i>
                   </button>
                   <button onClick={(e) => {
                     e.stopPropagation();
                     const urlParts = song.url.split('/');
                     const key = decodeURIComponent(urlParts.slice(urlParts.indexOf(S3_CONFIG.bucketName) + 1).join('/'));
                     if (confirm(`确定从云端永久移除 "${song.name}" 吗？`)) { deleteSong(key).then(onRefresh); }
                   }} className="p-3 text-zinc-600 hover:text-red-600 transition-colors"><i className="fa-solid fa-trash-can text-xs"></i></button>
                </div>
              </div>
            );
          }) : (
            <div className="h-64 flex flex-col items-center justify-center text-zinc-700 space-y-4">
               <i className="fa-solid fa-music text-5xl opacity-20"></i>
               <p className="text-sm font-bold tracking-widest uppercase italic">“我这辈子得到了很多空头支票...”</p>
            </div>
          )
        ) : (
          playlists.length > 0 ? playlists.map(playlist => (
            <div key={playlist.id} className="bg-white/[0.03] border border-white/5 p-5 rounded-2xl flex items-center justify-between group hover:bg-white/[0.06] transition-all cursor-pointer">
              <div className="flex items-center space-x-5">
                <div className="w-14 h-14 bg-zinc-900 rounded-xl flex items-center justify-center relative overflow-hidden">
                   <i className="fa-solid fa-folder-open text-zinc-700 text-xl z-10"></i>
                </div>
                <div>
                  <h4 className="text-base font-black text-white">{playlist.name}</h4>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1">{playlist.songIds.length} 首歌曲</p>
                </div>
              </div>
            </div>
          )) : (
            <div className="h-64 flex flex-col items-center justify-center text-zinc-700 space-y-4">
               <i className="fa-solid fa-folder-closed text-5xl opacity-20"></i>
               <p className="text-sm font-bold tracking-widest uppercase">暂无收藏夹内容</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default MusicManager;
