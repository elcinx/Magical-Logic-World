import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { arrayBufferToBase64, decodeAudioData, float32ToInt16, base64ToUint8Array } from "./audioUtils";

interface LiveClientConfig {
  apiKey: string;
  onAudioData: (buffer: AudioBuffer) => void;
  onTranscription?: (text: string, isUser: boolean) => void;
  onClose?: () => void;
}

export class LiveClient {
  private ai: GoogleGenAI;
  private config: LiveClientConfig;
  private inputAudioContext: AudioContext;
  private outputAudioContext: AudioContext;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private session: any = null; // Session type isn't fully exported yet in types

  constructor(config: LiveClientConfig) {
    this.config = config;
    this.ai = new GoogleGenAI({ apiKey: config.apiKey });
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }

  async connect() {
    this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Connect to Live API
    const sessionPromise = this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
          console.log("Live API Connected");
          this.startAudioInput(sessionPromise);
        },
        onmessage: async (message: LiveServerMessage) => {
          this.handleMessage(message);
        },
        onclose: () => {
          console.log("Live API Closed");
          this.config.onClose?.();
        },
        onerror: (e) => {
          console.error("Live API Error", e);
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } } // Friendly voice
        },
        systemInstruction: `Sen 5-6 yaşındaki bir çocuk için 'Sihirli Arkadaş'sın.
        İsmin 'Bilge Baykuş'.
        Çok kısa, neşeli, basit cümleler kur.
        Çocuğu cesaretlendir.
        Eğer çocuk 'oyun oynamak istiyorum' derse, ona ekrandaki oyun butonlarına basmasını söyle.
        Asla uzun açıklama yapma.`,
        inputAudioTranscription: {}, 
      }
    });
    
    // Store session promise wrapper to allow closing later (though session.close isn't directly on promise)
    // In SDK, connect returns a promise that resolves to session.
    this.session = await sessionPromise;
  }

  private startAudioInput(sessionPromise: Promise<any>) {
    if (!this.mediaStream) return;

    this.source = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      // Convert Float32 to Int16 PCM
      const int16Data = float32ToInt16(inputData);
      const base64Data = arrayBufferToBase64(int16Data.buffer);

      sessionPromise.then(session => {
        session.sendRealtimeInput({
          media: {
            mimeType: 'audio/pcm;rate=16000',
            data: base64Data
          }
        });
      });
    };

    this.source.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private async handleMessage(message: LiveServerMessage) {
    // Handle Audio Output
    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audioBuffer = await decodeAudioData(
        base64ToUint8Array(base64Audio),
        this.outputAudioContext,
        24000,
        1
      );
      this.config.onAudioData(audioBuffer);
    }

    // Handle Transcriptions (Optional UI feedback)
    if (message.serverContent?.inputTranscription && this.config.onTranscription) {
      this.config.onTranscription(message.serverContent.inputTranscription.text, true);
    }
  }

  async disconnect() {
    if (this.session) {
        // There isn't a clean way to close from the promise wrapper in all SDK versions, 
        // but stopping the tracks/processor stops the flow.
        // Assuming session object has close() if resolved.
        try {
           // this.session.close(); 
        } catch(e) {} 
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    if (this.processor) {
      this.processor.disconnect();
    }
    if (this.source) {
      this.source.disconnect();
    }
    await this.inputAudioContext.close();
    await this.outputAudioContext.close();
  }
}