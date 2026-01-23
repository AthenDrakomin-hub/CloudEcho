
import React, { useState, useEffect, useCallback } from 'react';

const DB_NAME = 'NocturneVirtualStorage';
const MEDIA_STORE = 'MediaCache';
const DUMMY_STORE = 'SubconsciousBlocks';
const DB_VERSION = 3; 
const TEN_GB = 10 * 1024 * 1024 * 1024;

interface CachedFile {
  id: string;
  name: string;
  size: number;
  timestamp: number;
  type: 'media' | 'dummy';
}

const CacheSpace: React.FC = () => {
  const [vMemUsage, setVMemUsage] = useState(0);
  const [cachedFiles, setCachedFiles] = useState<CachedFile[]>([]);
  const [systemLog, setSystemLog] = useState<string[]>(['[系统] 缓存引擎已启动', '[系统] 正在扫描本地文件...']);

  const getDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      // 关键修复：处理对象库不存在的情况
      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(MEDIA_STORE)) {
          db.createObjectStore(MEDIA_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(DUMMY_STORE)) {
          db.createObjectStore(DUMMY_STORE, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const updateVMemStats = useCallback(async () => {
    try {
      const db = await getDB();
      let total = 0;
      let files: CachedFile[] = [];

      // 获取媒体缓存
      const mediaTx = db.transaction(MEDIA_STORE, 'readonly');
      const mediaStore = mediaTx.objectStore(MEDIA_STORE);
      const mediaReq = mediaStore.getAll();
      
      await new Promise((resolve) => {
        mediaReq.onsuccess = () => {
          mediaReq.result.forEach(item => {
            const size = item.data?.size || 0;
            total += size;
            files.push({ id: item.id, name: item.name || '未知文件', size, timestamp: item.timestamp, type: 'media' });
          });
          resolve(null);
        };
      });

      // 获取块缓存
      const dummyTx = db.transaction(DUMMY_STORE, 'readonly');
      const dummyStore = dummyTx.objectStore(DUMMY_STORE);
      const dummyReq = dummyStore.getAll();
      
      await new Promise((resolve) => {
        dummyReq.onsuccess = () => {
          dummyReq.result.forEach(item => {
            const size = item.data?.size || 0;
            total += size;
            files.push({ id: item.id, name: item.label || '系统数据', size, timestamp: item.timestamp, type: 'dummy' });
          });
          resolve(null);
        };
      });

      setVMemUsage(total);
      setCachedFiles(files.sort((a, b) => b.timestamp - a.timestamp));
    } catch (e) { 
      console.error("[Cache] 数据同步异常:", e);
      setSystemLog(prev => [`[错误] 无法连接到 IndexedDB`, ...prev]);
    }
  }, []);

  useEffect(() => { updateVMemStats(); }, [updateVMemStats]);

  const log = (msg: string) => {
    setSystemLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 5));
  };

  const handlePurge = async () => {
    if(!confirm('确定要清除所有本地缓存文件吗？这不会影响云端数据，但下次播放需要重新下载。')) return;
    try {
      const db = await getDB();
      const tx = db.transaction([MEDIA_STORE, DUMMY_STORE], 'readwrite');
      tx.objectStore(MEDIA_STORE).clear();
      tx.objectStore(DUMMY_STORE).clear();
      log('本地缓存已完全清理');
      setTimeout(updateVMemStats, 500);
    } catch (e) { log('操作失败'); }
  };

  const vMemPercent = (vMemUsage / TEN_GB) * 100;
  const displaySize = (vMemUsage / (1024 * 1024)).toFixed(1);

  return (
    <div className="h-full p-8 md:p-16 overflow-y-auto bg-transparent custom-scrollbar text-white">
      <div className="max-w-5xl mx-auto space-y-16 pb-20">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
             <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center shadow-2xl border border-white/10">
                <i className="fa-solid fa-server text-indigo-400 text-2xl"></i>
             </div>
             <h1 className="text-5xl font-black text-white tracking-tighter italic leading-none drop-shadow-lg">本地缓存</h1>
             <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.4em] leading-relaxed">离线管理 / 10GB 存储配额</p>
          </div>
          <button onClick={handlePurge} className="px-10 py-5 glass-morphism text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all shadow-xl">清理全部缓存</button>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 glass-morphism rounded-[3.5rem] p-12 flex flex-col md:flex-row items-center gap-12 shadow-sm">
              <div className="relative w-56 h-56 flex items-center justify-center flex-shrink-0">
                 <svg className="w-full h-full -rotate-90">
                    <circle cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-white/5" />
                    <circle cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="16" fill="transparent" strokeDasharray={628} strokeDashoffset={628 - (628 * vMemPercent / 100)} className="text-indigo-500 transition-all duration-1000" strokeLinecap="round" />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black italic text-white tracking-tighter drop-shadow-md">{displaySize} <span className="text-xs uppercase">MB</span></span>
                    <span className="text-[8px] font-black text-white/40 uppercase tracking-widest mt-3">已用存储空间</span>
                 </div>
              </div>

              <div className="flex-1 space-y-6 w-full">
                 <div className="p-8 bg-black/40 border border-white/5 rounded-[2rem] space-y-4 shadow-inner">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">系统日志</p>
                    <div className="font-mono text-[10px] space-y-2 h-24 overflow-hidden text-white/60">
                       {systemLog.map((l, i) => <p key={i} className={i === 0 ? 'text-white font-bold' : 'opacity-40'}>{l}</p>)}
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-indigo-600/20 backdrop-blur-2xl rounded-[3.5rem] p-12 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group border border-indigo-500/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -translate-y-12 translate-x-12 group-hover:bg-indigo-500/40 transition-all duration-700"></div>
              <div className="space-y-4">
                 <h4 className="text-xl font-black italic tracking-tighter text-indigo-100">离线播放已开启</h4>
                 <p className="text-xs text-indigo-200/60 font-bold leading-relaxed">听过的歌曲将自动保存到本地，下次播放无需消耗流量。</p>
              </div>
              <i className="fa-solid fa-shield-halved text-6xl text-indigo-500 opacity-20 mt-12 self-end"></i>
           </div>
        </section>

        <section className="glass-morphism rounded-[3.5rem] p-12 space-y-10 shadow-sm">
           <div className="flex items-center justify-between border-b border-white/5 pb-8">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.4em]">已缓存文件 ({cachedFiles.length})</h3>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-white/20 uppercase font-black tracking-widest">Storage Node Active</span>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {cachedFiles.length > 0 ? cachedFiles.map((file) => (
               <div key={file.id} className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-2xl group hover:bg-white/10 hover:shadow-2xl transition-all duration-500">
                  <div className="flex items-center space-x-5 truncate">
                     <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0 text-white/20 group-hover:text-indigo-400 transition-colors">
                        <i className={`fa-solid ${file.type === 'media' ? 'fa-music' : 'fa-database'} text-xs`}></i>
                     </div>
                     <div className="truncate">
                        <p className="text-xs font-black text-white truncate">{file.name}</p>
                        <p className="text-[8px] text-white/30 font-bold uppercase mt-1 tracking-widest">{ (file.size / 1024 / 1024).toFixed(2) } MB · { new Date(file.timestamp).toLocaleDateString() }</p>
                     </div>
                  </div>
                  <i className="fa-solid fa-check-circle text-indigo-500 text-[10px] opacity-0 group-hover:opacity-100 transition-all drop-shadow-glow"></i>
               </div>
             )) : (
               <div className="md:col-span-2 py-20 text-center opacity-20">
                 <p className="text-[10px] font-black uppercase tracking-[0.5em]">本地存储空间为空</p>
               </div>
             )}
           </div>
        </section>
      </div>
    </div>
  );
};

export default CacheSpace;
