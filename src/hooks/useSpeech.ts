import { useState, useEffect, useRef, useCallback } from 'react';
import { playJarvisSound } from '../utils/audioEffects';

interface UseSpeechProps {
  onCommandRecognized: (command: string) => void;
  language?: string;
}

export function useSpeech({ onCommandRecognized, language = 'hi-IN' }: UseSpeechProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [continuousMode, setContinuousMode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(language);

  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef(false);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = continuousMode;
    recognition.interimResults = true;
    recognition.lang = selectedLanguage;

    recognition.onstart = () => {
      setIsListening(true);
      playJarvisSound('ping');
    };

    recognition.onresult = (event: any) => {
      // Don't listen to self while Jarvis speaks
      if (isSpeakingRef.current) return;

      let currentInterim = '';
      let finalSpeech = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        if (item.isFinal) {
          finalSpeech += item[0].transcript;
        } else {
          currentInterim += item[0].transcript;
        }
      }

      setTranscript(finalSpeech || currentInterim);

      if (finalSpeech.trim()) {
        const cleanCommand = finalSpeech.trim();
        onCommandRecognized(cleanCommand);
        setTranscript('');
        if (!continuousMode) {
          recognition.stop();
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        console.warn('Speech recognition status:', event.error);
      }
      if (!continuousMode) {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (continuousMode && !isSpeakingRef.current) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {}
    };
  }, [continuousMode, selectedLanguage, onCommandRecognized]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      recognitionRef.current.lang = selectedLanguage;
      recognitionRef.current.start();
    } catch (e) {
      // already active
    }
  }, [selectedLanguage]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
      setIsListening(false);
    } catch {}
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Jarvis Text to Speech
  const speakText = useCallback((text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    // Clean text of technical tokens or URLs for natural speech
    const cleanSpeech = text
      .replace(/https?:\/\/\S+/g, 'link')
      .replace(/[*_#`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanSpeech) return;

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    
    // Pick the best voice available
    const voices = window.speechSynthesis.getVoices();
    let preferredVoice = voices.find((v) => 
      v.lang.includes('hi') || v.lang.includes('en-IN') || v.name.includes('Google') || v.name.includes('Natural')
    ) || voices.find((v) => v.lang.startsWith('en')) || voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 1.05;
    utterance.pitch = 0.95; // slightly deeper butler cadence

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
      // If continuous mode was on, resume listening after speaking finishes
      if (continuousMode && recognitionRef.current) {
        setTimeout(() => {
          try {
            recognitionRef.current.start();
          } catch {}
        }, 300);
      }
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [continuousMode]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isListening,
    isSpeaking,
    transcript,
    speechSupported,
    continuousMode,
    setContinuousMode,
    selectedLanguage,
    setSelectedLanguage,
    startListening,
    stopListening,
    toggleListening,
    speakText,
    stopSpeaking,
  };
}
