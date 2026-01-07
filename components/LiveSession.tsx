import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const LiveSession: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState('未上线');
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<{id: string, text: string, type: 'ai' | 'info'}[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef(0);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<number | null>(null);

  const FRAME_RATE = 1; 
  const JPEG_QUALITY = 0.5;

  const addMessage = (text: string, type: 'ai' | 'info' = 'ai') => {
    const id = Math.random().toString(36).substring(7);
    setMessages(prev => [...prev.slice(-10), { id, text, type }]);
  };

  const startSession = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    setStatus('推流初始化...');

    try {
      // Initialize GoogleGenAI with named parameters
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: { width: 640, height: 480, frameRate: 15 } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      audioContextInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      // Connect to the Live API using the correct model version
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus('正在直播');
            setIsConnected(true);
            setIsConnecting(false);
            setViewerCount(Math.floor(Math.random() * 500) + 100);
            addMessage('直播间已成功推流，AI 助手子夜已加入', 'info');

            const source = audioContextInRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              // CRITICAL: Solely rely on sessionPromise resolves to send real-time input.
              // To support muting while adhering to the "no other condition checks" rule, 
              // we process the audio data instead of blocking the send call.
              const inputData = e.inputBuffer.getChannelData(0);
              const audioToSend = isMuted ? new Float32Array(inputData.length) : inputData;
              const pcmBlob = createBlob(audioToSend);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextInRef.current!.destination);

            const canvas = canvasRef.current!;
            const ctx = canvas.getContext('2d')!;
            frameIntervalRef.current = window.setInterval(() => {
              if (!videoRef.current) return;
              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;
              ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
              
              canvas.toBlob(async (blob) => {
                if (blob) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const base64Data = (reader.result as string).split(',')[1];
                    sessionPromise.then((session) => {
                      session.sendRealtimeInput({
                        media: { data: base64Data, mimeType: 'image/jpeg' }
                      });
                    });
                  };
                  reader.readAsDataURL(blob);
                }
              }, 'image/jpeg', JPEG_QUALITY);
            }, 1000 / FRAME_RATE);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              addMessage(text, 'ai');
            }

            // Extract audio data bytes directly from the server message
            const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64EncodedAudioString && audioContextOutRef.current) {
              const ctx = audioContextOutRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64EncodedAudioString), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              for (const source of sourcesRef.current.values()) {
                try { source.stop(); } catch(e) {}
              }
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('直播连接错误:', e);
            stopSession();
          },
          onclose: () => stopSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: "你现在是一个名为“子夜”的午夜情感电台副播。你正在观看这位用户的实况直播。请通过摄像头观察用户的状态、表情、动作和环境。如果用户看起来情绪低落，请用最温柔的话语安慰；如果用户在展示什么，请给出真诚的反馈。你的声音必须保持磁性、温和、富有同情心。严禁使用任何英文单词，必须全程使用纯正、地道的中文进行交流。你的回复要简短且富有哲理，像深夜里的老朋友一样陪伴在用户身边。",
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('无法启动直播会话:', err);
      setStatus('连接失败');
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    if (scriptProcessorRef.current) scriptProcessorRef.current.disconnect();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch(e) {}
      sessionRef.current = null;
    }
    for (const source of sourcesRef.current.values()) {
      try { source.stop(); } catch(e) {}
    }
    sourcesRef.current.clear();
    setIsConnected(false);
    setIsConnecting(false);
    setStatus('未上线');
    setMessages([]);
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className="h-full flex flex-col bg-black relative overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />

      {/* 直播主视窗 */}
      <div className="flex-1 relative flex items-center justify-center bg-zinc-900 overflow-hidden">
        {isConnected ? (
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className="w-full h-full object-cover animate-in fade-in duration-1000"
          />
        ) : (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10 shadow-inner">
              <i className="fa-solid fa-video-slash text-3xl text-zinc-700"></i>
            </div>
            <p className="text-zinc-500 font-black tracking-widest uppercase italic text-sm">点击下方按钮开启深夜视听直播</p>
          </div>
        )}

        {/* 状态监控 */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
          <div className="flex items-center space-x-3">
             <div className={`px-4 py-1.5 rounded-full text-[11px] font-black flex items-center space-x-2 border transition-colors ${isConnected ? 'bg-red-600 border-red-500 animate-pulse' : 'bg-zinc-800 border-zinc-700'}`}>
                <div className="w-2 h-2 rounded-full bg-white"></div>
                <span>{status}</span>
             </div>
             {isConnected && (
               <div className="px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full text-[11px] font-bold flex items-center space-x-2 border border-white/10 shadow-xl">
                 <i className="fa-solid fa-users text-zinc-400"></i>
                 <span>{viewerCount} 位共鸣者</span>
               </div>
             )}
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
               <i className="fa-solid fa-cog text-white text-xs"></i>
            </div>
          </div>
        </div>

        {/* 弹幕留言区 */}
        <div className="absolute bottom-24 left-6 right-6 max-w-sm pointer-events-none z-20">
          <div className="space-y-3 flex flex-col justify-end min-h-[250px]">
            {messages.map((msg) => (
              <div key={msg.id} className={`p-3.5 rounded-2xl text-[13px] backdrop-blur-xl border animate-in slide-in-from-left duration-500 ${msg.type === 'ai' ? 'bg-white/10 border-white/10 text-white shadow-lg' : 'bg-red-600/20 border-red-600/30 text-red-400 font-bold'}`}>
                <span className="font-black text-[9px] uppercase tracking-widest opacity-60 block mb-1">
                  {msg.type === 'ai' ? '副播 · 子夜' : '系统提示'}
                </span>
                {msg.text}
              </div>
            ))}
          </div>
        </div>

        {/* 互动功能 */}
        {isConnected && (
          <div className="absolute right-6 bottom-32 flex flex-col space-y-8 z-20">
            <button className="flex flex-col items-center space-y-1 group">
               <div className="w-14 h-14 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-white group-hover:bg-red-600 group-hover:border-red-500 transition-all shadow-xl active:scale-90">
                  <i className="fa-solid fa-heart text-2xl"></i>
               </div>
               <span className="text-[10px] font-black tracking-widest opacity-60">喜欢</span>
            </button>
            <button className="flex flex-col items-center space-y-1 group">
               <div className="w-14 h-14 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-white group-hover:bg-white/10 transition-all shadow-xl active:scale-90">
                  <i className="fa-solid fa-share text-xl"></i>
               </div>
               <span className="text-[10px] font-black tracking-widest opacity-60">分享</span>
            </button>
          </div>
        )}
      </div>

      {/* 控制栏 */}
      <div className="h-28 bg-black border-t border-white/5 flex items-center justify-center space-x-10 px-6 z-30 shadow-[0_-20px_50px_rgba(0,0,0,1)]">
        {!isConnected ? (
          <button 
            onClick={startSession}
            disabled={isConnecting}
            className="px-20 py-5 rounded-full bg-red-600 text-white font-black uppercase text-[13px] tracking-[0.4em] shadow-[0_15px_40px_rgba(194,12,12,0.4)] hover:bg-red-500 transition-all active:scale-95 disabled:opacity-50"
          >
            {isConnecting ? '初始化直播中...' : '开启深夜视听共鸣'}
          </button>
        ) : (
          <div className="flex items-center space-x-8">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`w-16 h-16 rounded-full flex items-center justify-center border transition-all shadow-2xl active:scale-90 ${isMuted ? 'bg-red-600 border-red-500 text-white' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}`}
            >
              <i className={`fa-solid ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'} text-xl`}></i>
            </button>
            
            <button 
              onClick={stopSession}
              className="px-16 py-5 rounded-full bg-white text-black font-black uppercase text-[13px] tracking-[0.3em] hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
            >
              结束直播
            </button>
            
            <button className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-all shadow-2xl active:scale-90">
              <i className="fa-solid fa-arrows-rotate text-xl"></i>
            </button>
          </div>
        )}
      </div>

      <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')]"></div>
      </div>
    </div>
  );
};

export default LiveSession;