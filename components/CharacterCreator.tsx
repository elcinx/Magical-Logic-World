import React, { useState, useEffect } from 'react';
import { CharacterAttributes } from '../types';
import { Check, Smile, Eye, Palette, Crown, Castle } from 'lucide-react';
import { playTextToSpeech, stopAudio, playClick, playPop, playSuccess } from '../services/genai';

interface Props {
  character: CharacterAttributes;
  onChange: (char: CharacterAttributes) => void;
  onComplete: () => void;
}

const COLORS = ['#F87171', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F472B6'];
const ACCESSORIES = ['none', 'hat', 'glasses', 'crown', 'bow'];
const EYES = ['normal', 'happy', 'wink', 'sleepy'];
const MOUTHS = ['smile', 'open', 'tongue', 'neutral'];

const CharacterCreator: React.FC<Props> = ({ character, onChange, onComplete }) => {
  const char = character as any; 
  
  useEffect(() => {
    playTextToSpeech("Burası Kahraman Kulesi! Hadi, kendine harika bir karakter tasarla.");
    return () => stopAudio();
  }, []);

  const updateChar = (key: string, val: string) => {
    playClick(); // SFX
    onChange({ ...character, [key]: val } as any);
    
    // Richer Voice Feedback
    if (key === 'color') {
        const phrases = ["Harika bir renk!", "Bu renk sana çok yakıştı.", "Pırıl pırıl görünüyor!"];
        playTextToSpeech(phrases[Math.floor(Math.random() * phrases.length)]);
    }
    
    if (key === 'accessory') {
        if (val === 'crown') playTextToSpeech("Vay canına! Tıpkı bir kral veya kraliçe gibisin!");
        else if (val === 'hat') playTextToSpeech("Bu şapka seni çok gizemli yaptı!");
        else if (val === 'glasses') playTextToSpeech("Gözlükler çok havalı durdu!");
        else if (val === 'bow') playTextToSpeech("Papyon çok sevimli!");
        else if (val === 'none') playTextToSpeech("Sade ve şık!");
    }

    if (key === 'eyes') {
         if (val === 'happy') playTextToSpeech("Ne kadar mutlu bakıyorsun!");
         else if (val === 'sleepy') playTextToSpeech("Uykun mu geldi?");
         else playTextToSpeech("Gözlerin ışıl ışıl!");
    }
    
    if (key === 'mouth') playTextToSpeech("Karakterin canlanıyor!");
  };

  const handleTabChange = (tab: 'color' | 'eyes' | 'mouth' | 'acc') => {
      playPop(); // SFX
      setActiveTab(tab);
      if (tab === 'color') playTextToSpeech("Hadi rengini değiştirelim.");
      if (tab === 'eyes') playTextToSpeech("Gözleri nasıl baksın?");
      if (tab === 'mouth') playTextToSpeech("Nasıl gülümsesin?");
      if (tab === 'acc') playTextToSpeech("Ona bir aksesuar takalım mı?");
  };

  const handleComplete = () => {
    stopAudio(); // Stop any pending speech
    playSuccess(); // Chime SFX
    
    // Enthusiastic completion message
    playTextToSpeech("Vay canına! Çok havalı oldun. Şimdi bu kahramanla maceraya atılalım!");
    
    // Delay slightly to let the sound start
    setTimeout(() => {
        onComplete();
    }, 2000);
  };

  const [activeTab, setActiveTab] = useState<'color' | 'eyes' | 'mouth' | 'acc'>('color');

  const renderEyes = () => {
    const type = char.eyes || 'normal';
    switch(type) {
        case 'happy': return (
            <g>
                <path d="M 30 45 Q 35 40 40 45" stroke="black" strokeWidth="4" fill="none" strokeLinecap="round" />
                <path d="M 60 45 Q 65 40 70 45" stroke="black" strokeWidth="4" fill="none" strokeLinecap="round" />
            </g>
        );
        case 'wink': return (
            <g>
                <circle cx="35" cy="45" r="6" fill="black" />
                <path d="M 60 45 Q 65 40 70 45" stroke="black" strokeWidth="4" fill="none" strokeLinecap="round" />
            </g>
        );
        case 'sleepy': return (
             <g>
                <line x1="30" y1="45" x2="40" y2="45" stroke="black" strokeWidth="4" strokeLinecap="round" />
                <line x1="60" y1="45" x2="70" y2="45" stroke="black" strokeWidth="4" strokeLinecap="round" />
            </g>
        );
        default: return (
             <g className="animate-blink origin-center">
               <ellipse cx="35" cy="45" rx="6" ry="8" fill="black" />
               <ellipse cx="65" cy="45" rx="6" ry="8" fill="black" />
               <circle cx="37" cy="42" r="2" fill="white" />
               <circle cx="67" cy="42" r="2" fill="white" />
            </g>
        );
    }
  };

  const renderMouth = () => {
      const type = char.mouth || 'smile';
      switch(type) {
          case 'open': return <circle cx="50" cy="70" r="12" fill="#333" />;
          case 'tongue': return (
              <g>
                <path d="M 35 68 Q 50 78 65 68" stroke="black" strokeWidth="4" fill="none" strokeLinecap="round" />
                <path d="M 45 72 Q 50 85 55 72" fill="#F472B6" stroke="#F472B6" strokeWidth="1" />
              </g>
          );
          case 'neutral': return <line x1="40" y1="72" x2="60" y2="72" stroke="black" strokeWidth="4" strokeLinecap="round" />;
          default: return <path d="M 35 65 Q 50 80 65 65" stroke="black" strokeWidth="4" fill="none" strokeLinecap="round" />;
      }
  };

  const TabButton = ({ id, icon: Icon, label }: any) => (
      <button 
        onClick={() => handleTabChange(id)}
        className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl transition-all btn-3d border-b-4
            ${activeTab === id 
                ? 'bg-indigo-100 text-indigo-600 border-indigo-200' 
                : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'}`}
      >
          <Icon size={28} />
          <span className="text-xs font-extrabold">{label}</span>
      </button>
  );

  return (
    <div className="flex flex-col items-center h-full p-4 animate-pop-in w-full max-w-2xl mx-auto pt-12">
      
      <div className="text-center mb-6">
          <h2 className="text-3xl font-extrabold text-orange-500 font-Fredoka flex items-center gap-3 justify-center">
             <Castle className="text-orange-400 fill-orange-200" size={32} />
             Kahraman Kulesi
          </h2>
          <p className="text-gray-400 font-bold text-sm">Gök Gezgini'ni Tasarla</p>
      </div>
      
      {/* Character Stage */}
      <div className="relative mb-10 w-full flex justify-center">
        {/* Stage Lighting Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-100 rounded-full blur-3xl opacity-60"></div>
        
        <div className="relative w-64 h-64">
           {/* Animated SVG Character */}
           <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl animate-breathe origin-bottom overflow-visible">
            {/* Body Shadow */}
            <ellipse cx="50" cy="95" rx="30" ry="5" fill="rgba(0,0,0,0.1)" />

            {/* Body */}
            <circle cx="50" cy="50" r="42" fill={character.color} stroke="white" strokeWidth="4" className="transition-colors duration-500" />
            
            {/* Face Features */}
            {renderEyes()}
            {renderMouth()}
            
            {/* Cheeks */}
            <circle cx="25" cy="55" r="4" fill="rgba(255,255,255,0.3)" />
            <circle cx="75" cy="55" r="4" fill="rgba(255,255,255,0.3)" />

            {/* Accessories */}
            {character.accessory === 'hat' && (
               <path d="M 20 25 L 50 -5 L 80 25 Z" fill="#EF4444" stroke="white" strokeWidth="3" className="animate-wiggle origin-bottom" />
            )}
            {character.accessory === 'glasses' && (
              <g className="animate-float" style={{animationDuration: '4s'}}>
                <circle cx="35" cy="45" r="14" stroke="#333" strokeWidth="3" fill="rgba(255,255,255,0.3)"/>
                <circle cx="65" cy="45" r="14" stroke="#333" strokeWidth="3" fill="rgba(255,255,255,0.3)"/>
                <line x1="49" y1="45" x2="51" y2="45" stroke="#333" strokeWidth="3" />
              </g>
            )}
            {character.accessory === 'crown' && (
               <path d="M 25 25 L 25 10 L 40 20 L 50 0 L 60 20 L 75 10 L 75 25 Z" fill="#FBBF24" stroke="white" strokeWidth="2" className="animate-float" />
            )}
            {character.accessory === 'bow' && (
               <path d="M 30 85 L 50 90 L 70 85 L 50 95 Z" fill="#EC4899" stroke="white" strokeWidth="2" className="animate-wiggle" />
            )}
          </svg>
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-full bg-white rounded-[2.5rem] shadow-xl p-6 flex flex-col gap-6 border-4 border-orange-50">
        
        {/* Tabs */}
        <div className="flex justify-between gap-2 p-1 bg-gray-50 rounded-3xl">
             <TabButton id="color" icon={Palette} label="Renk" />
             <TabButton id="eyes" icon={Eye} label="Göz" />
             <TabButton id="mouth" icon={Smile} label="Ağız" />
             <TabButton id="acc" icon={Crown} label="Süs" />
        </div>

        {/* Options Grid */}
        <div className="flex gap-4 justify-center flex-wrap min-h-[80px] items-center py-2">
            {activeTab === 'color' && COLORS.map(c => (
                <button 
                  key={c} 
                  onClick={() => updateChar('color', c)}
                  className={`w-14 h-14 rounded-full border-4 shadow-sm transition-transform ${character.color === c ? 'border-indigo-600 scale-110' : 'border-white hover:scale-105'}`}
                  style={{backgroundColor: c}}
                />
            ))}

            {activeTab !== 'color' && (
                 <div className="grid grid-cols-4 gap-3 w-full">
                    {(activeTab === 'eyes' ? EYES : activeTab === 'mouth' ? MOUTHS : ACCESSORIES).map((item) => (
                        <button 
                            key={item} 
                            onClick={() => updateChar(activeTab === 'eyes' ? 'eyes' : activeTab === 'mouth' ? 'mouth' : 'accessory', item)} 
                            className={`
                                p-3 rounded-2xl font-bold capitalize text-sm btn-3d border-b-4
                                ${char[activeTab === 'accessory' ? 'accessory' : activeTab] === item 
                                    ? 'bg-orange-500 text-white border-orange-700' 
                                    : 'bg-orange-50 text-orange-400 border-orange-100 hover:bg-orange-100'}
                            `}
                        >
                            {item === 'none' ? 'Yok' : item}
                        </button>
                    ))}
                 </div>
            )}
        </div>
      </div>

      <button 
        onClick={handleComplete}
        className="mt-8 bg-[#34D399] text-white text-2xl font-extrabold py-4 px-16 rounded-full shadow-[0_6px_0_#059669] border-4 border-white hover:brightness-110 active:shadow-none active:translate-y-1 transition-all flex items-center gap-3 animate-pulse"
      >
        <Check strokeWidth={4} />
        HAZIRIM!
      </button>
    </div>
  );
};

export default CharacterCreator;