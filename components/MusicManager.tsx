
import React, { useState, useMemo, useRef } from 'react';
import { Song, Video, Playlist, NotificationType } from '../types';
import { deleteSong, deleteFile, uploadMediaV3 } from '../services/s3Service';
import { getPlaylists, createPlaylist } from '../services/playlistService';
import { S3_CONFIG } from '../constants';

const MusicManager: React.FC<any> = ({ songs, videos, onRefresh, onNotify, onViewDetails, onViewVideoDetails, onViewPlaylist }) => {
  const [activeTab, setActiveTab] = useState<'music' | 'videos' | 'playlists'>('music');
  const [query, setQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!confirm('确定要从云端物理抹除此映射记录吗？此操作无法撤销。')) return;
    try {
      const pathParts = item.url.split(`public/${S3_CONFIG.bucketName}/`);
      if (pathParts.length < 2) throw new Error("无效的云端资源路径");
      const path = decodeURIComponent(pathParts[1]);
      
      const success = await (activeTab === 'music' ? deleteSong(path) : deleteFile(path));
      if (success) { 
        onNotify('物理抹除成功', 'success'); 
        onRefresh(); 
      } else {
        onNotify('删除失败：请检查云端权限策略', 'error');
      }
    } catch (err) {
      onNotify('资源路径解析异常', 'error');
    }
  };

  const handleUploadClick = () => {
    if (activeTab === 'playlists') { setIsCreating(true); return; }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    onNotify(`正在建立 ${files.length} 个物理节点映射...`, 'info');
    let successCount = 0;
    for (let i = 0; i < files.length; i++) {
      if (await uploadMediaV3(files[i], activeTab === 'music' ? 'music' : 'video')) successCount++;
    }
    setIsUploading(false);
    if (successCount > 0) { onNotify(`成功映射 ${successCount} 个物理记录`, 'success'); onRefresh(); }
    else onNotify('映射失败，请检查网络链路', 'error');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="h-full flex flex-col bg-[#050505] p-8 md:p-12 overflow-hidden">
      <header className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-12">
        <div className="space-y-4 text-center lg:text-left">
          <h2 className="text-3xl font-black italic tracking-tighter">控制台管理</h2>
          <div className="flex bg-white/5 p-1 rounded-full border border-white/5 mx-auto lg:mx-0 w-fit">
            {[
              { id: 'music', label: '我的单曲' },
              { id: 'videos', label: '我的映画' },
              { id: 'playlists', label: '我的歌单' }
            ].map(t => (
              <button 
                key={t.id} 
                onClick={() => setActiveTab(t.id as any)} 
                className={`px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-[#C20C0C] text-white' : 'text-white/40 hover:text-white'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <input 
            type="text" 
            placeholder="搜索本地映射记录..." 
            className="flex-1 lg:w-64 bg-white/5 border border-white/5 rounded-full py-2.5 px-6 text-xs text-white outline-none focus:border-[#C20C0C]/50 transition-all" 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
          />
          <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept={activeTab === 'music' ? '.mp3,.wav,.m4a,.flac' : '.mp4,.mov'} className="hidden" />
          <button onClick={handleUploadClick} disabled={isUploading} className="w-10 h-10 rounded-full bg-[#C20C0C] flex items-center justify-center transition-all active:scale-90 shadow-lg shadow-red-900/20">
            {isUploading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className={`fa-solid ${activeTab === 'playlists' ? 'fa-plus' : 'fa-cloud-arrow-up'} text-xs text-white`}></i>}
          </button>
          <button onClick={onRefresh} className="w-10 h-10 rounded-full bg-white/5 border border-white/5 text-white/40 flex items-center justify-center hover:text-white transition-colors"><i className="fa-solid fa-rotate text-xs"></i></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pb-32">
        {data.length > 0 ? data.map((item: any, idx: number) => (
          <div key={item.id} onClick={() => (activeTab === 'music' ? onViewDetails(item) : activeTab === 'videos' ? onViewVideoDetails(item) : onViewPlaylist(item))} className="group flex items-center justify-between p-4 rounded-xl hover:bg-white/[0.04] transition-all cursor-pointer border border-transparent hover:border-white/5">
            <div className="flex items-center gap-6 flex-1 truncate">
              <span className="w-6 text-[10px] font-mono text-white/20 tabular-nums">{idx + 1}</span>
              <div className="truncate">
                <h3 className="text-sm font-black text-white/90 truncate group-hover:text-[#C20C0C] transition-colors">{item.name || '未知映射节点'}</h3>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1 italic">{item.artist || '系统信号'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all">
               {activeTab !== 'playlists' && <button onClick={(e) => handleDelete(e, item)} className="text-white/20 hover:text-red-500 transition-colors" title="抹除映射"><i className="fa-solid fa-trash-can text-xs"></i></button>}
               <i className="fa-solid fa-chevron-right text-[10px] text-white/10"></i>
            </div>
          </div>
        )) : (
          <div className="h-64 flex flex-col items-center justify-center space-y-4 opacity-10">
            <i className="fa-solid fa-magnifying-glass text-4xl"></i>
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">当前库中暂无映射数据</p>
          </div>
        )}
      </div>

      {isCreating && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121212] border border-white/10 p-8 rounded-[2rem] w-full max-w-sm space-y-6 shadow-2xl">
            <h3 className="text-lg font-black italic text-[#C20C0C]"># 新建私人歌单</h3>
            <input 
              autoFocus 
              placeholder="输入灵感名称..." 
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm text-white outline-none focus:border-[#C20C0C]/50 transition-all" 
              onKeyDown={e => { if (e.key === 'Enter') { createPlaylist(e.currentTarget.value); setIsCreating(false); onRefresh(); } }} 
            />
            <div className="flex gap-4">
              <button onClick={() => { const input = document.querySelector('input'); if(input) { createPlaylist(input.value); setIsCreating(false); onRefresh(); } }} className="flex-1 py-4 bg-[#C20C0C] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">确认创建</button>
              <button onClick={() => setIsCreating(false)} className="px-6 py-4 bg-white/5 text-white/40 rounded-xl font-black text-[10px] uppercase">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicManager;
