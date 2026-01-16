
import React, { useState, useEffect } from 'react';
import { S3_CONFIG, EDGE_FUNCTION_CONFIG } from '../constants';
import { getPlaylists, savePlaylists } from '../services/playlistService';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'storage' | 'audio' | 'about'>('general');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{status: 'idle' | 'success' | 'error', msg: string}>({status: 'idle', msg: ''});
  
  const [config, setConfig] = useState({
    auroraBg: true,
    hdAudio: true,
    recordSpeed: 20,
    autoPlay: true
  });

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult({status: 'idle', msg: '正在建立握手协议...'});
    try {
      const res = await fetch(`${EDGE_FUNCTION_CONFIG.baseUrl}/list`, {
        method: 'POST',
        headers: { 'x-dev-key': EDGE_FUNCTION_CONFIG.devKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket: S3_CONFIG.bucketName, prefix: S3_CONFIG.folderPrefix })
      });
      if (res.ok) {
        setTestResult({status: 'success', msg: '云端链路正常 (HTTP 200)'});
      } else {
        throw new Error(`连接失败: ${res.status}`);
      }
    } catch (e: any) {
      setTestResult({status: 'error', msg: e.message || '网络连接超时'});
    }
    setIsTesting(false);
  };

  const handleExportData = () => {
    const data = {
      playlists: getPlaylists(),
      quotes: JSON.parse(localStorage.getItem('local_quotes') || '[]'),
      config: config,
      exportAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `网忆云-备份-${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.playlists) savePlaylists(data.playlists);
        if (data.quotes) localStorage.setItem('local_quotes', JSON.stringify(data.quotes));
        alert('数据恢复成功，应用将自动刷新');
        window.location.reload();
      } catch (err) {
        alert('无效的备份文件');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = (type: 'all' | 'cache' | 'playlists') => {
    if (!confirm('此操作将永久清空本地偏好设置，确定继续吗？')) return;
    if (type === 'all') {
      localStorage.clear();
    } else if (type === 'cache') {
      indexedDB.deleteDatabase('NocturneVirtualStorage');
    } else if (type === 'playlists') {
      localStorage.removeItem('nocturne_playlists');
    }
    window.location.reload();
  };

  return (
    <div className="h-full flex flex-col bg-transparent overflow-hidden">
      <div className="flex-1 p-8 md:p-16 overflow-y-auto custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-16 pb-32">
          
          <header className="space-y-4">
            <h1 className="text-5xl font-black italic aurora-text tracking-tighter">偏好设置</h1>
            <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.5em]">系统核心参数控制台</p>
          </header>

          <div className="flex bg-white/5 p-1.5 rounded-2xl w-fit border border-white/5 mb-10">
            {[
              { id: 'general', label: '常规配置', icon: 'fa-sliders' },
              { id: 'storage', label: '云端链路', icon: 'fa-server' },
              { id: 'audio', label: '音频引擎', icon: 'fa-wave-square' },
              { id: 'about', label: '关于回响', icon: 'fa-circle-info' }
            ].map(tab => (
              <button 
                key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-black shadow-xl' : 'text-white/30 hover:text-white'}`}
              >
                <i className={`fa-solid ${tab.icon}`}></i>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {activeTab === 'general' && (
              <div className="space-y-8">
                <section className="bg-white/5 border border-white/5 rounded-[2.5rem] p-10 space-y-10">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-black text-white">沉浸式视觉</p>
                      <p className="text-[10px] text-white/20 font-bold italic">背景开启高斯模糊极光效果，随封面色彩变幻</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={config.auroraBg} onChange={e => setConfig({...config, auroraBg: e.target.checked})} className="sr-only peer" />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C20C0C]"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-black text-white">黑胶唱片转速</p>
                      <p className="text-[10px] text-white/20 font-bold italic">调整唱片旋转一周所需的时间（秒）</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <input type="range" min="5" max="40" value={config.recordSpeed} onChange={e => setConfig({...config, recordSpeed: parseInt(e.target.value)})} className="w-32 accent-[#C20C0C]" />
                      <span className="text-xs font-mono text-[#C20C0C]">{config.recordSpeed}s</span>
                    </div>
                  </div>
                </section>

                <section className="bg-white/5 border border-white/5 rounded-[2.5rem] p-10 space-y-8">
                  <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest">数据资产备份</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={handleExportData} className="p-6 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between group hover:bg-white/5 transition-all text-left">
                       <div>
                         <p className="text-xs font-black text-white">导出备份包</p>
                         <p className="text-[9px] text-white/20 font-bold uppercase mt-1 italic">导出当前所有歌单与映射参数</p>
                       </div>
                       <i className="fa-solid fa-file-export text-white/10 group-hover:text-[#C20C0C]"></i>
                    </button>
                    <label className="p-6 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between group hover:bg-white/5 transition-all cursor-pointer">
                       <div className="text-left">
                         <p className="text-xs font-black text-white">导入恢复</p>
                         <p className="text-[9px] text-white/20 font-bold uppercase mt-1 italic">从 JSON 文件恢复您的私人库</p>
                       </div>
                       <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                       <i className="fa-solid fa-file-import text-white/10 group-hover:text-emerald-500"></i>
                    </label>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'storage' && (
              <div className="space-y-8">
                <section className="bg-white/5 border border-white/5 rounded-[2.5rem] p-10 space-y-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-2">
                       <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">S3 云端链路监控</h3>
                       <p className="text-sm font-black text-white">节点终端: <span className="text-white/40 font-mono text-[10px]">{S3_CONFIG.endpoint}</span></p>
                    </div>
                    <button 
                      onClick={testConnection}
                      disabled={isTesting}
                      className={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isTesting ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-white text-black hover:bg-zinc-200'}`}
                    >
                      {isTesting ? '正在探测链路...' : '执行链路自检'}
                    </button>
                  </div>
                  
                  {testResult.msg && (
                    <div className={`p-6 rounded-2xl flex items-center gap-4 border ${testResult.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : testResult.status === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-white/5 border-white/10 text-white/40'}`}>
                      <i className={`fa-solid ${testResult.status === 'success' ? 'fa-circle-check' : testResult.status === 'error' ? 'fa-circle-xmark' : 'fa-spinner animate-spin'}`}></i>
                      <p className="text-[11px] font-black uppercase tracking-widest">{testResult.msg}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/5">
                    <div className="space-y-2">
                      <p className="text-[8px] font-black text-white/20 uppercase tracking-widest italic">音频存储前缀</p>
                      <p className="text-xs font-mono text-white/60">{S3_CONFIG.folderPrefix}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[8px] font-black text-white/20 uppercase tracking-widest italic">映画存储前缀</p>
                      <p className="text-xs font-mono text-white/60">{S3_CONFIG.videoFolderPrefix}</p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="space-y-8">
                 <section className="bg-white/5 border border-white/5 rounded-[2.5rem] p-10 space-y-10">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-white">无损回响模式 (24-bit)</p>
                        <p className="text-[10px] text-white/20 font-bold italic">开启高比特率请求，还原最真实的听觉触感</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={config.hdAudio} onChange={e => setConfig({...config, hdAudio: e.target.checked})} className="sr-only peer" />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C20C0C]"></div>
                      </label>
                    </div>

                    <div className="p-8 bg-black/40 rounded-3xl border border-white/5 flex items-center gap-6">
                      <div className="w-12 h-12 bg-[#C20C0C]/10 rounded-2xl flex items-center justify-center">
                         <i className="fa-solid fa-microchip text-[#C20C0C]"></i>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white uppercase tracking-widest">核心引擎</p>
                        <p className="text-xs font-bold text-white/30 italic mt-1">WebAudio API · 采样率自动对齐 (V3)</p>
                      </div>
                    </div>
                 </section>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-12 text-center py-10">
                 <div className="w-24 h-24 bg-[#C20C0C] rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl shadow-red-900/40 mx-auto mb-8 animate-pulse">
                   <i className="fa-solid fa-cloud"></i>
                 </div>
                 <div className="space-y-4">
                    <h2 className="text-3xl font-black italic tracking-tighter uppercase">网忆云 · 回响协议</h2>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.6em]">版本 4.5.0-中文正式版</p>
                 </div>
                 <div className="max-w-md mx-auto">
                    <p className="text-xs font-bold text-white/40 leading-relaxed italic">
                      “我们不生产音乐，我们只是通过物理映射，让散落在云端的灵魂重新共鸣。”
                    </p>
                 </div>
                 <div className="pt-12">
                   <button onClick={() => handleReset('all')} className="text-[10px] font-black text-red-500 uppercase tracking-widest border-b border-red-500/20 pb-1 hover:text-red-400 transition-colors">物理重置感知系统 (清空所有本地缓存数据)</button>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
