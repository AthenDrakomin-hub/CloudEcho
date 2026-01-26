
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Music, Video, Terminal, RefreshCw, Lock, Unlock, Trash2, X,
  Music2, Film, Image as ImageIcon, ExternalLink, FileText, 
  ChevronLeft, ChevronRight, Activity, ShieldAlert, Upload, Search,
  Play, Pause, Volume2, Database, Zap, Cpu, Sparkles
} from 'lucide-react';
import { NavSection, SystemStats } from './types';
import Plate from './components/Plate';
import MusicVisualizer from './components/MusicVisualizer';
import { 
  listCloudFiles, uploadFileSecurely, deleteFileSecurely, unlockSession, 
  getFileMetadata, CloudFile, formatBytes 
} from './services/storageService';
import { generateSystemReport, generateAlbumArt } from './services/geminiService';

const PAGE_SIZE_GRID = 12;
const PAGE_SIZE_LIST = 10;

const App: React.FC = () => {
  const [activeNav, setActiveNav] = useState<NavSection>(NavSection.Dashboard);
  const [cloudFiles, setCloudFiles] = useState<CloudFile[]>([]);
  const [metadataCache, setMetadataCache] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [time, setTime] = useState(new Date().toLocaleTimeString('zh-CN', { hour12: false }));
  const [sysReport, setSysReport] = useState("CORE STABILITY MAINTAINED. ALL NODES SYNCED.");
  
  // Security State
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Pagination states
  const [pages, setPages] = useState<Record<string, number>>({
    [NavSection.Music]: 1,
    [NavSection.Video]: 1,
    [NavSection.News]: 1
  });

  // Media states
  const [currentAudio, setCurrentAudio] = useState<CloudFile | null>(null);
  const [albumArtUrl, setAlbumArtUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentVideo, setCurrentVideo] = useState<CloudFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo<SystemStats>(() => ({
    cpu: Math.floor(Math.random() * 15) + 10,
    memory: '3.8GB / 16GB',
    latency: '12ms',
    uptime: '124:14:02'
  }), [time]);

  // Filtered files from storage
  const musicFiles = useMemo(() => cloudFiles.filter(f => f.key.startsWith('music/')), [cloudFiles]);
  const videoFiles = useMemo(() => cloudFiles.filter(f => f.key.startsWith('VCD/')), [cloudFiles]);
  const wwwFiles = useMemo(() => cloudFiles.filter(f => f.key.startsWith('WWW/')), [cloudFiles]);

  const getPaginatedData = (data: CloudFile[], section: NavSection, pageSize: number) => {
    const page = pages[section] || 1;
    return data.slice((page - 1) * pageSize, page * pageSize);
  };

  const loadPageMetadata = useCallback(async (files: CloudFile[]) => {
    const keysToFetch = files.filter(f => !metadataCache[f.key]).map(f => f.key);
    if (keysToFetch.length === 0) return;
    const results = await Promise.all(keysToFetch.map(async key => ({
      key,
      name: await getFileMetadata(key)
    })));
    setMetadataCache(prev => {
      const next = { ...prev };
      results.forEach(res => { if (res.name) next[res.key] = res.name; });
      return next;
    });
  }, [metadataCache]);

  useEffect(() => {
    let targetFiles: CloudFile[] = [];
    if (activeNav === NavSection.Music) targetFiles = getPaginatedData(musicFiles, NavSection.Music, PAGE_SIZE_LIST);
    else if (activeNav === NavSection.Video) targetFiles = getPaginatedData(videoFiles, NavSection.Video, PAGE_SIZE_GRID);
    else if (activeNav === NavSection.News) targetFiles = getPaginatedData(wwwFiles, NavSection.News, PAGE_SIZE_LIST);
    if (targetFiles.length > 0) loadPageMetadata(targetFiles);
  }, [activeNav, pages, musicFiles, videoFiles, wwwFiles]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString('zh-CN', { hour12: false })), 1000);
    return () => clearInterval(timer);
  }, []);

  // Audio Playback Sync
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.warn("Playback prevented:", err);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentAudio]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedCloudFiles = await listCloudFiles();
      setCloudFiles(fetchedCloudFiles);
      setSysReport("DATA BUFFER UPDATED. CLUSTER SYNC COMPLETE.");
    } catch (e) {
      setSysReport("SYNC ERROR: STORAGE CLUSTER UNREACHABLE.");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { refreshData(); }, []);

  const runAiDiagnostic = async () => {
    setIsAiLoading(true);
    setSysReport("RUNNING AI DIAGNOSTIC CORE...");
    const report = await generateSystemReport({
      cpu: stats.cpu,
      memory: stats.memory,
      latency: stats.latency,
      fileCount: cloudFiles.length
    });
    setSysReport(report);
    setIsAiLoading(false);
  };

  const generateArt = async () => {
    if (!currentAudio) return;
    setIsAiLoading(true);
    const trackName = metadataCache[currentAudio.key] || currentAudio.key.split('/').pop() || "UNKNOWN";
    setSysReport(`SYNTHESIZING VISUAL DATA FOR: ${trackName}...`);
    const art = await generateAlbumArt(trackName);
    if (art) {
      setAlbumArtUrl(art);
      setSysReport("VISUAL SYNTHESIS COMPLETE.");
    } else {
      setSysReport("VISUAL SYNTHESIS FAILED: CORE SATURATION.");
    }
    setIsAiLoading(false);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handlePlayAudio = (file: CloudFile) => {
    if (currentAudio?.key === file.key) {
      setIsPlaying(!isPlaying);
    } else { 
      setCurrentAudio(file); 
      setAlbumArtUrl(null); // Reset art for new track
      setIsPlaying(true); 
      setCurrentTime(0);
    }
  };

  const requestAuthorization = (action: () => void) => {
    if (authToken) {
      action();
    } else {
      setPendingAction(() => action);
      setShowSecurityModal(true);
    }
  };

  const handleUnlock = async () => {
    setIsLoading(true);
    setAuthError(false);
    const token = await unlockSession(passwordInput);
    if (token) {
      setAuthToken(token);
      setShowSecurityModal(false);
      setPasswordInput("");
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
      setSysReport("TERMINAL UNLOCKED. SECURE ACCESS GRANTED.");
    } else {
      setAuthError(true);
      setSysReport("ACCESS DENIED: SIGNATURE MISMATCH.");
    }
    setIsLoading(false);
  };

  const handleDelete = async (file: CloudFile) => {
    requestAuthorization(async () => {
      if (!authToken) return;
      setIsLoading(true);
      setSysReport(`PURGING OBJECT: ${file.key}...`);
      const success = await deleteFileSecurely(file.key, authToken);
      if (success) {
        setSysReport(`OBJECT PURGED SUCCESSFULLY.`);
        if (currentAudio?.key === file.key) {
          setCurrentAudio(null);
          setIsPlaying(false);
        }
        await refreshData();
      } else {
        setSysReport(`PURGE OPERATION FAILED.`);
      }
      setIsLoading(false);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    requestAuthorization(async () => {
      if (!authToken) return;
      setIsUploading(true);
      setSysReport(`INITIATING INGESTION: ${file.name.toUpperCase()}...`);
      
      let prefix = "";
      if (activeNav === NavSection.Video) prefix = "VCD/";
      else if (activeNav === NavSection.News) prefix = "WWW/";
      else if (activeNav === NavSection.Music) prefix = "music/";
      else prefix = "OTHER/";

      const success = await uploadFileSecurely(file, prefix, authToken);
      if (success) {
        setSysReport(`INGESTION COMPLETE: ${file.name.toUpperCase()}`);
        await refreshData();
      } else {
        setSysReport(`INGESTION FAILED: CHECK NODE PERMISSIONS.`);
      }
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    });
  };

  const renderPagination = (totalItems: number, section: NavSection, pageSize: number) => {
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const currentPage = pages[section] || 1;
    return (
      <div className="flex items-center gap-4 bg-black/40 border-t border-white/5 p-4 justify-between">
        <span className="text-[10px] font-mono-custom text-[#707070] uppercase tracking-wider">
          SEGMENT: {section.toUpperCase()} // INDEX {currentPage} OF {totalPages}
        </span>
        <div className="flex gap-2">
          <button 
            disabled={currentPage === 1}
            onClick={() => setPages(p => ({...p, [section]: currentPage - 1}))}
            className="p-1 border border-white/10 hover:bg-[#00f2ff] hover:text-black transition-colors disabled:opacity-20"
          ><ChevronLeft size={16} /></button>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setPages(p => ({...p, [section]: currentPage + 1}))}
            className="p-1 border border-white/10 hover:bg-[#00f2ff] hover:text-black transition-colors disabled:opacity-20"
          ><ChevronRight size={16} /></button>
        </div>
      </div>
    );
  };

  // Dashboard View
  const DashboardView = () => (
    <div className="grid grid-cols-12 grid-rows-12 gap-6 h-full w-full">
      <Plate title="Audio Control Console" className="col-span-5 row-span-6 flex flex-col">
        <div className="flex-1 m-5 border border-white/10 flex flex-col justify-center items-center p-6 bg-[#0d0d0f] relative overflow-hidden group">
          {albumArtUrl ? (
             <img src={albumArtUrl} className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity" />
          ) : (
             <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-40"></div>
          )}
          <div className="z-10 w-full text-center">
            <h2 className="text-xl font-black mb-1 truncate text-[#00f2ff] italic uppercase tracking-tighter shadow-black drop-shadow-md">
              {metadataCache[currentAudio?.key || ''] || currentAudio?.key.split('/').pop() || 'NO_SIGNAL'}
            </h2>
            <div className="text-[9px] text-white/40 font-mono-custom mb-4 uppercase tracking-[2px]">Node: {currentAudio?.key || 'System_IDLE'}</div>
            <MusicVisualizer active={isPlaying} />
          </div>
          {currentAudio && (
            <div className="w-full mt-6 z-10 space-y-1">
              <input 
                type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek}
                className="w-full h-1 bg-white/5 appearance-none cursor-pointer accent-[#00f2ff]"
              />
              <div className="flex justify-between text-[8px] font-mono-custom text-[#444] tracking-widest">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          )}
          {currentAudio && !albumArtUrl && (
             <button 
                onClick={generateArt}
                className="absolute top-2 right-2 p-2 bg-black/40 border border-white/5 text-[#ffaa00]/40 hover:text-[#ffaa00] transition-colors rounded-sm"
                title="Generate AI Album Art"
             >
                <Sparkles size={14} />
             </button>
          )}
        </div>
        <div className="px-5 pb-5 flex justify-center gap-3">
          <button 
            onClick={() => currentAudio && setIsPlaying(!isPlaying)} 
            className={`px-10 py-3 font-black uppercase tracking-[4px] text-xs flex items-center gap-3 transition-colors active:scale-95 ${isPlaying ? 'bg-red-500/10 text-red-500 border border-red-500/30' : 'bg-[#00f2ff] text-black shadow-[0_0_20px_rgba(0,242,255,0.2)]'}`}
            disabled={!currentAudio}
          >
            {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />} {isPlaying ? 'KILL' : 'BOOT'}
          </button>
        </div>
      </Plate>
      
      <Plate title="Optical Stream Matrix" className="col-span-7 row-span-7 bg-black overflow-hidden flex items-center justify-center relative">
          {currentVideo ? (
            <video src={currentVideo.url} autoPlay muted loop className="w-full h-full object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-4 text-[#1a1a1c]">
              <Film size={64} strokeWidth={1} />
              <div className="font-mono-custom uppercase tracking-[25px] animate-pulse">Disconnected</div>
            </div>
          )}
          <div className="absolute top-4 right-4 flex gap-2">
              <div className="px-2 py-1 bg-[#00f2ff]/10 border border-[#00f2ff]/30 text-[#00f2ff] text-[8px] font-mono-custom">FPS: 60.0</div>
              <div className="px-2 py-1 bg-black/40 border border-white/5 text-white/40 text-[8px] font-mono-custom">HDR: OFF</div>
          </div>
          <div className="absolute bottom-4 left-4 font-mono-custom text-[9px] text-[#00f2ff]/40 bg-black/60 px-2 py-1">VCD_CLUSTER_SYNC: {currentVideo ? 'ACTIVE' : 'IDLE'}</div>
      </Plate>

      <Plate title="Intelligence Payload (WWW/)" className="col-span-4 row-span-6 overflow-hidden">
        <div className="p-4 space-y-2 no-scrollbar h-full overflow-y-auto bg-black/20">
          {wwwFiles.length > 0 ? wwwFiles.slice(0, 10).map((f, i) => (
            <div key={i} className="border-l-2 border-[#ffaa00]/20 hover:border-[#ffaa00] pl-3 py-2 bg-white/[0.01] hover:bg-white/[0.04] transition-colors group cursor-default">
              <div className="text-[8px] text-[#444] font-mono-custom mb-1 uppercase">DATA_PKT_{i.toString().padStart(2, '0')} // {formatBytes(f.size)}</div>
              <div className="text-xs font-bold leading-tight uppercase truncate text-[#777] group-hover:text-white transition-colors">
                {metadataCache[f.key] || f.key.replace('WWW/', '')}
              </div>
            </div>
          )) : (
            <div className="h-full flex flex-col items-center justify-center text-[#222] italic text-[10px] uppercase tracking-widest gap-2">
              <Database size={24} />
              No Data Objects
            </div>
          )}
        </div>
      </Plate>

      <Plate title="Security Grid Management" className="col-span-8 row-span-5 p-8 flex gap-12 bg-[#0d0d0f]">
        <div className="flex-1 space-y-8">
          <div className={`p-5 border transition-all duration-500 flex justify-between items-center ${authToken ? 'border-[#00f2ff]/40 bg-[#00f2ff]/5 shadow-[0_0_15px_rgba(0,242,255,0.05)]' : 'border-red-500/20 bg-red-500/5'}`}>
             <div className="flex flex-col">
                <span className="text-[10px] text-[#444] font-mono-custom uppercase tracking-[4px] mb-2">Terminal Access</span>
                <span className={`text-xl font-black uppercase italic tracking-tighter ${authToken ? 'text-[#00f2ff]' : 'text-red-500'}`}>
                  {authToken ? 'AUTHORIZED' : 'PROTOCOL_LOCK'}
                </span>
             </div>
             <div className={authToken ? 'text-[#00f2ff]' : 'text-red-500'}>
                {authToken ? <Unlock size={32} /> : <Lock size={32} />}
             </div>
          </div>
          <div className="grid grid-cols-2 gap-10">
             <div className="space-y-4">
                <div className="flex justify-between text-[9px] font-mono-custom uppercase tracking-widest text-[#555]"><span>Processor Load</span><span className="text-[#00f2ff]">{stats.cpu}%</span></div>
                <div className="h-1 bg-white/5 w-full relative"><div className="h-full bg-[#00f2ff] shadow-[0_0_10px_#00f2ff]" style={{width: `${stats.cpu}%`}} /></div>
             </div>
             <div className="space-y-4">
                <div className="flex justify-between text-[9px] font-mono-custom uppercase tracking-widest text-[#555]"><span>Sync Health</span><span className="text-[#ffaa00]">Stable</span></div>
                <div className="h-1 bg-white/5 w-full relative"><div className="h-full bg-[#ffaa00] shadow-[0_0_10px_#ffaa00]" style={{width: `84%`}} /></div>
             </div>
          </div>
        </div>
        <div className="w-56 border border-white/5 flex flex-col items-center justify-center bg-black/30 relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-br from-[#00f2ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
           <button 
            onClick={runAiDiagnostic}
            disabled={isAiLoading}
            className="flex flex-col items-center gap-3 group relative z-10"
           >
              <Zap size={48} className={`${isAiLoading ? 'text-[#ffaa00] animate-bounce' : 'text-[#00f2ff]/20 group-hover:text-[#00f2ff]'} transition-colors duration-500`} />
              <div className="font-mono-custom text-[8px] text-[#444] group-hover:text-[#00f2ff] uppercase tracking-widest transition-colors">Run AI Diagnostic</div>
           </button>
           <div className="absolute bottom-2 right-2 text-[6px] font-mono-custom text-white/5 uppercase">Gemini-3-Flash</div>
        </div>
      </Plate>
    </div>
  );

  const MusicView = () => {
    const pFiles = getPaginatedData(musicFiles, NavSection.Music, PAGE_SIZE_LIST);
    return (
      <div className="grid grid-cols-12 h-full gap-6 overflow-hidden">
        <Plate title="Audio Signal Library (music/)" className="col-span-8 flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
            <h3 className="text-sm font-black italic tracking-widest text-[#00f2ff]">INDEX // AUDIO_NODES</h3>
            <button onClick={() => fileInputRef.current?.click()} className="bg-[#00f2ff]/10 hover:bg-[#00f2ff] hover:text-black border border-[#00f2ff]/30 px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-colors">Ingest Signal</button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar p-2 bg-black/10">
            <div className="flex flex-col gap-1">
              {pFiles.map((f, i) => (
                <div key={i} className={`p-4 border-b border-white/5 flex items-center justify-between group hover:bg-white/[0.04] transition-colors cursor-pointer ${currentAudio?.key === f.key ? 'bg-[#00f2ff]/5 border-l-4 border-l-[#00f2ff]' : ''}`} onClick={() => handlePlayAudio(f)}>
                  <div className="flex items-center gap-5 truncate flex-1">
                    <Music2 size={18} className={currentAudio?.key === f.key ? 'text-[#00f2ff]' : 'text-[#333] group-hover:text-white/40'} />
                    <div className="flex flex-col truncate">
                       <span className={`text-xs uppercase font-black truncate tracking-tight transition-colors ${currentAudio?.key === f.key ? 'text-[#00f2ff]' : 'text-[#777] group-hover:text-white'}`}>
                        {metadataCache[f.key] || f.key.replace('music/', '')}
                       </span>
                       <span className="text-[8px] font-mono-custom text-[#333] mt-0.5">{f.key}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-[10px] font-mono-custom text-[#444] uppercase">{formatBytes(f.size)}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(f); }} className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 transition-opacity rounded-sm"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {renderPagination(musicFiles.length, NavSection.Music, PAGE_SIZE_LIST)}
        </Plate>
        <Plate title="Playback Synthesis Node" className="col-span-4 flex flex-col items-center justify-center p-8 bg-[#0d0d0f]">
            <div className={`relative w-64 h-64 rounded-sm border border-white/10 flex items-center justify-center mb-10 transition-all duration-700 overflow-hidden ${isPlaying ? 'bg-[#00f2ff]/5 shadow-[0_0_60px_rgba(0,242,255,0.05)]' : 'opacity-40'}`}>
               {albumArtUrl ? (
                  <img src={albumArtUrl} className="absolute inset-0 w-full h-full object-cover" />
               ) : (
                  <Music size={72} strokeWidth={1} className={isPlaying ? 'text-[#00f2ff] animate-pulse' : 'text-[#222]'} />
               )}
               {isPlaying && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#00f2ff] animate-[pulse_1.5s_infinite]"></div>}
            </div>
            <h3 className="text-xl font-black italic uppercase text-center w-full mb-8 px-6 truncate tracking-tighter">{metadataCache[currentAudio?.key || ''] || 'NODE_OFFLINE'}</h3>
            
            {currentAudio && (
              <div className="w-full space-y-6 px-6 mb-10">
                <div className="flex justify-center gap-10">
                   <button onClick={() => setIsPlaying(!isPlaying)} className="p-5 bg-white/5 hover:bg-[#00f2ff] hover:text-black rounded-full transition-colors active:scale-90">
                     {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
                   </button>
                   {!albumArtUrl && (
                     <button onClick={generateArt} disabled={isAiLoading} className="p-5 bg-white/5 hover:bg-[#ffaa00] hover:text-black rounded-full transition-colors active:scale-90">
                       <Sparkles size={28} className={isAiLoading ? 'animate-spin' : ''} />
                     </button>
                   )}
                </div>
                <div className="space-y-2">
                  <input 
                    type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek}
                    className="w-full h-1.5 bg-[#1a1a1c] appearance-none cursor-pointer accent-[#00f2ff]"
                    style={{
                      background: `linear-gradient(to right, #00f2ff ${(currentTime / (duration || 1)) * 100}%, #1a1a1c ${(currentTime / (duration || 1)) * 100}%)`
                    }}
                  />
                  <div className="flex justify-between text-[10px] font-mono-custom text-[#444] uppercase tracking-[3px]">
                    <span className={isPlaying ? 'text-[#00f2ff]' : ''}>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>
            )}

            <MusicVisualizer active={isPlaying} />
        </Plate>
      </div>
    );
  };

  const VideoView = () => {
    const pFiles = getPaginatedData(videoFiles, NavSection.Video, PAGE_SIZE_GRID);
    return (
      <div className="grid grid-cols-12 h-full gap-6 overflow-hidden">
        <Plate title="Visual Matrix Repository (VCD/)" className="col-span-12 flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
            <h3 className="text-sm font-black italic tracking-widest text-[#ffaa00]">GRID_CELLS // MATRIX_NODES</h3>
            <button onClick={() => fileInputRef.current?.click()} className="bg-[#ffaa00]/10 hover:bg-[#ffaa00] hover:text-black border border-[#ffaa00]/30 px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-colors">Import Flux</button>
          </div>
          <div className="flex-1 p-8 grid grid-cols-4 gap-8 overflow-y-auto no-scrollbar bg-black/10">
             {pFiles.map((f, i) => (
               <div key={i} className={`group relative aspect-video border p-4 flex flex-col justify-between transition-colors duration-300 cursor-pointer ${currentVideo?.key === f.key ? 'border-[#00f2ff] bg-[#00f2ff]/5 shadow-[0_0_30px_rgba(0,242,255,0.1)]' : 'border-white/5 bg-black/40 hover:border-white/20'}`} onClick={() => setCurrentVideo(f)}>
                 <div className="flex-1 flex items-center justify-center">
                   <Film size={32} strokeWidth={1} className={currentVideo?.key === f.key ? 'text-[#00f2ff]' : 'opacity-10 group-hover:opacity-40 transition-opacity'} />
                 </div>
                 <div className="text-[10px] font-black uppercase text-center tracking-tight text-[#555] truncate group-hover:text-white mt-4 italic transition-colors">
                   {metadataCache[f.key] || f.key.replace('VCD/', '')}
                 </div>
                 <button onClick={(e) => { e.stopPropagation(); handleDelete(f); }} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500 p-1.5 hover:bg-red-500/10 transition-opacity rounded-sm"><Trash2 size={14} /></button>
               </div>
             ))}
          </div>
          {renderPagination(videoFiles.length, NavSection.Video, PAGE_SIZE_GRID)}
        </Plate>
      </div>
    );
  };

  const NewsView = () => {
    const pFiles = getPaginatedData(wwwFiles, NavSection.News, PAGE_SIZE_LIST);
    return (
      <div className="grid grid-cols-12 h-full gap-6 overflow-hidden">
        <Plate title="Intelligence Archive Browser (WWW/)" className="col-span-8 flex flex-col h-full overflow-hidden">
           <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between">
             <h3 className="text-sm font-black italic tracking-widest text-[#ffaa00]">WWW_OBJECTS // DIRECTORY</h3>
             <button onClick={() => fileInputRef.current?.click()} className="bg-[#ffaa00]/10 hover:bg-[#ffaa00] hover:text-black border border-[#ffaa00]/30 px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-colors">Archive Data</button>
           </div>
           <div className="flex-1 p-6 flex flex-col gap-3 overflow-y-auto no-scrollbar bg-black/5">
             {pFiles.map((f, i) => (
               <div key={i} className="p-5 border border-white/5 bg-white/[0.01] hover:bg-white/[0.04] flex justify-between items-center group transition-colors">
                 <div className="flex items-center gap-6 truncate flex-1">
                    <div className="p-3 bg-black/60 border border-white/5 text-[#333] group-hover:text-[#ffaa00] transition-colors">
                      {f.type === 'image' ? <ImageIcon size={24} strokeWidth={1} /> : <FileText size={24} strokeWidth={1} />}
                    </div>
                    <div className="flex flex-col truncate">
                       <span className="text-[9px] font-mono-custom text-[#444] uppercase mb-1 tracking-widest transition-colors group-hover:text-[#ffaa00]/60">OBJ_ID_{i.toString().padStart(3, '0')} // VOL_{formatBytes(f.size)}</span>
                       <span className="text-base font-black truncate uppercase italic text-[#777] group-hover:text-white transition-colors tracking-tight">{metadataCache[f.key] || f.key.replace('WWW/', '')}</span>
                    </div>
                 </div>
                 <div className="flex gap-4 items-center">
                    <a href={f.url} target="_blank" rel="noreferrer" className="p-3 border border-white/10 text-[#333] hover:text-[#ffaa00] hover:bg-[#ffaa00]/5 transition-colors"><ExternalLink size={20} /></a>
                    <button onClick={() => handleDelete(f)} className="opacity-0 group-hover:opacity-100 p-3 text-red-500 hover:bg-red-500/10 transition-opacity rounded-sm"><Trash2 size={20} /></button>
                 </div>
               </div>
             ))}
           </div>
           {renderPagination(wwwFiles.length, NavSection.News, PAGE_SIZE_LIST)}
        </Plate>
        <Plate title="Signal Decoding Node" className="col-span-4 p-10 flex flex-col overflow-hidden bg-[#0d0d0f]">
           <div className="space-y-8 flex-1 overflow-y-auto no-scrollbar">
              <div className="border-l-4 border-[#ffaa00] pl-6 mb-10">
                 <h4 className="text-xs font-black uppercase tracking-[5px] text-[#ffaa00]">Data Parsing</h4>
              </div>
              <p className="text-[11px] font-mono-custom text-[#555] leading-relaxed uppercase tracking-tighter">
                Scanning intelligence directory for stored payloads. Total verified objects: {wwwFiles.length.toString().padStart(4, '0')}. Encryption state: Nominal. 
              </p>
              <div className="space-y-4 mt-10">
                <div className="text-[9px] text-[#444] font-mono-custom uppercase tracking-widest mb-2 border-b border-white/5 pb-2">Active Buffer:</div>
                {wwwFiles.slice(0, 8).map((f, i) => (
                  <div key={i} className="p-3 bg-black/40 border border-white/5 text-[10px] font-mono-custom flex justify-between group hover:border-[#ffaa00]/40 transition-colors">
                    <span className="text-[#ffaa00]/40 group-hover:text-[#ffaa00] transition-colors">0{i}</span>
                    <span className="text-[#333] truncate ml-6 italic group-hover:text-[#777] transition-colors">{f.key.split('/').pop()}</span>
                  </div>
                ))}
              </div>
           </div>
        </Plate>
      </div>
    );
  };

  const StorageView = () => (
    <div className="grid grid-cols-12 gap-6 h-full overflow-hidden">
      <Plate title="Node Allocation Overview" className="col-span-4 p-10 space-y-12 bg-[#0d0d0f]">
        <div className="space-y-8">
           <h3 className="text-sm font-black uppercase italic tracking-[5px] border-b border-white/5 pb-4">Cluster Metrics</h3>
           {[
             { name: 'MUSIC_NODE', count: musicFiles.length, size: musicFiles.reduce((a,b)=>a+b.size,0), color: '#00f2ff' },
             { name: 'VCD_MATRIX', count: videoFiles.length, size: videoFiles.reduce((a,b)=>a+b.size,0), color: '#ffaa00' },
             { name: 'WWW_INTEL', count: wwwFiles.length, size: wwwFiles.reduce((a,b)=>a+b.size,0), color: '#707070' }
           ].map(p => (
             <div key={p.name} className="space-y-3 group">
               <div className="flex justify-between text-[10px] font-mono-custom uppercase tracking-widest text-[#555]"><span>{p.name}</span><span>{formatBytes(p.size)}</span></div>
               <div className="h-1.5 bg-white/5 w-full relative overflow-hidden"><div className="h-full transition-all duration-1000" style={{backgroundColor: p.color, width: '45%', boxShadow: `0 0 15px ${p.color}`}} /></div>
               <div className="flex justify-between text-[8px] font-mono-custom text-[#333] uppercase"><span>Nodes: {p.count}</span><span>Sync: Verified</span></div>
             </div>
           ))}
        </div>
      </Plate>
      <Plate title="Global Object Index" className="col-span-8 flex flex-col h-full overflow-hidden">
        <div className="p-4 bg-black/20 border-b border-white/5 flex justify-between items-center">
           <h3 className="text-sm font-bold uppercase tracking-[10px] italic">WANGYIYUN://CLUSTER_MAP/</h3>
           <button onClick={refreshData} className="p-3 border border-[#00f2ff]/30 text-[#00f2ff] hover:bg-[#00f2ff] hover:text-black transition-colors active:scale-95"><RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} /></button>
        </div>
        <div className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto no-scrollbar bg-black/5">
           {cloudFiles.map((f, i) => (
             <div key={i} className="p-4 border-b border-white/5 flex justify-between items-center text-xs hover:bg-white/[0.03] group transition-colors">
                <div className="flex items-center gap-6">
                  <span className="text-[9px] font-mono-custom text-[#333]">{i.toString().padStart(4, '0')}</span>
                  <span className="truncate uppercase font-black text-[#555] group-hover:text-white transition-colors tracking-tight italic">{f.key}</span>
                </div>
                <div className="flex items-center gap-10">
                  <span className="text-[10px] font-mono-custom text-[#333] uppercase">{formatBytes(f.size)}</span>
                  <button onClick={() => handleDelete(f)} className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity p-2 hover:bg-red-500/10 rounded-sm"><Trash2 size={16} /></button>
                </div>
             </div>
           ))}
        </div>
      </Plate>
    </div>
  );

  const CurrentView = useMemo(() => {
    switch(activeNav) {
      case NavSection.Dashboard: return <DashboardView />;
      case NavSection.Music: return <MusicView />;
      case NavSection.Video: return <VideoView />;
      case NavSection.News: return <NewsView />;
      case NavSection.Storage: return <StorageView />;
      default: return <DashboardView />;
    }
  }, [activeNav, cloudFiles, isLoading, isPlaying, currentAudio, currentVideo, pages, metadataCache, authToken, currentTime, duration, albumArtUrl, isAiLoading]);

  return (
    <div className="flex h-screen w-screen bg-[#0a0a0c] text-[#e0e0e0] overflow-hidden brushed-texture relative">
      {/* Background Decorative Fragments */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-[#00f2ff]/5 [clip-path:polygon(0%_0%,100%_0%,75%_100%,0%_80%)] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[50%] bg-[#ffaa00]/5 [clip-path:polygon(20%_0%,100%_20%,100%_100%,0%_100%)] pointer-events-none"></div>

      {currentAudio && (
        <audio 
          key={currentAudio.key}
          ref={audioRef} 
          src={currentAudio.url} 
          onEnded={() => { setIsPlaying(false); setCurrentTime(0); }} 
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          crossOrigin="anonymous"
        />
      )}
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

      {/* Security Overlay */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/98 backdrop-blur-xl p-4">
          <div className="w-full max-w-md bg-gradient-to-br from-[#1a1c1f] to-[#0d0e10] border border-red-500/30 p-10 shadow-[0_0_100px_rgba(255,0,0,0.15)] relative">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-500"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-500"></div>

            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-5 text-red-500">
                 <ShieldAlert size={36} strokeWidth={1.5} />
                 <h2 className="text-3xl font-black italic uppercase tracking-tighter">Protocol Lockout</h2>
              </div>
              <button onClick={() => setShowSecurityModal(false)} className="text-[#333] hover:text-white transition-colors"><X size={32} /></button>
            </div>
            
            <div className="space-y-10">
              <div className="font-mono-custom text-[11px] text-[#555] uppercase leading-loose tracking-widest">
                System state: MODIFICATION_REQUEST_DETECTION. Secure terminal restricted under Node-88 Authorization Protocol. Signature verification required.
              </div>
              
              <div className="relative">
                <Lock size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#333]" />
                <input 
                  type="password" 
                  autoFocus
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                  placeholder="AUTHORIZATION_SIG" 
                  className={`w-full bg-black border ${authError ? 'border-red-500' : 'border-white/10'} rounded-none py-5 pl-14 pr-4 text-sm font-mono-custom tracking-[15px] focus:outline-none focus:border-[#00f2ff] transition-all`}
                />
                {authError && <div className="mt-4 text-[10px] font-mono-custom text-red-500 uppercase italic tracking-[2px]">Denied: Terminal signature mismatch.</div>}
              </div>

              <button 
                onClick={handleUnlock}
                disabled={isLoading || !passwordInput}
                className="w-full bg-white text-black font-black py-5 uppercase tracking-[6px] hover:bg-[#00f2ff] disabled:opacity-20 transition-all flex items-center justify-center gap-4 active:scale-95"
              >
                {isLoading ? <RefreshCw className="animate-spin" size={20} /> : 'Override Lock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main UI */}
      <aside className="w-[300px] bg-gradient-to-br from-[#1e2023] to-[#0a0a0c] border-r border-white/10 flex flex-col p-10 z-20 shadow-[15px_0_50px_rgba(0,0,0,0.7)]">
        <div className="flex items-center gap-4 text-2xl font-black mb-24 tracking-tighter cursor-pointer group" onClick={() => setActiveNav(NavSection.Dashboard)}>
          <div className="w-10 h-10 bg-[#00f2ff] [clip-path:polygon(25%_0%,100%_0%,75%_100%,0%_100%)] shadow-[0_0_20px_#00f2ff]" />
          TECTONIC 枢轴
        </div>
        <nav className="flex flex-col gap-4">
          {Object.values(NavSection).map((section) => (
            <button key={section} onClick={() => { setActiveNav(section); }} className={`flex items-center gap-5 px-6 py-5 rounded-sm transition-colors group relative overflow-hidden ${activeNav === section ? 'text-white bg-white/5 translate-x-1 font-black italic border-r border-[#00f2ff]' : 'text-[#444] hover:text-white hover:bg-white/5 hover:translate-x-1'}`}>
              {activeNav === section && <div className="absolute left-0 top-1/4 h-1/2 w-[4px] bg-[#00f2ff] shadow-[0_0_20px_#00f2ff]" />}
              <span className="font-bold text-sm tracking-[3px] uppercase">{section}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto border border-white/5 p-8 bg-black/60 relative group shadow-inner">
          <div className="font-mono-custom text-[10px] text-[#00f2ff]/60 mb-3 flex justify-between uppercase italic tracking-widest"><span>Node Link</span><span>Synced</span></div>
          <div className="h-1 bg-[#1a1a1c] w-full overflow-hidden relative"><div className="h-full bg-[#00f2ff] shadow-[0_0_15px_#00f2ff]" style={{width: '100%'}} /></div>
          {authToken && <div className="mt-5 flex items-center gap-3 text-[10px] font-mono-custom text-[#00f2ff] uppercase tracking-[4px] animate-pulse"><Unlock size={14} /> AUTH_STABLE</div>}
        </div>
      </aside>

      <main className="flex-1 p-10 relative overflow-hidden h-full">
        <div className="h-full w-full">{CurrentView}</div>
      </main>

      <footer className="fixed bottom-0 left-[300px] right-0 h-12 bg-black border-t border-white/5 flex items-center px-10 justify-between text-[11px] font-mono-custom text-[#444] z-30 uppercase tracking-[5px]">
        <div className="flex items-center gap-8 overflow-hidden flex-1 mr-10">
           <span className="text-[#00f2ff] flex items-center gap-3 animate-pulse font-black whitespace-nowrap"><div className="w-2 h-2 rounded-full bg-[#00f2ff]" /> Status: Nominal</span>
           <span className="border-l border-white/5 pl-8 text-[#333] italic tracking-tighter lowercase truncate block">
             {isAiLoading ? "PROCESSING_DIAGNOSTIC..." : sysReport}
           </span>
        </div>
        <div className="flex items-center gap-10 whitespace-nowrap">
          <div className="flex gap-6 border-r border-white/5 pr-10 uppercase"><span className="font-black text-[#666]">Uptime: {stats.uptime}</span></div>
          <span className="text-white font-black tracking-[10px]">{time}</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
