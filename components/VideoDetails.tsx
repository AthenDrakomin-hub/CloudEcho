
import React, { useState } from 'react';
import { Video, NotificationType } from '../types';
import { renameFile, downloadVideo } from '../services/s3Service';
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
      const ext = video.url.split('.').pop() || 'mp4';
      const success = await renameFile(video.url, `${tempName.trim()}.${ext}`, S3_CONFIG.videoFolderPrefix);
      if (!success) throw new Error("S3 物理更名失败");

      onUpdate({ ...video, name: tempName.trim() });
      setIsEditingMetadata(false);
      onNotify('云端文件重命名成功', 'success');
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
    <div className="h-full flex flex-col p-6 md:p-12 overflow-y-auto relative bg-white custom-scrollbar border-l-4 border-black">
      <div className="max-w-6xl mx-auto w-full space-y-12 pb-20">
        <nav className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center space-x-3 text-black hover:text-red-600 transition-all group">
            <i className="fa-solid fa-arrow-left text-xl transition-transform group-hover:-translate-x-2"></i>
            <span className="font-[900] text-xs uppercase tracking-[0.3em]">返回影集清单</span>
          </button>
          
          <button 
            onClick={handleDownload} 
            disabled={isDownloading}
            className="flex items-center space-x-4 px-8 py-4 bg-black text-white font-[900] text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-[6px_6px_0px_#FF0000] active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            {isDownloading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-download"></i>}
            <span>{isDownloading ? 'DOWNLOADING...' : '下载此原片'}</span>
          </button>
        </nav>

        <section className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-full aspect-video border-8 border-black shadow-[20px_20px_0px_#EEEEEE] bg-black relative">
            <video src={video.url} className="w-full h-full object-contain" controls />
          </div>
          
          <div className="w-full flex flex-col md:flex-row items-start justify-between gap-10">
            <div className="flex-1 space-y-6 w-full">
              {isEditingMetadata ? (
                <div className="bg-zinc-50 border-4 border-black p-8 space-y-6">
                  <div className="flex items-center justify-between border-b-2 border-black pb-4">
                     <span className="text-[10px] font-black uppercase tracking-widest italic">映画名修正 (Cloud)</span>
                     <button 
                      onClick={handleLocalCorrection} 
                      disabled={isProcessing}
                      className="px-4 py-2 bg-black text-white text-[9px] font-black uppercase flex items-center space-x-2 hover:bg-red-600 transition-all"
                     >
                       <i className="fa-solid fa-spell-check"></i>
                       <span>{isProcessing ? '校准中...' : '本地词库校准'}</span>
                     </button>
                  </div>
                  <input 
                    autoFocus
                    value={tempName} 
                    onChange={(e) => setTempName(e.target.value)} 
                    className="w-full bg-white border-4 border-black p-6 text-3xl font-[900] italic outline-none focus:bg-yellow-50" 
                  />
                  <div className="flex items-center space-x-4 pt-2">
                     <button onClick={handleSaveMetadata} disabled={isSaving} className="flex-1 py-5 bg-black text-white font-[900] text-xs uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center space-x-3">
                       {isSaving ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-cloud-arrow-up"></i>}
                       <span>应用物理重命名</span>
                     </button>
                     <button onClick={() => setIsEditingMetadata(false)} className="px-8 py-5 border-4 border-black font-black text-xs uppercase">取消</button>
                  </div>
                </div>
              ) : (
                <div className="group relative">
                  <h1 className="text-5xl md:text-7xl font-[900] text-black tracking-tighter leading-none italic uppercase">{video.name}</h1>
                  <p className="text-xs font-black uppercase tracking-[0.4em] mt-6 text-red-600">MAPPING NODE: {video.id.slice(0, 24)}</p>
                  <button 
                    onClick={() => setIsEditingMetadata(true)} 
                    className="mt-8 px-6 py-3 border-4 border-black bg-white font-black text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-[6px_6px_0px_#000000]"
                  >
                    <i className="fa-solid fa-pen-nib mr-3"></i>
                    修正视频名称
                  </button>
                </div>
              )}
            </div>

            <div className="shrink-0 space-y-4">
              <div className="p-10 border-4 border-black bg-black text-white text-center">
                 <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Storage Status</p>
                 <div className="flex items-center justify-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xl font-[900] uppercase italic tracking-tighter">Verified</span>
                 </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-zinc-50 border-4 border-black p-10 space-y-8">
           <h3 className="text-xs font-black text-black uppercase tracking-[0.3em] flex items-center gap-4">
             <i className="fa-solid fa-server text-red-600"></i>
             物理存储上下文 (Storage Context)
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-2">
                 <p className="text-[10px] font-black uppercase text-zinc-400">Path Prefix</p>
                 <p className="text-sm font-bold font-mono text-black">{S3_CONFIG.videoFolderPrefix}</p>
              </div>
              <div className="space-y-2">
                 <p className="text-[10px] font-black uppercase text-zinc-400">Last Synced</p>
                 <p className="text-sm font-bold font-mono text-black">{video.lastModified ? new Date(video.lastModified).toLocaleString() : 'N/A'}</p>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};

export default VideoDetails;
