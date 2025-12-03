import React, { useEffect, useRef, useState } from 'react';
import { LiveClient } from '../services/liveClient';
import { Mic, MicOff, Volume2, Trees, Mountain } from 'lucide-react';

const VoiceBuddy: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isTalking, setIsTalking] = useState(false); // Model is talking
  const liveClient = useRef<LiveClient | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const nextStartTime = useRef<number>(0);
  const sources = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    // Initialize Live Client
    if (!process.env.API_KEY) return;

    audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});

    liveClient.current = new LiveClient({
      apiKey: process.env.API_KEY,
      onAudioData: (buffer) => {
        playAudioBuffer(buffer);
      },
      onTranscription: (text, isUser) => {
        console.log(isUser ? "User:" : "Model:", text);
      },
      onClose: () => setIsConnected(false)
    });

    return () => {
      handleDisconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playAudioBuffer = (buffer: AudioBuffer) => {
    if (!audioContext.current) return;

    const ctx = audioContext.current;
    const now = ctx.currentTime;
    if (nextStartTime.current < now) {
      nextStartTime.current = now;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    source.onended = () => {
      sources.current.delete(source);
      if (sources.current.size === 0) setIsTalking(false);
    };

    source.start(nextStartTime.current);
    nextStartTime.current += buffer.duration;
    
    sources.current.add(source);
    setIsTalking(true);
  };

  const handleConnect = async () => {
    if (liveClient.current) {
      await liveClient.current.connect();
      setIsConnected(true);
    }
  };

  const handleDisconnect = async () => {
    if (liveClient.current) {
      await liveClient.current.disconnect();
    }
    sources.current.forEach(s => s.stop());
    sources.current.clear();
    setIsConnected(false);
    setIsTalking(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 animate-fade-in relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute inset-0 bg-emerald-900/10 pointer-events-none"></div>
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-green-200 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-brown-200 rounded-full blur-3xl opacity-30"></div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="bg-white/80 backdrop-blur-md px-6 py-2 rounded-full mb-8 shadow-sm border border-emerald-100 flex items-center gap-2">
            <Mountain className="text-emerald-600"/>
            <span className="font-Fredoka text-emerald-800 font-bold">Bilgelik Tepesi</span>
        </div>

        <div className="relative mb-12 group">
            {/* Animated Avatar Container */}
            <div className={`w-72 h-72 rounded-full bg-gradient-to-b from-amber-800 to-amber-950 border-8 border-amber-900 shadow-2xl flex items-center justify-center transition-all duration-300 relative overflow-hidden ${isTalking ? 'scale-105' : ''}`}>
                {/* Tree Hollow Texture */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-20"></div>
                
                {/* The Owl */}
                <div className={`text-9xl transform transition-transform duration-200 ${isTalking ? 'animate-bounce' : 'animate-breathe'}`}>
                    🦉
                </div>

                {/* Eyes Glowing effect when connected */}
                {isConnected && (
                    <div className="absolute top-1/3 w-full flex justify-center gap-8">
                        <div className="w-4 h-4 bg-yellow-400 rounded-full blur-md animate-pulse"></div>
                        <div className="w-4 h-4 bg-yellow-400 rounded-full blur-md animate-pulse"></div>
                    </div>
                )}
            </div>
            
            {/* Connection Status Badge */}
            <div className={`absolute -bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-white text-sm font-bold shadow-lg transition-colors ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}>
                {isConnected ? "Bağlı" : "Uyuyor"}
            </div>
        </div>

        <h2 className="text-4xl font-extrabold text-emerald-900 mb-4 font-Fredoka drop-shadow-sm text-center">
             Bilge Baykuş
        </h2>
        <p className="text-xl text-emerald-700/80 mb-12 text-center max-w-md font-medium leading-relaxed">
            {isConnected 
                ? "Seni dinliyorum küçük dostum! Bana orman hakkında bir şey sor." 
                : "Konuşmak için mikrofon düğmesine bas."}
        </p>

        <button
            onClick={isConnected ? handleDisconnect : handleConnect}
            className={`w-28 h-28 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.2)] border-8 border-white transition-all transform hover:scale-105 active:scale-95 ${
            isConnected 
                ? 'bg-red-500 text-white hover:bg-red-600 rotate-0' 
                : 'bg-emerald-500 text-white hover:bg-emerald-600 rotate-0 hover:rotate-12'
            }`}
        >
            {isConnected ? <MicOff size={48} /> : <Mic size={48} />}
        </button>
        
        {isTalking && (
            <div className="mt-8 flex items-center gap-2 text-emerald-700 font-bold bg-white/90 px-6 py-3 rounded-full shadow-lg animate-bounce border border-emerald-100">
            <Volume2 size={24} /> Konuşuyor...
            </div>
        )}
      </div>
    </div>
  );
};

export default VoiceBuddy;