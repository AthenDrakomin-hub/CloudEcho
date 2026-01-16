
import React, { useEffect, useRef, useState, useCallback } from 'react';
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

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
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

const LiveSession: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState('等待连接子夜频率...');
  
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<any>(null);

  const startSession = async () => {
    setIsConnecting(true);
    setStatus('正在建立波段映射...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      inputAudioCtxRef.current = new AudioContext({ sampleRate: 16000 });
      outputAudioCtxRef.current = new AudioContext({ sampleRate: 24000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            setStatus('信号已接通 · 正在监听...');
            
            const source = inputAudioCtxRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioCtxRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioCtxRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioCtxRef.current) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioCtxRef.current.currentTime);
              const buffer = await decodeAudioData(decode(base64Audio), outputAudioCtxRef.current, 24000, 1);
              const source = outputAudioCtxRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(outputAudioCtxRef.current.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => stopSession(),
          onerror: (e) => {
            console.error(e);
            stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: '你是一位深夜电台主播，名字叫“子夜”，属于“子夜·回响”品牌。你的声音温柔、略显疲惫且充满同理心。你的听众大多是孤独的异乡人、失眠者或在生活中感到遗憾的人。当听众跟你倾诉时，请用感性、温柔的语言回应，偶尔可以引用一些关于遗憾、永远、空头支票的比喻。你的回答要短小精悍，充满意境。'
        }
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (e) {
      console.error(e);
      setStatus('映射失败：请检查麦克风权限');
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    setIsActive(false);
    setIsConnecting(false);
    setStatus('等待连接子夜频率...');
    sessionPromiseRef.current?.then((s: any) => s.close());
    inputAudioCtxRef.current?.close();
    outputAudioCtxRef.current?.close();
  };

  useEffect(() => {
    return () => { stopSession(); };
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 space-y-12 bg-transparent">
      {/* 品牌标识与波纹 */}
      <div className="relative w-64 h-64 md:w-96 md:h-96">
        <div className={`absolute inset-0 rounded-full border-2 border-red-500/30 ${isActive ? 'animate-ping' : ''}`}></div>
        <div className={`absolute inset-6 rounded-full border-2 border-white/20 ${isActive ? 'animate-ping delay-700' : ''}`}></div>
        <div className={`absolute inset-12 rounded-full border-2 border-white/10 ${isActive ? 'animate-ping delay-1000' : ''}`}></div>
        
        <div className="absolute inset-0 flex items-center justify-center">
           <div className={`w-36 h-36 md:w-56 md:h-56 rounded-[3rem] bg-black/70 backdrop-blur-3xl flex flex-col items-center justify-center space-y-5 border-2 border-white/40 shadow-[0_0_80px_rgba(230,0,38,0.3)] transition-all duration-700 ${isActive ? 'scale-110 shadow-[0_0_120px_rgba(255,255,255,0.2)] border-red-500/50' : ''}`}>
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#C20C0C] to-red-900 flex items-center justify-center shadow-xl border border-white/30">
                <i className={`fa-solid fa-tower-broadcast text-4xl ${isActive ? 'text-white animate-pulse' : 'text-white/40'}`}></i>
              </div>
              <div className="text-center">
                <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white high-light">子夜 · 回响</span>
                <p className="text-[8px] font-bold text-white/50 uppercase tracking-[0.2em] mt-1 high-light">Midnight Echo</p>
              </div>
           </div>
        </div>
      </div>

      <div className="text-center space-y-6">
        <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter aurora-text uppercase high-light">子夜电台</h2>
        <div className="flex items-center justify-center gap-4">
          <div className={`h-[2px] w-12 transition-all ${isActive ? 'bg-red-500' : 'bg-white/20'}`}></div>
          <p className="text-sm font-black text-white uppercase tracking-widest high-light">{status}</p>
          <div className={`h-[2px] w-12 transition-all ${isActive ? 'bg-red-500' : 'bg-white/20'}`}></div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        {!isActive ? (
          <button 
            onClick={startSession}
            disabled={isConnecting}
            className="px-14 py-6 bg-red-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-[0_20px_50px_rgba(194,12,12,0.4)] hover:scale-110 active:scale-95 transition-all flex items-center gap-5 border-2 border-white/30"
          >
            {isConnecting ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-microphone"></i>}
            <span>开启实时倾诉</span>
          </button>
        ) : (
          <button 
            onClick={stopSession}
            className="px-14 py-6 bg-white text-black border-2 border-white rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center gap-5 shadow-2xl"
          >
            <i className="fa-solid fa-phone-slash"></i>
            <span>断开频率映射</span>
          </button>
        )}
      </div>

      <div className="max-w-xl text-center px-10">
        <p className="text-[12px] font-black text-white leading-relaxed italic high-light">
          “在这里，你可以对我说任何事。关于那些没兑现的承诺，或者深夜里突然涌上的遗憾。我是子夜，我一直在听。”
        </p>
      </div>
    </div>
  );
};

export default LiveSession;
