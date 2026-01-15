
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
  const [systemLog, setSystemLog] = useState<string[]>(['[内核] 硬件加速引擎就绪', '[内核] 正在扫描内存颗粒...']);

  const getDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(MEDIA_STORE)) db.createObjectStore(MEDIA_STORE, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(DUMMY_STORE)) db.createObjectStore(DUMMY_STORE, { keyPath: 'id' });
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

      const mediaTx = db.transaction(MEDIA_STORE, 'readonly');
      const mediaReq = mediaTx.objectStore(MEDIA_STORE).getAll();
      
      await new Promise((resolve) => {
        mediaReq.onsuccess = () => {
          mediaReq.result.forEach(item => {
            const size = item.data?.size || 0;
            total += size;
            files.push({ id: item.id, name: item.name || '未知信号', size, timestamp: item.timestamp, type: 'media' });
          });
          resolve(null);
        };
      });

      setVMemUsage(total);
      setCachedFiles(files.sort((a, b) => b.timestamp - a.timestamp));
    } catch (e) { 
      setSystemLog(prev => [`[错误] 内存控制器链路中断`, ...prev]);
    }
  }, []);

  useEffect(() => { updateVMemStats(); }, [updateVMemStats]);

  const handlePurge = async () => {
    if(!confirm('确定要物理清空本地内存颗粒吗？云端数据将保留。')) return;
    try {
      const db = await getDB();
      const tx = db.transaction([MEDIA_STORE, DUMMY_STORE], 'readwrite');
      tx.objectStore(MEDIA_STORE).clear();
      tx.objectStore(DUMMY_STORE).clear();
      setSystemLog(prev => [`[清理] 所有内存分块已清空`, ...prev]);
      setTimeout(updateVMemStats, 500);
    } catch (e) { }
  };

  const vMemPercent = (vMemUsage / TEN_GB) * 100;
  const displaySize = (vMemUsage / (1024 * 1024)).toFixed(1);

  return (
    <div className="h-full p-8 md:p-16 overflow-y-auto bg-[#0a0a0a] custom-scrollbar text-white">
      <div className="max-w-6xl mx-auto space-y-16 pb-24">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
             <div className="w-16 h-16 bg-[#C20C0C]/10 rounded-2xl flex items-center justify-center shadow-2xl border border-[#C20C0C]/20">
                <i className="fa-solid fa-microchip text-[#C20C0C] text-2xl"></i>
             </div>
             <h1 className="text-5xl font-black text-white tracking-tighter italic leading-none">本地内存库</h1>
             <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.4em]">Hardware Level Memory Management</p>
          </div>
          <button onClick={handlePurge} className="px-10 py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl">清空物理内存</button>
        </header>

        {/* 硬件内存条视觉组件 */}
        <section className="space-y-12">
          <div className="relative p-12 bg-zinc-900 border-2 border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 rgb-bar"></div>
            
            <div className="flex flex-col gap-10">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-black italic tracking-tighter">DDR5 V-CACHE MODULE</h4>
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em] mt-1">Status: High Performance Map</p>
                </div>
                <div className="flex gap-2">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < (vMemPercent/12) ? 'bg-[#C20C0C] shadow-[0_0_10px_#C20C0C]' : 'bg-white/5'}`}></div>
                  ))}
                </div>
              </div>

              {/* 内存槽位可视化 */}
              <div className="grid grid-cols-24 gap-1 h-24">
                {[...Array(48)].map((_, i) => {
                  const isOccupied = i < (vMemPercent * 0.48);
                  return (
                    <div 
                      key={i} 
                      className={`rounded-sm transition-all duration-700 ${isOccupied ? 'bg-[#C20C0C] shadow-[0_0_8px_rgba(194,12,12,0.5)]' : 'bg-white/5 hover:bg-white/10'}`}
                      title={isOccupied ? 'Data Block Encrypted' : 'Empty Cell'}
                    ></div>
                  );
                })}
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-t border-white/5 pt-8">
                <div className="flex items-center gap-10">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">物理占用</p>
                    <p className="text-3xl font-black italic">{displaySize} <span className="text-xs">MB</span></p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">总颗粒容量</p>
                    <p className="text-3xl font-black italic text-white/20">10,240 <span className="text-xs">MB</span></p>
                  </div>
                </div>
                <div className="w-full md:w-64 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#C20C0C] transition-all duration-1000" style={{ width: `${vMemPercent}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* 缓存列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cachedFiles.length > 0 ? cachedFiles.map((file) => (
              <div key={file.id} className="p-6 bg-white/5 border border-white/5 rounded-2xl group hover:bg-white/10 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-[#C20C0C] group-hover:scale-110 transition-all">
                    <i className="fa-solid fa-database text-sm"></i>
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-xs font-black truncate">{file.name}</p>
                    <p className="text-[9px] text-white/20 font-bold uppercase mt-1 tracking-widest">{(file.size/1024/1024).toFixed(2)} MB · BLOCK_{file.id.slice(0,6)}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center opacity-10 space-y-4">
                <i className="fa-solid fa-memory text-6xl"></i>
                <p className="text-[10px] font-black uppercase tracking-[0.5em]">内存池空置，等待信号写入...</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CacheSpace;
