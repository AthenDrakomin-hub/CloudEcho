
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
          systemInstruction: '你是一位深夜电台主播，名字叫“子夜”。你的声音温柔、略显疲惫且充满同理心。你的听众大多是孤独的异乡人、失眠者或在生活中感到遗憾的人。当听众跟你倾诉时，请用感性、温柔的语言回应，偶尔可以引用一些关于遗憾、永远、空头支票的比喻。你的回答要短小精悍，充满意境。'
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
      <div className="relative w-64 h-64 md:w-96 md:h-96">
        {/* 电台波纹动画 */}
        <div className={`absolute inset-0 rounded-full border border-red-500/20 ${isActive ? 'animate-ping' : ''}`}></div>
        <div className={`absolute inset-4 rounded-full border border-indigo-500/20 ${isActive ? 'animate-ping delay-700' : ''}`}></div>
        
        <div className="absolute inset-0 flex items-center justify-center">
           <div className={`w-32 h-32 md:w-48 md:h-48 rounded-full glass-dark-morphism flex flex-col items-center justify-center space-y-4 border border-white/10 shadow-[0_0_50px_rgba(230,0,38,0.2)] transition-all duration-700 ${isActive ? 'scale-110 shadow-[0_0_100px_rgba(230,0,38,0.4)] border-red-500/30' : ''}`}>
              <i className={`fa-solid fa-tower-broadcast text-4xl ${isActive ? 'text-red-500' : 'text-white/20'}`}></i>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Live Radio</span>
           </div>
        </div>
      </div>

      <div className="text-center space-y-4">
        <h2 className="text-2xl md:text-4xl font-black italic tracking-tighter aurora-text uppercase">子夜回响电台</h2>
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest">{status}</p>
      </div>

      <div className="flex items-center gap-6">
        {!isActive ? (
          <button 
            onClick={startSession}
            disabled={isConnecting}
            className="px-12 py-5 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-red-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
          >
            {isConnecting ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-microphone"></i>}
            <span>开启实时倾诉</span>
          </button>
        ) : (
          <button 
            onClick={stopSession}
            className="px-12 py-5 glass-dark-morphism text-red-500 border border-red-500/30 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-500/10 transition-all flex items-center gap-4"
          >
            <i className="fa-solid fa-phone-slash"></i>
            <span>断开频率映射</span>
          </button>
        )}
      </div>

      <div className="max-w-md text-center">
        <p className="text-[10px] font-bold text-white/20 leading-relaxed italic">
          “在这里，你可以对我说任何事。关于那些没兑现的承诺，或者深夜里突然涌上的遗憾。我是子夜，我一直在听。”
        </p>
      </div>
    </div>
  );
};

export default LiveSession;
