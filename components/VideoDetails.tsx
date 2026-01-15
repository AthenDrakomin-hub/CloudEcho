
import React, { useState } from 'react';
import { Video, NotificationType } from '../types';
import { renameVideoV3, downloadVideo } from '../services/s3Service';
import { localTranslate } from '../services/translationService';
import { S3_CONFIG } from '../constants';

interface VideoDetailsProps {
  video: Video;
  onBack: () => void;
  onUpdate: (video: Video) => void;
  onNotify: (message: string, type: NotificationType) => void;
}

const VideoDetails: React.FC<VideoDetailsProps> = ({ video, onBack, onUpdate, onNotify }) => {
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [tempName, setTempName] = useState(video.name);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleLocalCorrection = () => {
    setIsProcessing(true);
    try {
      const translated = localTranslate(tempName);
      setTempName(translated);
      onNotify('本地词库校准完成', 'success');
    } catch (err) {
      onNotify('校准异常', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveMetadata = async () => {
    if (!tempName.trim()) {
      onNotify('请填写视频名称', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      // 使用 V3 协议进行物理重命名，将中文名编码为 Base64 后存入 S3
      const success = await renameVideoV3(video.url, tempName.trim());
      if (!success) throw new Error("S3 物理映射失败 (可能存在权限或连接问题)");

      onUpdate({ ...video, name: tempName.trim() });
      setIsEditingMetadata(false);
      onNotify('云端文件 V3 协议重命名成功', 'success');
      onBack();
    } catch (err: any) {
      onNotify(`同步失败: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    await downloadVideo(video);
    setIsDownloading(false);
    onNotify('文件正在下载', 'info');
  };

  return (
    <div className="h-full flex flex-col p-8 md:p-16 overflow-y-auto relative bg-[#121212] custom-scrollbar text-white">
      <div className="max-w-6xl mx-auto w-full space-y-12 pb-24">
        <nav className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center space-x-3 text-white/40 hover:text-white transition-all group">
            <i className="fa-solid fa-arrow-left text-lg transition-transform group-hover:-translate-x-1"></i>
            <span className="font-black text-[10px] uppercase tracking-[0.3em]">返回影集清单</span>
          </button>
          
          <button 
            onClick={handleDownload} 
            disabled={isDownloading}
            className="flex items-center space-x-4 px-10 py-4 bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl active:scale-95"
          >
            {isDownloading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-download"></i>}
            <span>{isDownloading ? 'DOWNLOADING...' : '下载原片'}</span>
          </button>
        </nav>

        <section className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-full aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-black relative group">
            <video src={video.url} className="w-full h-full object-contain" controls />
          </div>
          
          <div className="w-full flex flex-col md:flex-row items-start justify-between gap-12">
            <div className="flex-1 space-y-8 w-full">
              {isEditingMetadata ? (
                <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] space-y-8 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/5 pb-6">
                     <span className="text-[10px] font-black uppercase tracking-widest italic text-white/40">映画名修正 (V3-Enc Mapping)</span>
                     <button 
                      onClick={handleLocalCorrection} 
                      disabled={isProcessing}
                      className="px-6 py-2.5 bg-white/10 border border-white/10 text-white text-[9px] font-black uppercase rounded-xl hover:bg-white/20 transition-all"
                     >
                       <i className="fa-solid fa-spell-check mr-2"></i>
                       <span>{isProcessing ? '校准中...' : '规则引擎校准'}</span>
                     </button>
                  </div>
                  <input 
                    autoFocus
                    value={tempName} 
                    onChange={(e) => setTempName(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-2xl font-black italic text-white outline-none focus:border-[#C20C0C]/50 transition-all" 
                  />
                  <div className="flex items-center gap-4 pt-4">
                     <button onClick={handleSaveMetadata} disabled={isSaving} className="flex-1 py-5 bg-[#C20C0C] text-white font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all rounded-2xl flex items-center justify-center gap-3">
                       {isSaving ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-cloud-arrow-up"></i>}
                       <span>应用 V3 协议物理重命名</span>
                     </button>
                     <button onClick={() => setIsEditingMetadata(false)} className="px-10 py-5 border border-white/10 bg-white/5 rounded-2xl font-black text-[10px] uppercase text-white/40 hover:text-white transition-all">取消</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-none italic uppercase aurora-text">{video.name}</h1>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">V3 MAPPING NODE: {video.id.slice(0, 16)}...</p>
                  <button 
                    onClick={() => setIsEditingMetadata(true)} 
                    className="mt-4 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3"
                  >
                    <i className="fa-solid fa-pen-nib text-[#C20C0C]"></i>
                    修正节点名称
                  </button>
                </div>
              )}
            </div>

            <div className="shrink-0 space-y-4 w-full md:w-auto">
              <div className="p-10 border border-white/10 bg-white/5 rounded-[2rem] text-center space-y-4">
                 <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Storage Channel</p>
                 <div className="flex items-center justify-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-2xl font-black uppercase italic tracking-tighter">Online</span>
                 </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-12 space-y-10">
           <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-4">
             <i className="fa-solid fa-server text-[#C20C0C]"></i>
             物理存储上下文 (Storage Context)
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-3">
                 <p className="text-[9px] font-black uppercase text-white/20 tracking-widest">S3 Physical Key</p>
                 <p className="text-sm font-black font-mono text-white/60 truncate italic">{decodeURIComponent(video.url.split('/').pop() || '')}</p>
              </div>
              <div className="space-y-3">
                 <p className="text-[9px] font-black uppercase text-white/20 tracking-widest">Last Synced</p>
                 <p className="text-sm font-black font-mono text-white/60">{video.lastModified ? new Date(video.lastModified).toLocaleString() : 'N/A'}</p>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};

export default VideoDetails;
