
import React, { useState } from 'react';
import { S3_CONFIG } from '../constants';

const Settings: React.FC = () => {
  const [showNoise, setShowNoise] = useState(true);
  const [glowIntensity, setGlowIntensity] = useState(0.8);

  const clearCache = () => {
    if (confirm('确定要清除所有本地歌单和设置吗？这不会影响云端文件。')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="h-full p-6 md:p-12 overflow-y-auto bg-[#020202] custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <header className="space-y-4">
          <div className="flex items-center space-x-4">
             <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-600/20">
                <i className="fa-solid fa-gear text-white text-xl"></i>
             </div>
             <h1 className="text-4xl font-black text-white tracking-tighter italic">系统设置中心</h1>
          </div>
          <p className="text-zinc-500 text-sm leading-relaxed max-w-xl">
            在此配置您的私有云端生态。所有涉及云存储的设置均为只读状态，以确保 S3 映射的安全性。
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* 存储引擎 */}
          <section className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center space-x-3 text-red-500">
               <i className="fa-solid fa-server text-sm"></i>
               <h3 className="text-xs font-black uppercase tracking-widest">存储引擎 (S3 Storage)</h3>
            </div>
            <div className="space-y-4">
               <div className="space-y-1">
                  <p className="text-[9px] text-zinc-600 font-black uppercase">Bucket Name</p>
                  <p className="text-xs font-mono text-zinc-300 bg-white/5 p-3 rounded-xl border border-white/5 truncate">{S3_CONFIG.bucketName}</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[9px] text-zinc-600 font-black uppercase">Region / Region Code</p>
                  <p className="text-xs font-mono text-zinc-300 bg-white/5 p-3 rounded-xl border border-white/5">{S3_CONFIG.region}</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[9px] text-zinc-600 font-black uppercase">Service Endpoint</p>
                  <p className="text-xs font-mono text-zinc-300 bg-white/5 p-3 rounded-xl border border-white/5 truncate">{S3_CONFIG.endpoint}</p>
               </div>
            </div>
          </section>

          {/* 视觉实验室 */}
          <section className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 space-y-8">
            <div className="flex items-center space-x-3 text-red-500">
               <i className="fa-solid fa-flask text-sm"></i>
               <h3 className="text-xs font-black uppercase tracking-widest">视觉实验室 (V-Lab)</h3>
            </div>
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <div className="space-y-1">
                     <p className="text-sm font-bold text-white">星尘噪点层</p>
                     <p className="text-[10px] text-zinc-600">全局覆盖的电影质感噪点效果</p>
                  </div>
                  <button 
                    onClick={() => setShowNoise(!showNoise)}
                    className={`w-12 h-6 rounded-full transition-all relative ${showNoise ? 'bg-red-600' : 'bg-zinc-800'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${showNoise ? 'left-7' : 'left-1'}`}></div>
                  </button>
               </div>

               <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-white">氛围光晕强度</p>
                    <span className="text-[10px] font-mono text-zinc-500">{Math.round(glowIntensity * 100)}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="2" step="0.1" 
                    value={glowIntensity} 
                    onChange={e => setGlowIntensity(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/10 accent-red-600 rounded-full appearance-none cursor-pointer"
                  />
               </div>
            </div>
          </section>

          {/* 系统维护 */}
          <section className="bg-red-600/5 border border-red-600/10 rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center space-x-3 text-red-500">
               <i className="fa-solid fa-triangle-exclamation text-sm"></i>
               <h3 className="text-xs font-black uppercase tracking-widest">危险区域 (Zone)</h3>
            </div>
            <div className="space-y-4">
               <p className="text-[11px] text-zinc-500 font-bold leading-relaxed">
                 执行此操作将立即清空本地 `localStorage` 中的所有数据，包括您的自建歌单、播放记录以及个性化视觉设置。
               </p>
               <button 
                onClick={clearCache}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-red-500 transition-all shadow-xl shadow-red-600/10 active:scale-95"
               >
                 清除本地所有数据
               </button>
            </div>
          </section>
        </div>

        <footer className="text-center pt-10 opacity-20">
           <p className="text-[10px] uppercase font-black tracking-[0.5em] text-zinc-500 italic">Nocturne Control Panel · Ver 2.5.0</p>
        </footer>
      </div>
    </div>
  );
};

export default Settings;
