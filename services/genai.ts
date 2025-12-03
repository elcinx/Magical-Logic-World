import { GoogleGenAI, Modality } from "@google/genai";
import { base64ToUint8Array, decodeAudioData } from "./audioUtils";

const API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- Audio Manager Singleton ---
class AudioManager {
    private static instance: AudioManager;
    private audioContext: AudioContext | null = null;
    
    // Separate tracks for different audio types
    private voiceSource: AudioBufferSourceNode | null = null;
    private masterGain: GainNode | null = null;

    private isMuted: boolean = false;

    private constructor() {}

    static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    getAudioContext(): AudioContext {
        if (!this.audioContext) {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            this.masterGain = ctx.createGain();
            this.masterGain.connect(ctx.destination);
            this.audioContext = ctx;
        }
        return this.audioContext;
    }

    async resumeContext() {
        const ctx = this.getAudioContext();
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }
    }

    toggleMute(): boolean {
        this.isMuted = !this.isMuted;
        const ctx = this.getAudioContext();
        if (this.masterGain) {
            // Smooth mute transition
            const now = ctx.currentTime;
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 1, now, 0.1);
        }
        return this.isMuted;
    }

    // --- Voice / TTS Handling ---

    stopCurrentAudio() {
        if (this.voiceSource) {
            try {
                this.voiceSource.stop();
            } catch (e) { /* ignore */ }
            this.voiceSource = null;
        }
    }

    playVoiceBuffer(buffer: AudioBuffer) {
        this.stopCurrentAudio(); // Stop previous voice
        const ctx = this.getAudioContext();
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        
        // Create a separate gain for voice
        const voiceGain = ctx.createGain();
        voiceGain.gain.value = 1.0; 

        source.connect(voiceGain);
        if (this.masterGain) voiceGain.connect(this.masterGain);
        else voiceGain.connect(ctx.destination);
        
        source.onended = () => {
            if (this.voiceSource === source) {
                this.voiceSource = null;
            }
        };

        source.start();
        this.voiceSource = source;
    }

    // --- SFX ---
    
    private playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0, volume: number = 0.1) {
        const ctx = this.getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

        gain.gain.setValueAtTime(volume, ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

        osc.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);

        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
    }

    playClick() {
        // Wood block click
        this.playTone(800, 'sine', 0.1, 0, 0.1);
    }

    playPop() {
        const ctx = this.getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const now = ctx.currentTime;
        
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.15);
    }

    playSuccess() {
        // Magical chime
        this.playTone(523.25, 'sine', 0.3, 0, 0.1);
        this.playTone(659.25, 'sine', 0.3, 0.1, 0.1);
        this.playTone(783.99, 'sine', 0.4, 0.2, 0.1);
        this.playTone(1046.50, 'sine', 0.8, 0.3, 0.1);
    }

    playFailure() {
        const ctx = this.getAudioContext();
        const now = ctx.currentTime;
        
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(300, now);
        osc1.frequency.linearRampToValueAtTime(200, now + 0.4);
        gain1.gain.setValueAtTime(0.1, now);
        gain1.gain.linearRampToValueAtTime(0, now + 0.4);
        
        osc1.connect(gain1);
        if (this.masterGain) gain1.connect(this.masterGain);
        
        osc1.start(now);
        osc1.stop(now + 0.4);
    }

    playPageTurn() {
        // Soft white noise whoosh
        const ctx = this.getAudioContext();
        const bufferSize = ctx.sampleRate * 0.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(1000, ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

        noise.connect(filter);
        filter.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);

        noise.start();
    }
}

export const audioManager = AudioManager.getInstance();

export const stopAudio = () => {
    audioManager.stopCurrentAudio();
};

export const playClick = () => audioManager.playClick();
export const playPop = () => audioManager.playPop();
export const playSuccess = () => audioManager.playSuccess();
export const playFailure = () => audioManager.playFailure();
export const playPageTurn = () => audioManager.playPageTurn();

// Removed Background Music Implementation
export const startBGM = () => { /* No-op */ };
export const stopBGM = () => { /* No-op */ };
export const toggleMute = () => audioManager.toggleMute();


// --- Optimized TTS with Caching and Debounce ---

// Cache for storing generated audio buffers to avoid re-fetching
const ttsCache = new Map<string, AudioBuffer>();

// Track the latest request ID to cancel outdated requests
let activeTTSRequestId = 0;

export const preloadCommonPhrases = () => {
    const commonPhrases = [
        "Hoş geldin! Hadi, maceraya başlayalım!",
        "İşte buradayız! Nereye gidelim? Kahraman kulesi, Bilmece adaları, veya resim atölyesi?",
        "Burası Kahraman Kulesi! Hadi, kendine harika bir karakter tasarla.",
        "Bilmece Adaları'na hoş geldin! Hadi oynamak istediğin oyunu seç.",
        "Gökkuşağı Atölyesi'ne hoş geldin! Fırçanı al ve hayallerini çizmeye başla."
    ];
    commonPhrases.forEach(text => {
        if (!ttsCache.has(text)) {
            // Fire and forget fetch to warm up cache
            fetchTTS(text, -1); 
        }
    });
};

const fetchTTS = async (text: string, requestId: number) => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }, 
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) return;

        const audioBuffer = await decodeAudioData(
            base64ToUint8Array(base64Audio),
            audioManager.getAudioContext(),
            24000,
            1
        );

        ttsCache.set(text, audioBuffer);
        return audioBuffer;
    } catch (e) {
        console.error("Preload error", e);
    }
}

export const playTextToSpeech = async (text: string) => {
  if (!API_KEY) {
    console.error("No API Key");
    return;
  }

  // IMMEDIATELY stop any currently playing voice to reduce perceived latency/confusion
  audioManager.stopCurrentAudio();

  // Generate a new ID for this request
  const requestId = ++activeTTSRequestId;

  try {
    // Ensure context is running if possible
    await audioManager.resumeContext();

    // Check Cache First (Instant Play)
    if (ttsCache.has(text)) {
        audioManager.playVoiceBuffer(ttsCache.get(text)!);
        return;
    }

    // Fetch
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, 
          },
        },
      },
    });

    // Request Cancellation Check:
    // If another request started while we were fetching, ignore this one.
    if (requestId !== activeTTSRequestId) {
        return; 
    }

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");

    const audioBuffer = await decodeAudioData(
      base64ToUint8Array(base64Audio),
      audioManager.getAudioContext(),
      24000,
      1
    );

    // Save to cache
    ttsCache.set(text, audioBuffer);

    // Double check request ID before playing
    if (requestId === activeTTSRequestId) {
        audioManager.playVoiceBuffer(audioBuffer);
    }
    
  } catch (error) {
    console.error("TTS Error:", error);
  }
};

// Image Generation/Editing Service
export const editImage = async (base64Image: string, prompt: string): Promise<string | null> => {
  if (!API_KEY) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: prompt,
          },
          {
            inlineData: {
              data: base64Image,
              mimeType: 'image/png',
            },
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Edit Error:", error);
    return null;
  }
};