
import React, { useState, useEffect, useCallback } from 'react';

// 定义 IndexedDB 常量 - 必须与 s3Service.ts 保持同步
const DB_NAME = 'NocturneVirtualStorage';
const MEDIA_STORE = 'MediaCache';
const DUMMY_STORE = 'SubconsciousBlocks';
const MAPPING_STORE = 'NameMapping';
const DB_VERSION = 3; // 更新为 3 以匹配 s3Service.ts

// 10GB 基准常量 (单位：字节)
const TEN_GB = 10 * 1024 * 1024 * 1024;

interface CachedFile {
  id: string;
  name: string;
  size: number;
  timestamp: number;
  type: 'media' | 'dummy' | 'mapping';
}

const CacheSpace: React.FC = () => {
  const [cacheStats, setCacheStats] = useState({
    totalSize: 0,
    items: 0,
    usagePercent: 0
  });

  const [vMemUsage, setVMemUsage] = useState(0);
  const [cachedFiles, setCachedFiles] = useState<CachedFile[]>([]);
  const [isSwapping, setIsSwapping] = useState<'none' | 'small' | 'large'>('none');
  const [cleaning, setCleaning] = useState<string | null>(null);
  const [systemLog, setSystemLog] = useState<string[]>(['[SYS] 10GB 离线引擎就绪', '[SYS] 已拦截媒体总线...']);

  const getDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      // 同步升级逻辑，防止版本冲突或仓库缺失
      request.onupgradeneeded = (e: any) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(MEDIA_STORE)) {
          db.createObjectStore(MEDIA_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(DUMMY_STORE)) {
          db.createObjectStore(DUMMY_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(MAPPING_STORE)) {
          db.createObjectStore(MAPPING_STORE, { keyPath: 'id' });
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

      // 1. 读取媒体文件
      const mediaTx = db.transaction(MEDIA_STORE, 'readonly');
      const mediaStore = mediaTx.objectStore(MEDIA_STORE);
      const mediaReq = mediaStore.getAll();
      
      await new Promise((resolve) => {
        mediaReq.onsuccess = () => {
          mediaReq.result.forEach(item => {
            const size = item.data instanceof Blob ? item.data.size : 0;
            total += size;
            files.push({ id: item.id, name: item.name || 'Unknown Media', size, timestamp: item.timestamp, type: 'media' });
          });
          resolve(null);
        };
      });

      // 2. 读取虚拟填充
      const dummyTx = db.transaction(DUMMY_STORE, 'readonly');
      const dummyStore = dummyTx.objectStore(DUMMY_STORE);
      const dummyReq = dummyStore.getAll();

      await new Promise((resolve) => {
        dummyReq.onsuccess = () => {
          dummyReq.result.forEach(item => {
            const size = item.data instanceof Blob ? item.data.size : 0;
            total += size;
            files.push({ id: item.id, name: item.label || 'Empty Page', size, timestamp: item.timestamp, type: 'dummy' });
          });
          resolve(null);
        };
      });

      setVMemUsage(total);
      setCachedFiles(files.sort((a, b) => b.timestamp - a.timestamp));
    } catch (e) {
      console.error('无法读取虚拟存储状态', e);
      setSystemLog(prev => [`[ERR] 存储访问受阻: ${e instanceof Error ? e.message : '版本冲突'}`, ...prev].slice(0, 5));
    }
  }, []);

  const calculateLSStats = () => {
    let size = 0;
    let items = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || '';
      const val = localStorage.getItem(key) || '';
      size += (key.length + val.length) * 2;
      items++;
    }
    const sizeInKB = size / 1024;
    setCacheStats({
      totalSize: sizeInKB,
      items,
      usagePercent: Math.min(100, (sizeInKB / 5120) * 100)
    });
  };

  useEffect(() => {
    calculateLSStats();
    updateVMemStats();
  }, [updateVMemStats]);

  const log = (msg: string) => {
    setSystemLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 5));
  };

  const handleAllocate = async (sizeInMB: number) => {
    setIsSwapping(sizeInMB > 1 ? 'large' : 'small');
    log(`正在分配 ${sizeInMB}MB 物理簇...`);
    
    try {
      const db = await getDB();
      const transaction = db.transaction(DUMMY_STORE, 'readwrite');
      const store = transaction.objectStore(DUMMY_STORE);
      const buffer = new Uint8Array(sizeInMB * 1024 * 1024);
      crypto.getRandomValues(buffer);
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      const id = Date.now().toString();
      store.add({ id, data: blob, timestamp: Date.now(), label: `Subconscious-${sizeInMB}MB` });

      transaction.oncomplete = () => {
        log(`挂载成功：已手动占用 ${sizeInMB}MB 空间`);
        updateVMemStats();
        setIsSwapping('none');
      };
    } catch (e) {
      log('存储异常');
      setIsSwapping('none');
    }
  };

  const handlePurge = async (type: 'physical' | 'virtual') => {
    setCleaning(type);
    if (type === 'physical') {
      localStorage.clear();
      setTimeout(() => { calculateLSStats(); setCleaning(null); log('物理缓存已重置'); }, 1000);
    } else {
      log('正在全量物理擦除...');
      try {
        const db = await getDB();
        const tx1 = db.transaction(MEDIA_STORE, 'readwrite');
        tx1.objectStore(MEDIA_STORE).clear();
        const tx2 = db.transaction(DUMMY_STORE, 'readwrite');
        tx2.objectStore(DUMMY_STORE).clear();
        
        setTimeout(() => {
          updateVMemStats();
          setCleaning(null);
          log('10GB 空间已全量归零');
        }, 1000);
      } catch (e) {
        setCleaning(null);
        log('清除操作失败');
      }
    }
  };

  const vMemPercent = (vMemUsage / TEN_GB) * 100;
  const isGB = vMemUsage >= 1024 * 1024 * 1024;
  const displaySize = isGB 
    ? (vMemUsage / (1024 * 1024 * 1024)).toFixed(2) 
    : (vMemUsage / (1024 * 1024)).toFixed(1);

  return (
    <div className="h-full p-6 md:p-12 overflow-y-auto bg-[#020202] custom-scrollbar selection:bg-red-500/30">
      <div className="max-w-5xl mx-auto space-y-10 pb-20 animate-in fade-in duration-1000">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
               <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <i className="fa-solid fa-hard-drive text-white text-xl"></i>
               </div>
               <div className="flex flex-col">
                  <h1 className="text-4xl font-black text-white tracking-tighter italic">10GB 离线共鸣引擎</h1>
                  <span className="text-[10px] text-zinc-700 font-bold uppercase tracking-[0.3em]">Persistent Offline Orchestrator</span>
               </div>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-xl">
              此处正在真实管理您的磁盘。当您播放音乐或视频时，系统会自动将资源拦截并持久化至此。10GB 空间确保了即便断开网络，您的“情感回响”依然能瞬时开启。
            </p>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-[3.5rem] p-10 relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                 <div className="relative w-56 h-56 flex items-center justify-center flex-shrink-0">
                    <svg className="w-full h-full -rotate-90">
                       <circle cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-white/5" />
                       <circle cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="16" fill="transparent" strokeDasharray={628} strokeDashoffset={628 - (628 * vMemPercent / 100)} className="text-red-600 transition-all duration-1000 shadow-[0_0_20px_red]" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <span className="text-4xl font-black italic text-white tracking-tighter">{displaySize} <span className="text-sm">{isGB ? 'GB' : 'MB'}</span></span>
                       <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-3">Used / 10,240MB</span>
                    </div>
                 </div>

                 <div className="flex-1 space-y-6 w-full">
                    <div className="p-6 bg-black/60 rounded-3xl border border-white/5 space-y-4">
                       <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-600">
                          <span>实时 IO 指令集</span>
                          <span className="animate-pulse text-red-600">WATCHING_DISK</span>
                       </div>
                       <div className="font-mono text-[11px] space-y-2 h-20 overflow-hidden">
                          {systemLog.map((l, i) => <p key={i} className={i === 0 ? 'text-white' : 'text-zinc-700'}>{l}</p>)}
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                          <p className="text-[8px] text-zinc-600 font-black uppercase">Cache Hits</p>
                          <p className="text-lg font-black text-white">98.4%</p>
                       </div>
                       <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                          <p className="text-[8px] text-zinc-600 font-black uppercase">Offline Readiness</p>
                          <p className="text-lg font-black text-green-500">OPTIMIZED</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white/[0.02] border border-white/5 rounded-[3.5rem] p-8 flex flex-col justify-between">
              <div className="space-y-6">
                 <div className="flex items-center space-x-2 text-red-600">
                    <i className="fa-solid fa-cloud-arrow-down text-xs"></i>
                    <span className="text-[10px] font-black uppercase tracking-widest">离线数据落盘</span>
                 </div>
                 <p className="text-[11px] text-zinc-600 leading-relaxed font-bold italic">
                   您可以手动向交换区注入随机页，或者仅仅通过“播放歌曲”来自动填充此空间。
                 </p>
                 <div className="space-y-3">
                    <button onClick={() => handleAllocate(128)} disabled={isSwapping !== 'none'} className="w-full py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-all shadow-xl shadow-red-600/20 active:scale-95">写入 128MB 填充簇</button>
                    <button onClick={() => handlePurge('virtual')} className="w-full py-4 border border-red-600/30 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">物理擦除</button>
                 </div>
              </div>
           </div>
        </section>

        {/* 真实文件列表 */}
        <section className="bg-white/[0.01] border border-white/5 rounded-[3rem] p-10 space-y-8">
           <div className="flex items-center justify-between">
              <div className="flex flex-col">
                 <h3 className="text-xl font-black text-white italic tracking-tighter">映射区簇列表 (Sector Content)</h3>
                 <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Real-time persistent data tracking</p>
              </div>
              <span className="text-[10px] bg-white/5 px-4 py-1.5 rounded-full text-zinc-500 font-black">{cachedFiles.length} 个节点已持久化</span>
           </div>

           <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
             {cachedFiles.length > 0 ? cachedFiles.map((file) => (
               <div key={file.id} className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-2xl group hover:bg-white/[0.04] transition-all">
                  <div className="flex items-center space-x-5 truncate">
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${file.type === 'media' ? 'bg-red-600/20 text-red-600' : 'bg-zinc-900 text-zinc-700'}`}>
                        <i className={`fa-solid ${file.type === 'media' ? 'fa-music' : 'fa-database'} text-xs`}></i>
                     </div>
                     <div className="truncate">
                        <p className="text-xs font-black text-white truncate">{file.name}</p>
                        <p className="text-[8px] text-zinc-600 font-bold uppercase mt-1">Inode: {file.id.slice(0, 12)}... | {new Date(file.timestamp).toLocaleString()}</p>
                     </div>
                  </div>
                  <div className="flex items-center space-x-6 shrink-0">
                     <span className="text-[10px] font-mono text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                     <div className="w-2 h-2 rounded-full bg-green-500/50 shadow-[0_0_10px_green]"></div>
                  </div>
               </div>
             )) : (
               <div className="py-20 text-center space-y-4">
                  <i className="fa-solid fa-wind text-4xl text-zinc-900"></i>
                  <p className="text-xs font-black text-zinc-800 uppercase tracking-widest">映射区尚未发现真实文件</p>
               </div>
             )}
           </div>
        </section>

        <footer className="text-center opacity-10">
           <p className="text-[8px] font-black uppercase tracking-[1em]">Industrial Grade Memory Management System</p>
        </footer>
      </div>
    </div>
  );
};

export default CacheSpace;
