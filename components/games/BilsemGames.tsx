import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, XCircle, Brain, Grid2X2, Sun, RotateCcw, Trophy, Play, Rocket, Gift, Home, ArrowRight, RefreshCw, Sparkles } from 'lucide-react';
import { playTextToSpeech, stopAudio, playSuccess, playFailure, playClick, playPop } from '../../services/genai';
import { CharacterAttributes } from '../../types';

interface GameProps {
  onBack: () => void;
  character: CharacterAttributes;
}

type GameMode = 'MENU' | 'PATTERN' | 'MEMORY' | 'SHADOW';

const SHAPES = ['🟥', '🔵', '🔺', '⭐', '🔷', '💜', '🍀', '🍄'];
const MEMORY_EMOJIS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];
const LEVELS_TO_WIN = 3;

const PHRASES = {
  win: ["Harikasın! Doğru cevap.", "Süpersin! Aynen böyle devam et.", "Çok zekisin! Bildin.", "Aferin sana! Yıldızı kaptın."],
  loss: ["Hımm, tam olmadı. Tekrar deneyelim!", "Az kaldı! Bir daha bak bakalım.", "Üzülme, yapabilirsin! Pes etmek yok.", "Dikkatli bakarsan bulabilirsin!"],
  bigWin: ["İnanılmaz! Tüm yıldızları topladın ve hazineyi kazandın! Sen gerçek bir şampiyonsun!", "Tebrikler! Hazine sandığı açıldı! Çok büyük bir başarı!", "Muazzam! Gök krallığının en zeki kahramanı sensin!"]
};

// --- Helper Components ---

const GameCard = ({ title, icon: Icon, color, onClick, description }: any) => (
  <button 
    onClick={() => { playClick(); onClick(); }}
    className="group relative w-full md:w-64 h-56 rounded-[2.5rem] bg-white shadow-[0_10px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] hover:-translate-y-2 transition-all duration-300 flex flex-col items-center justify-center gap-2 overflow-hidden border-4 border-white"
  >
    <div className={`absolute inset-0 opacity-10 ${color} group-hover:opacity-20 transition-opacity`}></div>
    
    <div className={`w-20 h-20 rounded-[1.5rem] ${color} text-white flex items-center justify-center shadow-md rotate-3 group-hover:rotate-12 transition-transform duration-300 mb-2`}>
      <Icon size={40} strokeWidth={2.5} />
    </div>
    
    <div className="z-10 text-center px-4">
        <h3 className="text-2xl font-extrabold text-gray-700 font-Fredoka group-hover:text-purple-600 transition-colors">{title}</h3>
        <p className="text-gray-400 text-sm font-bold mt-1 leading-tight">{description}</p>
    </div>
    
    <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
        <Play size={14} fill="currentColor" />
    </div>
  </button>
);

const Confetti = () => (
  <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
    {[...Array(50)].map((_, i) => (
      <div key={i} className="absolute animate-[float_3s_ease-out_infinite]" 
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10%',
            backgroundColor: ['#F87171', '#60A5FA', '#34D399', '#FBBF24', '#F472B6'][Math.floor(Math.random() * 5)],
            width: `${10 + Math.random() * 10}px`,
            height: `${10 + Math.random() * 10}px`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animationDuration: `${2 + Math.random()}s`,
            animationDelay: `${Math.random()}s`
          }}
      />
    ))}
  </div>
);

// --- Treasure Chest Component ---
const TreasureChest = ({ isOpen, onClick }: { isOpen: boolean, onClick: () => void }) => {
    return (
        <div 
            onClick={!isOpen ? onClick : undefined}
            className={`relative w-64 h-64 cursor-pointer transition-transform duration-300 ${!isOpen ? 'hover:scale-105 active:scale-95 animate-bounce' : ''}`}
            style={{ animationDuration: '2s' }}
        >
             <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
                 {/* Glow behind */}
                 <defs>
                     <radialGradient id="glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                         <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.8" />
                         <stop offset="100%" stopColor="#FEF08A" stopOpacity="0" />
                     </radialGradient>
                 </defs>
                 
                 {isOpen && (
                     <circle cx="100" cy="100" r="90" fill="url(#glow)" className="animate-pulse" />
                 )}

                 {/* Bottom Box */}
                 <path d="M 40 100 L 40 160 Q 40 180 60 180 L 140 180 Q 160 180 160 160 L 160 100 Z" fill="#854D0E" stroke="#5D3409" strokeWidth="4" />
                 {/* Gold Trim Bottom */}
                 <path d="M 40 110 L 160 110" stroke="#FACC15" strokeWidth="6" strokeDasharray="10,5" />
                 <rect x="90" y="130" width="20" height="20" rx="4" fill="#333" /> {/* Lock body */}
                 
                 {/* Loot (Only visible if open) */}
                 {isOpen && (
                     <g className="animate-pop-in">
                         <circle cx="80" cy="90" r="10" fill="#FACC15" stroke="#B45309" strokeWidth="2" />
                         <circle cx="120" cy="85" r="12" fill="#FACC15" stroke="#B45309" strokeWidth="2" />
                         <circle cx="100" cy="70" r="15" fill="#60A5FA" stroke="#1D4ED8" strokeWidth="2" /> {/* Gem */}
                         <circle cx="60" cy="100" r="8" fill="#F472B6" stroke="#BE185D" strokeWidth="2" /> {/* Gem */}
                         <path d="M 140 100 L 150 70 L 160 100 Z" fill="#FACC15" />
                     </g>
                 )}

                 {/* Lid */}
                 <g className={`transition-all duration-700 origin-[100px_100px] ${isOpen ? '-rotate-45 -translate-y-10' : ''}`}>
                    <path d="M 30 100 Q 100 40 170 100 L 160 100 L 40 100 Z" fill="#A16207" stroke="#5D3409" strokeWidth="4" />
                    <path d="M 35 95 Q 100 45 165 95" stroke="#FACC15" strokeWidth="6" fill="none" />
                    <rect x="90" y="90" width="20" height="15" rx="2" fill="#FACC15" /> {/* Lock top */}
                 </g>
             </svg>
        </div>
    );
}

// --- Mini Character Companion Component ---
const MiniCharacter = ({ character, reaction }: { character: any, reaction: 'normal' | 'happy' | 'sad' }) => {
    let eyes = character.eyes || 'normal';
    let mouth = character.mouth || 'smile';
    let animationClass = 'animate-breathe';

    if (reaction === 'happy') {
        eyes = 'happy';
        mouth = 'open';
        animationClass = 'animate-bounce';
    } else if (reaction === 'sad') {
        eyes = 'sleepy';
        mouth = 'neutral';
        animationClass = 'animate-wiggle';
    }

    const renderEyes = () => {
        switch(eyes) {
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
                 <g className={reaction === 'normal' ? 'animate-blink origin-center' : ''}>
                   <ellipse cx="35" cy="45" rx="6" ry="8" fill="black" />
                   <ellipse cx="65" cy="45" rx="6" ry="8" fill="black" />
                   <circle cx="37" cy="42" r="2" fill="white" />
                   <circle cx="67" cy="42" r="2" fill="white" />
                </g>
            );
        }
    };

    const renderMouth = () => {
        switch(mouth) {
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

    return (
        <div className={`relative w-28 h-28 md:w-36 md:h-36 ${animationClass}`}>
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg overflow-visible">
                <ellipse cx="50" cy="95" rx="30" ry="5" fill="rgba(0,0,0,0.1)" />
                <circle cx="50" cy="50" r="42" fill={character.color} stroke="white" strokeWidth="4" />
                {renderEyes()}
                {renderMouth()}
                <circle cx="25" cy="55" r="4" fill="rgba(255,255,255,0.3)" />
                <circle cx="75" cy="55" r="4" fill="rgba(255,255,255,0.3)" />
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
    );
};


// --- Main Component ---

const BilsemGames: React.FC<GameProps> = ({ onBack, character }) => {
  const [mode, setMode] = useState<GameMode>('MENU');
  const [score, setScore] = useState(0);
  const [levelProgress, setLevelProgress] = useState(0); // 0 to 3
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [isChestOpen, setIsChestOpen] = useState(false);
  const [showLossModal, setShowLossModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // -- Pattern Game State --
  const [patternSeq, setPatternSeq] = useState<string[]>([]);
  const [patternOptions, setPatternOptions] = useState<string[]>([]);

  // -- Memory Game State --
  const [cards, setCards] = useState<{id: number, content: string, isFlipped: boolean, isMatched: boolean}[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);

  // -- Shadow Game State --
  const [shadowTarget, setShadowTarget] = useState<string>('');
  const [shadowOptions, setShadowOptions] = useState<string[]>([]);

  // Voice Intro
  useEffect(() => {
    playTextToSpeech("Bilmece Adaları'na hoş geldin! Hadi oynamak istediğin oyunu seç.");
    return () => stopAudio(); // Clean up audio on unmount
  }, []);

  const getCharacterReaction = () => {
    if (feedback === 'correct' || isGameFinished) return 'happy';
    if (feedback === 'wrong' || showLossModal) return 'sad';
    return 'normal';
  };

  const playFeedbackSound = (type: 'win' | 'lose' | 'big_win') => {
    stopAudio();
    if (type === 'win') {
        playSuccess(); // SFX
        // Play random winning phrase
        const phrase = PHRASES.win[Math.floor(Math.random() * PHRASES.win.length)];
        playTextToSpeech(phrase);
    }
    if (type === 'lose') {
        playFailure(); // SFX
        // Play random losing (encouraging) phrase
        const phrase = PHRASES.loss[Math.floor(Math.random() * PHRASES.loss.length)];
        playTextToSpeech(phrase);
    }
    if (type === 'big_win') {
        // playSuccess(); // Handled in open chest
        const phrase = PHRASES.bigWin[Math.floor(Math.random() * PHRASES.bigWin.length)];
        playTextToSpeech(phrase);
    }
  };

  const startPatternGame = () => {
    const patternType = Math.random() > 0.5 ? 'ABAB' : 'AAB';
    const s1 = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    let s2 = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    while(s2 === s1) s2 = SHAPES[Math.floor(Math.random() * SHAPES.length)];

    let seq: string[] = [];
    let correct: string = '';

    if (patternType === 'ABAB') {
      seq = [s1, s2, s1];
      correct = s2;
    } else {
       seq = [s1, s1, s2];
       correct = s2;
    }
    setPatternSeq(seq);
    const wrong = SHAPES.find(s => s !== correct && s !== s1) || SHAPES[0];
    setPatternOptions([correct, wrong].sort(() => Math.random() - 0.5));
  };

  const initGameMode = (selectedMode: GameMode) => {
    stopAudio(); // Stop menu audio before starting game audio
    setMode(selectedMode);
    setLevelProgress(0);
    setIsGameFinished(false);
    setIsChestOpen(false);
    setShowLossModal(false);
    setScore(0);
    
    if (selectedMode === 'PATTERN') {
        playTextToSpeech("Yıldız Treni'ne hoş geldin! Şekillere iyi bak. Sırada hangisi olmalı?");
        startPatternGame();
    }
    if (selectedMode === 'MEMORY') {
        playTextToSpeech("Bulut Hafızası! Kartları aklında tut ve eşlerini bul.");
        startMemoryGame();
    }
    if (selectedMode === 'SHADOW') {
        playTextToSpeech("Güneş ve Gölge oyunu! Hangi gölge yukarıdaki şekle ait? Doğrusunu seç.");
        startShadowGame();
    }
  };

  const handlePatternSelect = (selected: string) => {
    let isCorrect = false;
    if (patternSeq[0] === patternSeq[2]) isCorrect = selected === patternSeq[1]; 
    else if (patternSeq[0] === patternSeq[1]) isCorrect = selected === patternSeq[2]; 
    
    if (isCorrect) handleWin();
    else handleLoss();
  };

  const startMemoryGame = () => {
    const pairCount = 4; 
    const gameEmojis = MEMORY_EMOJIS.sort(() => Math.random() - 0.5).slice(0, pairCount);
    const deck = [...gameEmojis, ...gameEmojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, content: emoji, isFlipped: false, isMatched: false }));
    setCards(deck);
    setFlippedIndices([]);
  };

  const handleCardClick = (index: number) => {
    if (flippedIndices.length >= 2 || cards[index].isFlipped || cards[index].isMatched) return;

    playPop(); // SFX

    // Voice cue
    if (flippedIndices.length === 0) {
        // playTextToSpeech("Aklında tut."); // Keeping it simple with just SFX sometimes is better
    }

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);
    
    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      const [idx1, idx2] = newFlipped;
      if (cards[idx1].content === cards[idx2].content) {
        setTimeout(() => {
          setCards(prev => prev.map((c, i) => (i === idx1 || i === idx2) ? { ...c, isMatched: true } : c));
          setFlippedIndices([]);
          playFeedbackSound('win');
        }, 500);
      } else {
        setTimeout(() => {
          playFailure();
          // playTextToSpeech("Eşleşmedi, tekrar dene.");
          setCards(prev => prev.map((c, i) => (i === idx1 || i === idx2) ? { ...c, isFlipped: false } : c));
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  useEffect(() => {
    if (mode === 'MEMORY' && cards.length > 0 && cards.every(c => c.isMatched)) {
       handleWin();
    }
  }, [cards, mode]);

  const startShadowGame = () => {
    const target = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    setShadowTarget(target);
    let opts = [target];
    while(opts.length < 3) {
      const r = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      if (!opts.includes(r)) opts.push(r);
    }
    setShadowOptions(opts.sort(() => Math.random() - 0.5));
  };

  const handleShadowSelect = (selected: string) => {
    if (selected === shadowTarget) handleWin();
    else handleLoss();
  };

  const handleWin = () => {
    const newProgress = levelProgress + 1;
    setLevelProgress(newProgress);
    
    if (newProgress >= LEVELS_TO_WIN) {
        setTimeout(() => {
            setIsGameFinished(true);
            setIsChestOpen(false); 
            playTextToSpeech("Tebrikler! Tüm bilmeceleri çözdün. Hazine sandığı seni bekliyor!");
        }, 500);
    } else {
        setFeedback('correct');
        setScore(s => s + 10);
        setShowConfetti(true);
        playFeedbackSound('win');
        
        setTimeout(() => {
            setFeedback(null);
            setShowConfetti(false);
            if (mode === 'PATTERN') startPatternGame();
            if (mode === 'MEMORY') startMemoryGame(); 
            if (mode === 'SHADOW') startShadowGame();
        }, 2000); // Increased delay to hear voice
    }
  };

  const handleOpenChest = () => {
      if (isChestOpen) return;
      setIsChestOpen(true);
      setShowConfetti(true);
      playSuccess(); // Chime
      
      // Enthusiastic voice
      playFeedbackSound('big_win');
      
      setTimeout(() => {
          quitGame();
      }, 5000); // Longer duration to enjoy victory
  }

  const handleLoss = () => {
    setFeedback('wrong');
    playFeedbackSound('lose');
    setTimeout(() => {
        setFeedback(null);
        setShowLossModal(true);
    }, 1500); // Delay for voice
  };

  const handleRetryLevel = () => {
    playClick();
    setShowLossModal(false);
    playTextToSpeech("Harika, hadi tekrar deneyelim!");
    if (mode === 'PATTERN') startPatternGame();
    if (mode === 'MEMORY') startMemoryGame();
    if (mode === 'SHADOW') startShadowGame();
  };

  const quitGame = () => {
    playClick();
    stopAudio();
    setMode('MENU');
    setFeedback(null);
    setShowConfetti(false);
    setIsGameFinished(false);
    setIsChestOpen(false);
    setShowLossModal(false);
    setLevelProgress(0);
    playTextToSpeech("Bilmece Adaları ana menüsüne döndük. Başka bir oyun seçebilirsin.");
  };

  const renderVictoryScreen = () => (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-200 via-orange-100 to-white animate-pop-in p-6">
        {showConfetti && <Confetti />}
        
        <div className="relative mb-8 transform transition-transform">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-yellow-400 rounded-full blur-[80px] animate-pulse opacity-60"></div>
             
             <TreasureChest isOpen={isChestOpen} onClick={handleOpenChest} />
        </div>
        
        {!isChestOpen ? (
            <div className="text-center animate-bounce">
                <h2 className="text-4xl font-extrabold text-orange-600 mb-2 font-Fredoka">HAZİNE SENİ BEKLİYOR!</h2>
                <p className="text-xl text-gray-500 font-bold bg-white/50 px-6 py-2 rounded-full inline-block">Sandığa Dokun ve Aç</p>
            </div>
        ) : (
            <div className="text-center animate-pop-in">
                 <h2 className="text-5xl font-black text-purple-600 mb-2 font-Fredoka tracking-wide drop-shadow-sm">MUAZZAM!</h2>
                 <p className="text-xl text-purple-400 font-bold">Ödülleri topluyorsun...</p>
            </div>
        )}
    </div>
  );

  const renderLossModal = () => (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-pop-in">
        <div className="relative bg-[#FFF1F2] rounded-[3rem] p-8 w-full max-w-sm border-[6px] border-white shadow-[0_20px_50px_rgba(255,100,100,0.25)] flex flex-col items-center text-center transform rotate-1 transition-all hover:rotate-0">
            <div className="absolute -top-12 animate-bounce" style={{ animationDuration: '2s' }}>
                 <div className="bg-white p-5 rounded-full shadow-lg border-4 border-rose-100 flex items-center justify-center w-24 h-24">
                    <span className="text-5xl filter drop-shadow-sm">🌧️</span> 
                 </div>
            </div>
            
            <div className="mt-14 mb-6">
                 <h3 className="text-3xl font-black text-rose-500 mb-2 font-Fredoka tracking-wide drop-shadow-sm">AH, OLMADI!</h3>
                 <p className="text-rose-400/80 font-bold text-lg leading-tight">Ama pes etmek yok!<br/>Tekrar deneyelim mi?</p>
            </div>
            
            <div className="flex flex-col gap-3 w-full mt-2">
                <button 
                    onClick={handleRetryLevel}
                    className="group relative w-full bg-gradient-to-b from-rose-400 to-rose-500 text-white py-4 rounded-2xl font-black text-xl shadow-[0_6px_0_#be123c] active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-3 border-2 border-white/20"
                >
                    <div className="bg-white/20 p-2 rounded-full group-hover:rotate-180 transition-transform duration-700">
                        <RefreshCw size={24} strokeWidth={3} />
                    </div>
                    TEKRAR DENE
                </button>
                
                <button 
                    onClick={quitGame}
                    className="text-rose-300 font-bold hover:text-rose-400 py-3 transition-colors text-sm flex items-center justify-center gap-2 hover:bg-rose-50 rounded-xl mt-2"
                >
                    <Home size={16} />
                    Başka Oyun Seç
                </button>
            </div>

            <div className="absolute top-6 left-6 text-rose-200 animate-pulse"><XCircle size={20} className="rotate-12"/></div>
            <div className="absolute bottom-6 right-6 text-rose-200 animate-pulse delay-700"><XCircle size={16} className="-rotate-12"/></div>
        </div>
    </div>
  );

  const renderProgressBar = () => (
    <div className="w-full max-w-md flex justify-center gap-4 mb-6">
        {[...Array(LEVELS_TO_WIN)].map((_, i) => (
            <div key={i} className={`w-12 h-12 flex items-center justify-center transition-all duration-500 ${i < levelProgress ? 'scale-110' : 'scale-100'}`}>
                <Star 
                    size={i < levelProgress ? 40 : 32} 
                    className={`transition-all duration-500 ${i < levelProgress ? 'text-yellow-400 fill-yellow-400 drop-shadow-md animate-[pop-in_0.5s]' : 'text-gray-200 fill-gray-100'}`} 
                />
            </div>
        ))}
    </div>
  );

  const renderPatternGame = () => (
    <div className="flex flex-col items-center w-full max-w-4xl p-4">
      {renderProgressBar()}
      <h2 className="text-3xl font-extrabold text-purple-600 mb-8 animate-pop-in text-center font-Fredoka">Sıradaki Şekil Hangisi?</h2>
      
      <div className="flex gap-4 mb-16 bg-white p-6 rounded-[2rem] shadow-xl border-4 border-purple-100 flex-wrap justify-center">
        {patternSeq.map((shape, i) => (
          <div key={i} className="w-20 h-20 bg-purple-50 rounded-2xl border-2 border-purple-200 flex items-center justify-center text-5xl animate-pop-in" style={{animationDelay: `${i*0.1}s`}}>
            {shape}
          </div>
        ))}
        <div className="w-20 h-20 bg-purple-100 rounded-2xl border-4 border-dashed border-purple-300 flex items-center justify-center animate-pulse">
          <span className="text-4xl font-bold text-purple-400">?</span>
        </div>
      </div>

      <div className="flex gap-8">
        {patternOptions.map((opt, i) => (
          <button 
            key={i} 
            onClick={() => handlePatternSelect(opt)}
            className="w-32 h-32 bg-white rounded-3xl btn-3d border-b-8 border-gray-200 hover:border-purple-200 hover:bg-purple-50 flex items-center justify-center text-6xl transition-all"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  const renderMemoryGame = () => (
    <div className="flex flex-col items-center w-full max-w-4xl p-2">
       {renderProgressBar()}
       <div className="flex justify-between w-full mb-6 items-center px-4">
        <h2 className="text-2xl font-extrabold text-blue-600 animate-pop-in font-Fredoka">Eşlerini Bul</h2>
        <button onClick={() => { playClick(); startMemoryGame(); }} className="p-3 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200"><RotateCcw size={20}/></button>
       </div>
       
       <div className="grid grid-cols-4 gap-3 w-full max-w-md">
         {cards.map((card, i) => (
           <button
            key={i}
            onClick={() => handleCardClick(i)}
            disabled={card.isFlipped || card.isMatched}
            className={`aspect-square rounded-2xl transition-all duration-500 transform preserve-3d relative ${card.isFlipped || card.isMatched ? 'rotate-y-180' : ''}`}
            style={{ perspective: '1000px', transformStyle: 'preserve-3d', transform: (card.isFlipped || card.isMatched) ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
           >
             <div className="absolute inset-0 w-full h-full bg-[#60A5FA] rounded-2xl border-b-4 border-blue-700 shadow-sm flex items-center justify-center backface-hidden" style={{ backfaceVisibility: 'hidden' }}>
               <Star className="text-white w-8 h-8" fill="white" />
             </div>
             <div className="absolute inset-0 w-full h-full bg-white rounded-2xl border-b-4 border-gray-200 shadow-sm flex items-center justify-center text-4xl backface-hidden" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
               {card.isMatched ? '✨' : card.content}
             </div>
           </button>
         ))}
       </div>
    </div>
  );

  const renderShadowGame = () => (
    <div className="flex flex-col items-center w-full max-w-4xl p-4">
      {renderProgressBar()}
      <h2 className="text-3xl font-extrabold text-orange-600 mb-8 animate-pop-in text-center font-Fredoka">Gölgesini Bul</h2>
      
      <div className="mb-12 p-10 bg-white rounded-[3rem] shadow-xl animate-float border-4 border-orange-100">
        <div className="text-9xl filter brightness-0 opacity-80 blur-[2px] transform scale-105">
           {shadowTarget}
        </div>
      </div>

      <div className="flex gap-6 flex-wrap justify-center">
        {shadowOptions.map((opt, i) => (
          <button 
            key={i} 
            onClick={() => handleShadowSelect(opt)}
            className="w-28 h-28 bg-white rounded-3xl btn-3d border-b-8 border-gray-200 hover:border-orange-200 hover:bg-orange-50 flex items-center justify-center text-6xl transition-all"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative h-full w-full flex flex-col pt-16 pb-4 md:p-6 animate-pop-in">
      {(showConfetti && !isGameFinished) && <Confetti />}

      {/* Score Header */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-yellow-400 px-4 py-2 rounded-full shadow-md z-20">
           <Trophy className="text-yellow-900" size={18} />
           <span className="text-xl font-black text-yellow-900 font-Fredoka">{score}</span>
      </div>

      {/* --- CHARACTER COMPANION --- */}
      <div className="absolute bottom-4 left-4 z-40 hidden md:block">
        <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-2 border-2 border-white shadow-lg relative">
             <div className="absolute -top-12 -right-8 bg-white px-4 py-2 rounded-xl rounded-bl-none shadow-md text-sm font-bold animate-bounce text-gray-600 border border-gray-100" style={{display: feedback ? 'block' : 'none'}}>
                {feedback === 'correct' ? 'Yaşasın!' : 'Tekrar dene!'}
             </div>
            <MiniCharacter character={character} reaction={getCharacterReaction()} />
        </div>
      </div>
      <div className="absolute bottom-2 left-2 z-40 md:hidden scale-75 origin-bottom-left pointer-events-none">
          <MiniCharacter character={character} reaction={getCharacterReaction()} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center w-full">
        {isGameFinished && renderVictoryScreen()}
        {showLossModal && renderLossModal()}

        {!isGameFinished && mode === 'MENU' && (
          <div className="flex flex-col items-center">
             <div className="text-center mb-10">
                 <h2 className="text-4xl font-extrabold text-purple-600 mb-2 font-Fredoka flex items-center gap-2 justify-center">
                     <Rocket className="text-purple-400 fill-purple-200 animate-bounce" size={40} />
                     Bilmece Adaları
                 </h2>
                 <p className="text-gray-400 font-bold">Zekanı Göster!</p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-4">
                <GameCard title="Yıldız Treni" description="Örüntüyü tamamla" icon={Brain} color="bg-purple-400" onClick={() => initGameMode('PATTERN')} />
                <GameCard title="Bulut Hafızası" description="Kartları eşleştir" icon={Grid2X2} color="bg-blue-400" onClick={() => initGameMode('MEMORY')} />
                <GameCard title="Güneş & Gölge" description="Gölgeyi bul" icon={Sun} color="bg-orange-400" onClick={() => initGameMode('SHADOW')} />
            </div>
          </div>
        )}

        {!isGameFinished && !showLossModal && mode === 'PATTERN' && renderPatternGame()}
        {!isGameFinished && !showLossModal && mode === 'MEMORY' && renderMemoryGame()}
        {!isGameFinished && !showLossModal && mode === 'SHADOW' && renderShadowGame()}
      </div>

      {feedback === 'correct' && !isGameFinished && !showLossModal && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
             <div className="transform scale-0 animate-pop-in relative">
                <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-60 animate-pulse rounded-full"></div>
                <div className="relative bg-gradient-to-br from-[#FCD34D] to-[#F59E0B] p-10 rounded-[3rem] border-8 border-white shadow-[0_20px_60px_rgba(245,158,11,0.4)] flex flex-col items-center gap-4 min-w-[300px] rotate-[-2deg]">
                   <div className="bg-white p-4 rounded-full shadow-lg animate-bounce">
                      <Star size={80} className="text-yellow-500 fill-yellow-400" strokeWidth={2.5} />
                   </div>
                   <div className="flex flex-col items-center">
                     <span className="text-5xl font-black font-Fredoka text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.1)] tracking-wide">MÜKEMMEL!</span>
                     <span className="text-white/80 font-bold text-lg">Doğru Cevap</span>
                   </div>
                </div>
             </div>
        </div>
      )}

      {feedback === 'wrong' && (
         <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
             <div className="transform scale-0 animate-pop-in p-8 rounded-[3rem] bg-white border-8 border-red-400 text-red-500 shadow-2xl flex flex-col items-center gap-2 min-w-[250px]">
               <XCircle size={80} fill="currentColor" className="text-white drop-shadow-md" />
             </div>
         </div>
      )}
    </div>
  );
};

export default BilsemGames;