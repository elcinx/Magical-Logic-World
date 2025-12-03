import React, { useState, useEffect } from 'react';
import { AppScreen, CharacterAttributes } from './types';
import CharacterCreator from './components/CharacterCreator';
import BilsemGames from './components/games/BilsemGames';
import MagicCanvas from './components/MagicCanvas';
import { Palette, Rocket, Play, Sparkles, CloudSun, X, Castle, Star, Volume2, VolumeX } from 'lucide-react';
import { playTextToSpeech, audioManager, stopAudio, playClick, toggleMute, playPageTurn, playSuccess, preloadCommonPhrases } from './services/genai';

const DEFAULT_CHARACTER: CharacterAttributes = {
  color: '#F472B6', // Pink default
  accessory: 'none',
  name: 'Gök Gezgini'
};

// --- Map Island Component ---
const MapIsland = ({ 
    title, 
    subtitle,
    icon: Icon, 
    color, 
    onClick, 
    position,
    delay,
    decoration
  }: any) => (
    <div className={`relative flex items-center justify-center w-full mb-24 ${position === 'left' ? 'flex-row' : 'flex-row-reverse'} animate-pop-in ${delay}`}>
      
      {/* Text Label Bubble */}
      <div className={`absolute ${position === 'left' ? 'left-[140px] md:left-[200px] text-left' : 'right-[140px] md:right-[200px] text-right'} w-64 z-20 pointer-events-none`}>
        <div className="bg-white/90 backdrop-blur-md px-5 py-4 rounded-3xl shadow-xl border-4 border-white transform transition hover:scale-105 inline-block">
            <h3 className={`text-2xl font-black ${color.replace('bg-', 'text-').replace('-400', '-600').replace('-500', '-600')} font-Fredoka leading-none mb-1`}>{title}</h3>
            <p className="text-gray-400 text-base font-bold leading-none">{subtitle}</p>
        </div>
      </div>

      {/* The Big Button (Island) */}
      <div className="relative group z-10">
          {/* Decoration behind */}
          <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/30 rounded-full blur-2xl group-hover:bg-white/50 transition-all animate-pulse"></div>
          
          {/* Cute bouncing decoration (mushroom, flower) */}
          {decoration && (
              <div className={`absolute -top-6 ${position === 'left' ? '-right-6' : '-left-6'} text-5xl animate-wiggle z-20 pointer-events-none drop-shadow-lg`}>
                  {decoration}
              </div>
          )}

          <button 
            onClick={() => { playPageTurn(); stopAudio(); onClick(); }}
            className={`
                relative w-36 h-36 md:w-52 md:h-52 
                ${color} border-[6px] border-white 
                shadow-[0_12px_0_rgba(0,0,0,0.15)] active:shadow-none active:translate-y-4 
                transition-all duration-200 flex items-center justify-center
                group-hover:scale-105 group-hover:rotate-2
                rounded-[2.5rem] md:rounded-[3.5rem]
                overflow-hidden
            `}
            style={{
                borderRadius: position === 'left' ? '40% 60% 70% 30% / 40% 50% 60% 50%' : '60% 40% 30% 70% / 50% 60% 40% 50%' 
            }}
          >
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_4px,_transparent_5px)] bg-[length:24px_24px]"></div>

            {/* Shine/Glare */}
            <div className="absolute top-4 left-6 w-8 h-4 bg-white/40 rounded-full rotate-[-15deg]"></div>
            <div className="absolute bottom-6 right-8 w-4 h-4 bg-black/5 rounded-full"></div>

            <Icon size={60} strokeWidth={2.5} className="text-white drop-shadow-xl transform group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300 relative z-10" />
            
            {/* Sparkles */}
            <div className="absolute top-6 right-8 text-white opacity-80 animate-pulse"><Star size={16} fill="currentColor" /></div>
            <div className="absolute bottom-8 left-8 text-white opacity-60 animate-bounce"><Star size={12} fill="currentColor" /></div>
          </button>
      </div>
    </div>
  );

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.WELCOME);
  const [character, setCharacter] = useState<CharacterAttributes>(DEFAULT_CHARACTER);
  const [isMuted, setIsMuted] = useState(false);

  // Initialize and Preload
  useEffect(() => {
     preloadCommonPhrases();
  }, []);

  // Handle Voice Navigation
  useEffect(() => {
    // Welcome Screen Voice (Try to play, might be blocked by browser policy until interaction)
    if (screen === AppScreen.WELCOME) {
         playSuccess(); // Chime sound
         playTextToSpeech("Hoş geldin! Hadi, maceraya başlayalım!");
    }
    
    // Home Screen Voice
    if (screen === AppScreen.HOME) {
        // Small delay to ensure transition is seen
        setTimeout(() => {
            playTextToSpeech("İşte buradayız! Nereye gidelim? Kahraman kulesi, Bilmece adaları, veya resim atölyesi?");
        }, 1000);
    }
  }, [screen]);

  const handleStart = async () => {
    // Critical: Unlock AudioContext on user interaction
    playClick();
    stopAudio();
    await audioManager.resumeContext();
    
    playSuccess(); // Chime sound for positive feedback
    playTextToSpeech("Harika! Kapılar açılıyor, maceramız başlıyor!");
    
    // Delay slightly to let the voice start before switching
    setScreen(AppScreen.HOME);
  };

  const handleToggleMute = () => {
      const muted = toggleMute();
      setIsMuted(muted);
  };

  const renderWelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center h-full w-full relative z-20 px-4 text-center pb-20">
        
        {/* Floating Logo/Icon Container */}
        <div className="relative mb-8 animate-float">
           {/* Glow Effect */}
           <div className="absolute inset-0 bg-white/40 blur-3xl rounded-full scale-150 animate-pulse"></div>
           
           {/* Icon Box */}
           <div className="w-48 h-48 bg-white rounded-[3rem] flex items-center justify-center shadow-[0_20px_50px_rgba(255,255,255,0.4)] border-8 border-sky-200 rotate-3 z-10 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-sky-50 to-white"></div>
               <Rocket size={80} className="text-sky-500 animate-bounce relative z-10" strokeWidth={2} />
               <CloudSun className="absolute top-4 left-4 text-sky-100 w-12 h-12" />
           </div>
           
           {/* Decorative elements outside */}
           <div className="absolute -top-6 -right-6 text-yellow-400 animate-spin-slow">
               <Star size={48} fill="currentColor" />
           </div>
        </div>

        {/* Slogan */}
        <div className="bg-white/20 backdrop-blur-md px-8 py-3 rounded-full mb-16 animate-pop-in delay-100 border-2 border-white/40 shadow-lg transform rotate-[-1deg] mt-8">
            <p className="text-xl md:text-2xl text-white font-extrabold flex items-center gap-2">
                <Sparkles size={24} className="text-yellow-300" />
                Sihirli Gökyüzü Krallığına Hoş Geldin!
                <Sparkles size={24} className="text-yellow-300" />
            </p>
        </div>

        {/* Login / Start Button */}
        <button
            onClick={handleStart}
            className="group relative bg-[#F472B6] hover:bg-[#ec4899] text-white text-3xl font-extrabold py-6 px-16 rounded-[2.5rem] border-b-[8px] border-[#be185d] shadow-[0_20px_40px_rgba(244,114,182,0.4)] active:border-b-0 active:translate-y-2 active:shadow-none transition-all duration-200 animate-pop-in delay-200"
        >
            <span className="flex items-center gap-4 drop-shadow-md">
                MACERAYA BAŞLA 
                <div className="bg-white/20 rounded-full p-1 group-hover:translate-x-2 transition-transform">
                    <Play fill="currentColor" size={32} />
                </div>
            </span>
            
            {/* Button Decorations */}
            <Star className="absolute top-4 left-6 text-pink-200 w-5 h-5 animate-pulse" fill="currentColor" />
            <Star className="absolute bottom-4 right-8 text-pink-200 w-4 h-4" fill="currentColor" />
        </button>
        
        <p className="mt-8 text-white/60 font-bold text-sm animate-fade-in delay-300">5-6 Yaş İçin Eğitici Oyunlar</p>
    </div>
  );

  const renderHomeScreen = () => (
    <div className="relative w-full h-full flex flex-col overflow-y-auto overflow-x-hidden no-scrollbar animate-fade-in">
      
      {/* Map Content */}
      <div className="relative flex-1 max-w-3xl mx-auto w-full pt-16 pb-48 px-4 flex flex-col items-center">
        
        {/* Title Badge */}
        <div className="mb-20 animate-float z-20">
             <div className="bg-sky-400 text-white px-10 py-5 rounded-[2.5rem] font-extrabold text-3xl shadow-[0_10px_0_#0284c7] border-[6px] border-white rotate-[-2deg] flex items-center gap-3 transform hover:scale-105 transition-transform">
                <CloudSun size={40} className="text-yellow-300 fill-yellow-300" />
                Sihirli Gökyüzü Krallığı
             </div>
        </div>

        {/* Winding Path (Dashed Stitch Line) */}
        <svg className="absolute top-32 left-1/2 -translate-x-1/2 h-[800px] w-full max-w-[500px] z-0 opacity-40 pointer-events-none" viewBox="0 0 100 800" preserveAspectRatio="none">
             <path 
                d="M 50 0 Q 50 100 80 150 T 50 300 Q 20 400 50 500 T 80 700" 
                stroke="white" 
                strokeWidth="8" 
                fill="none" 
                strokeDasharray="20,20" 
                strokeLinecap="round"
            />
        </svg>

        <MapIsland 
            title="Kahraman Kulesi" 
            subtitle="Maceraya Hazırlan!"
            icon={Castle} 
            color="bg-orange-400" 
            position="right"
            delay="delay-0"
            decoration="🏰"
            onClick={() => setScreen(AppScreen.CHARACTER)} 
        />

        <MapIsland 
            title="Bilmece Adaları" 
            subtitle="Zekanı Kullan"
            icon={Rocket} 
            color="bg-purple-500" 
            position="left"
            delay="delay-100"
            decoration="🧩"
            onClick={() => setScreen(AppScreen.GAMES)} 
        />

        <MapIsland 
            title="Gökkuşağı Atölyesi" 
            subtitle="Rüyalarını Boya"
            icon={Palette} 
            color="bg-pink-400" 
            position="right"
            delay="delay-200"
            decoration="🎨"
            onClick={() => setScreen(AppScreen.ART)} 
        />

      </div>

      {/* Foreground Decorations */}
      <div className="fixed bottom-0 left-0 w-full h-0 pointer-events-none z-0">
          <div className="absolute bottom-0 w-full h-32 bg-white/20 backdrop-blur-sm rounded-t-[100%] translate-y-16 blur-2xl"></div>
      </div>

    </div>
  );

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#7DD3FC] font-Fredoka">
      
      {/* Dynamic Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#38bdf8] via-[#7dd3fc] to-[#bae6fd]"></div>
      <div className="absolute inset-0 bg-polka"></div>

      {/* Floating Clouds */}
      <div className="absolute top-10 -left-10 opacity-70 animate-float-delayed">
        <div className="w-32 h-12 bg-white rounded-full opacity-80 blur-sm"></div>
      </div>
      <div className="absolute top-40 -right-20 opacity-50 animate-float" style={{animationDuration: '12s'}}>
         <div className="w-48 h-16 bg-white rounded-full opacity-80 blur-sm"></div>
      </div>
       <div className="absolute bottom-20 left-10 opacity-60 animate-float" style={{animationDuration: '10s'}}>
         <div className="w-24 h-10 bg-white rounded-full opacity-80 blur-sm"></div>
      </div>

      {/* Mute Toggle Button (Global) */}
      <div className="absolute top-4 right-4 z-50">
          <button 
             onClick={handleToggleMute}
             className="bg-white/50 backdrop-blur text-sky-800 p-3 rounded-full hover:bg-white transition-all shadow-md"
          >
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
      </div>

      {/* Main Content Container */}
      <main className="relative z-10 w-full h-full flex flex-col transition-all duration-500">
        
        {screen === AppScreen.WELCOME ? (
            renderWelcomeScreen()
        ) : screen === AppScreen.HOME ? (
            renderHomeScreen()
        ) : (
            <div className="fixed inset-0 z-50 flex flex-col bg-sky-100/30 backdrop-blur-md animate-pop-in">
                 
                 {/* Universal Back Button */}
                 <div className="absolute top-4 left-4 z-50">
                    <button 
                        onClick={() => { playPageTurn(); stopAudio(); setScreen(AppScreen.HOME); }}
                        className="bg-white text-red-500 p-3 rounded-full shadow-[0_4px_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-1 border-2 border-red-100 hover:bg-red-50 transition-all group"
                    >
                        <X size={28} strokeWidth={3} className="group-hover:rotate-90 transition-transform"/>
                    </button>
                 </div>

                 {/* Content Wrapper */}
                 <div className="flex-1 w-full h-full overflow-hidden bg-white/80 md:m-4 md:rounded-[3rem] shadow-2xl relative border-4 border-white/60">
                     <div className={`h-full w-full ${screen === AppScreen.ART ? 'overflow-hidden' : 'overflow-y-auto no-scrollbar'}`}>
                         {screen === AppScreen.CHARACTER && <CharacterCreator character={character} onChange={(newChar) => setCharacter({...character, ...newChar})} onComplete={() => { stopAudio(); setScreen(AppScreen.HOME); }} />}
                         {screen === AppScreen.GAMES && <BilsemGames onBack={() => { stopAudio(); setScreen(AppScreen.HOME); }} character={character} />}
                         {screen === AppScreen.ART && <MagicCanvas />}
                     </div>
                 </div>
            </div>
        )}
      </main>

    </div>
  );
};

export default App;