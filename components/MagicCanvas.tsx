import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Brush, Trash2, Download, Pencil, Lightbulb } from 'lucide-react';
import { playTextToSpeech, stopAudio, playClick, playPop } from '../services/genai';

const MagicCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(8);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [isDrawing, setIsDrawing] = useState(false);

  // Renk Paleti
  const COLORS = ['#000000', '#EF4444', '#F97316', '#FACC15', '#22C55E', '#3B82F6', '#A855F7', '#EC4899'];

  const MOTIVATION_PHRASES = [
      "Belki kocaman, gülümseyen bir güneş çizebilirsin?",
      "Denizde yüzen mutlu bir balık çizmeye ne dersin?",
      "En sevdiğin oyuncağın resmini yapabilir misin?",
      "Uzaya giden bir roket çizmek ister misin?",
      "Bahçedeki renkli çiçekleri hayal et ve çiz!",
      "Belki sevimli bir kedi veya köpek çizebilirsin.",
      "Gökkuşağının tüm renklerini kullanarak bir resim yap!",
      "Kendi hayalindeki evi çizmeye ne dersin?"
  ];

  const getColorName = (c: string) => {
      switch(c) {
          case '#000000': return "Siyah";
          case '#EF4444': return "Kırmızı, elma gibi!";
          case '#F97316': return "Turuncu";
          case '#FACC15': return "Sarı, güneş gibi!";
          case '#22C55E': return "Yeşil";
          case '#3B82F6': return "Mavi, gökyüzü gibi!";
          case '#A855F7': return "Mor";
          case '#EC4899': return "Pembe";
          default: return "Güzel bir renk!";
      }
  }

  // Voice Intro
  useEffect(() => {
    playTextToSpeech("Gökkuşağı Atölyesi'ne hoş geldin! Fırçanı al ve hayallerini çizmeye başla.");
    return () => stopAudio(); // Clean up audio on unmount
  }, []);

  // Tuvali Hazırla ve Boyutlandır
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      
      if (container && canvas) {
        // Mevcut içeriği yedekle
        const ctx = canvas.getContext('2d');
        let savedData: ImageData | null = null;
        if (canvas.width > 0 && canvas.height > 0 && ctx) {
            try {
                savedData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            } catch(e) { /* ignore */ }
        }

        // Yeni boyutları ayarla
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;

        // Ayarları ve arka planı geri yükle
        if (ctx) {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // Beyaz arka plan (silgi için gerekli)
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            if (savedData) {
                ctx.putImageData(savedData, 0, 0);
            }
        }
      }
    };

    // İlk yüklemede çalıştır (biraz gecikmeli ki layout otursun)
    const timer = setTimeout(handleResize, 50);
    window.addEventListener('resize', handleResize);
    
    return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(timer);
    };
  }, []);

  // --- POINTER EVENTS (MOUSE & TOUCH) ---

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId); // İmleci yakala (dışarı çıksa bile çiz)
    setIsDrawing(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    lastPos.current = { x, y };

    // Tıklandığı yere nokta koy
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.beginPath();
        ctx.fillStyle = tool === 'eraser' ? 'white' : color;
        const radius = (tool === 'eraser' ? lineWidth * 3 : lineWidth) / 2;
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPos.current || !canvasRef.current) return;
    
    // Mouse ile çiziyorsa ve sol tık basılı değilse durdur
    if (e.pointerType === 'mouse' && e.buttons !== 1) {
        setIsDrawing(false);
        return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(x, y);
    
    ctx.strokeStyle = tool === 'eraser' ? 'white' : color;
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 3 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPos.current = { x, y };
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(false);
    lastPos.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // --- ARAÇLAR ---

  const clearCanvas = () => {
    playClick();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        playTextToSpeech("Sayfa tertemiz oldu! Yeniden başlayabilirsin.");
    }
  };

  const saveImage = () => {
    playClick();
    const canvas = canvasRef.current;
    if (canvas) {
        const link = document.createElement('a');
        link.download = `resmim-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
        playTextToSpeech("Resmin kaydedildi! Harika bir iş çıkardın.");
    }
  };

  const handleColorSelect = (c: string) => {
      playPop();
      setColor(c);
      setTool('brush');
      playTextToSpeech(getColorName(c));
  };
  
  const handleGiveIdea = () => {
      playPop();
      const idea = MOTIVATION_PHRASES[Math.floor(Math.random() * MOTIVATION_PHRASES.length)];
      playTextToSpeech(idea);
  }

  return (
    <div className="flex flex-col h-full w-full bg-gray-100 relative select-none">
      
      {/* Üst Başlık */}
      <div className="absolute top-4 left-0 w-full flex justify-center pointer-events-none z-20">
        <div className="bg-white/90 backdrop-blur px-6 py-2 rounded-full shadow-md border border-gray-200">
            <h2 className="text-xl font-bold font-Fredoka text-gray-700 flex items-center gap-2">
                <Pencil size={20} className="text-orange-500"/>
                Gökkuşağı Atölyesi
            </h2>
        </div>
      </div>

      {/* Tuval Alanı */}
      <div ref={containerRef} className="flex-1 w-full h-full relative bg-white touch-none">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 block touch-none cursor-crosshair"
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          style={{ touchAction: 'none' }} // Mobilde kaydırmayı engeller
        />
      </div>

      {/* Alt Araç Çubuğu */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200 p-3 flex flex-col md:flex-row gap-4 items-center justify-between z-30 animate-pop-in">
          
          {/* Renkler */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar w-full md:w-auto p-1">
              {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => handleColorSelect(c)}
                    className={`w-10 h-10 rounded-full border-2 transition-transform flex-shrink-0 ${color === c && tool === 'brush' ? 'scale-125 border-gray-800 shadow-md' : 'border-gray-100 hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
              ))}
          </div>

          <div className="w-px h-8 bg-gray-200 hidden md:block"></div>

          {/* Araçlar */}
          <div className="flex gap-3">
              <button 
                onClick={() => { playClick(); setTool('brush'); playTextToSpeech("Fırçanı aldın, haydi boyayalım!"); }}
                className={`p-3 rounded-xl transition-all ${tool === 'brush' ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
              >
                  <Brush size={24} strokeWidth={tool === 'brush' ? 3 : 2} />
              </button>

              <button 
                onClick={() => { playClick(); setTool('eraser'); playTextToSpeech("Silgi seçildi. Hataları yok edelim."); }}
                className={`p-3 rounded-xl transition-all ${tool === 'eraser' ? 'bg-blue-100 text-blue-600' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
              >
                  <Eraser size={24} strokeWidth={tool === 'eraser' ? 3 : 2}/>
              </button>

              <div className="w-px h-8 bg-gray-200 mx-1"></div>

               {/* Idea Generator */}
              <button 
                onClick={handleGiveIdea} 
                className="p-3 rounded-xl bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-all shadow-sm group relative"
              >
                  <Lightbulb size={24} className="group-hover:scale-110 transition-transform"/>
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Fikir Ver</span>
              </button>

              <button onClick={clearCanvas} className="p-3 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition-all">
                  <Trash2 size={24} />
              </button>
              
              <button onClick={saveImage} className="p-3 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-all shadow-md">
                  <Download size={24} />
              </button>
          </div>
      </div>
    </div>
  );
};

export default MagicCanvas;