
import React, { useState, useEffect } from 'react';
import { S3_CONFIG } from '../constants';
import { getToken, clearToken, fetchMyProfile } from '../services/discoveryService';
import Collapse from './Collapse';

interface SettingsProps {
  isHighContrast?: boolean;
  onToggleContrast?: () => void;
  brightness?: number;
  onBrightnessChange?: (val: number) => void;
  hotkeySettings?: { master: boolean; media: boolean; nav: boolean; visual: boolean };
  onHotkeyChange?: (settings: any) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  isHighContrast = false, 
  onToggleContrast,
  brightness = 1.0,
  onBrightnessChange,
  hotkeySettings = { master: true, media: true, nav: true, visual: true },
  onHotkeyChange
}) => {
  const SYSTEM_DEEZER_ID = process.env.DEEZER_APP_ID;
  const [appId, setAppId] = useState(SYSTEM_DEEZER_ID || localStorage.getItem('dz_app_id') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(!!getToken());
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedIn) {
      fetchMyProfile().then(user => {
        if (user) {
          setUserName(user.name);
          setUserAvatar(user.picture_medium || user.picture_small);
        }
      });
    }
  }, [isLoggedIn]);

  const updateHotkey = (key: string) => {
    if (onHotkeyChange) {
      onHotkeyChange({ ...hotkeySettings, [key]: !hotkeySettings[key as keyof typeof hotkeySettings] });
    }
  };

  const clearCache = () => {
    if (confirm('确定要清除所有本地记录吗？这不会影响云端数据。')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleDeezerConnect = () => {
    const finalAppId = SYSTEM_DEEZER_ID || appId;
    const redirectUri = window.location.origin + window.location.pathname;
    const perms = ['basic_access','email','offline_access','manage_library','listening_history'].join(',');
    window.location.href = `https://connect.deezer.com/oauth/auth.php?app_id=${finalAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&perms=${perms}`;
  };

  const hotkeys = [
    { key: 'Space', desc: '播放 / 暂停', type: 'media' },
    { key: 'Cmd/Ctrl + →', desc: '切向下一首', type: 'media' },
    { key: 'Cmd/Ctrl + ←', desc: '切回上一首', type: 'media' },
    { key: '↑ / ↓', desc: '增减音量', type: 'media' },
    { key: 'Cmd/Ctrl + K', desc: '全局极光搜索', type: 'nav' },
    { key: 'M', desc: '循环播放模式', type: 'nav' },
    { key: 'H', desc: '映射 UI 隐藏', type: 'visual' }
  ];

  const Toggle = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
    <button 
      onClick={onClick}
      className={`w-12 h-6 rounded-full transition-all duration-500 relative shrink-0 ${active ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/10'}`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-500 ${active ? 'left-7 shadow-lg shadow-white/50' : 'left-1'}`}></div>
    </button>
  );

  return (
    <div className="h-full p-8 md:p-12 overflow-y-auto custom-scrollbar bg-transparent">
      <div className="max-w-4xl mx-auto space-y-12 pb-20">
        
        <header className="space-y-4">
          <h1 className="text-5xl font-black italic tracking-tighter text-white aurora-text">个性化配置</h1>
          <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.5em]">感知维度微调 · AURORA SYNC v4</p>
        </header>

        <div className="space-y-6">
          <Collapse 
            title="视觉终端配置 (Terminal UI)" 
            subtitle="Theme & Contrast Controls" 
            icon="fa-palette" 
            accentColor="pink"
            defaultOpen={true}
          >
            <div className="pt-4 space-y-10">
               {/* 主题模式切换 */}
               <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 group hover:border-pink-500/30 transition-all">
                  <div className="space-y-1">
                     <p className="text-[11px] font-black text-white uppercase tracking-widest group-hover:text-pink-400 transition-colors">高对比度主题 (Contrast Boost)</p>
                     <p className="text-[9px] text-white/30 font-bold italic tracking-widest uppercase">加深暗部背景，显著增强框架线条视觉权重</p>
                  </div>
                  <Toggle active={isHighContrast} onClick={onToggleContrast || (() => {})} />
               </div>

               {/* 线条与文字亮度调节 */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                     <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">框架线条等级</p>
                        <span className="text-[9px] font-mono text-white/40">{isHighContrast ? '2px STRONG' : '1px SUBTLE'}</span>
                     </div>
                     <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-700 ${isHighContrast ? 'w-full bg-indigo-500 shadow-[0_0_10px_indigo]' : 'w-1/2 bg-white/20'}`}></div>
                     </div>
                  </div>

                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                     <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest">文字亮度调节</p>
                        <span className="text-[9px] font-mono text-white/40">{Math.round(brightness * 100)}%</span>
                     </div>
                     <div className="relative group/slide h-6 flex items-center">
                        <input 
                          type="range" min="0.5" max="1.5" step="0.01" 
                          value={brightness}
                          onChange={(e) => onBrightnessChange?.(parseFloat(e.target.value))}
                          className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-pink-500"
                        />
                     </div>
                  </div>
               </div>
               
               <p className="text-[9px] text-center font-bold text-white/10 uppercase tracking-[0.4em] italic">Visual Engine is running on Hardware Acceleration</p>
            </div>
          </Collapse>

          <Collapse 
            title="快捷键配置 (Hotkey Control)" 
            subtitle="Custom Interaction Mapping" 
            icon="fa-keyboard" 
            accentColor="cyan"
          >
            <div className="pt-4 space-y-10">
               {/* 主开关 */}
               <div className="flex items-center justify-between p-6 bg-indigo-500/10 rounded-3xl border border-indigo-500/20">
                  <div className="space-y-1">
                     <p className="text-[11px] font-black text-indigo-100 uppercase tracking-widest">全局快捷键总控</p>
                     <p className="text-[9px] text-indigo-400 font-bold italic tracking-widest uppercase">开启后将激活下列所有逻辑监听</p>
                  </div>
                  <Toggle active={hotkeySettings.master} onClick={() => updateHotkey('master')} />
               </div>

               {/* 分类控制 */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { id: 'media', label: '媒体控制', icon: 'fa-play' },
                    { id: 'nav', label: '系统导航', icon: 'fa-compass' },
                    { id: 'visual', label: '视觉特性', icon: 'fa-eye' }
                  ].map(cat => (
                    <div key={cat.id} className="p-5 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all">
                       <div className="flex items-center space-x-3">
                          <i className={`fa-solid ${cat.icon} text-[10px] text-white/30 group-hover:text-white transition-colors`}></i>
                          <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{cat.label}</span>
                       </div>
                       <Toggle active={hotkeySettings[cat.id as keyof typeof hotkeySettings]} onClick={() => updateHotkey(cat.id)} />
                    </div>
                  ))}
               </div>

               {/* 映射列表 */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hotkeys.map((hk, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 transition-opacity ${!hotkeySettings.master || !hotkeySettings[hk.type as keyof typeof hotkeySettings] ? 'opacity-20' : 'opacity-100'}`}>
                       <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{hk.desc}</span>
                       <kbd className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-mono font-black text-indigo-400 border border-white/10">{hk.key}</kbd>
                    </div>
                  ))}
               </div>
            </div>
          </Collapse>

          <Collapse 
            title="数据维护 (Maintenance)" 
            subtitle="Local Sync & Purge" 
            icon="fa-broom-ball" 
            accentColor="red"
          >
            <div className="pt-4 space-y-8">
              <button 
                onClick={clearCache} 
                className="w-full py-5 border border-red-500/30 text-red-500 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all shadow-xl active:scale-95"
              >
                立刻清除本地缓存并重载
              </button>
            </div>
          </Collapse>
        </div>

        <div className="bg-gradient-to-r from-indigo-600/20 to-pink-600/20 border border-white/5 rounded-[3.5rem] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl">
           <div className="space-y-4 text-center md:text-left">
              <h4 className="text-3xl font-black italic tracking-tight text-white drop-shadow-lg">感知维度调节已就绪</h4>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40 leading-relaxed">Aurora Sync 将根据您的交互偏好实时优化内存驻留策略。</p>
           </div>
           <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center animate-spin-slow border border-white/10">
              <i className="fa-solid fa-atom text-4xl text-indigo-400"></i>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
