import React from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, Volume2, Sparkles } from 'lucide-react';

interface ArcReactorProps {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  onToggleMic: () => void;
  statusText: string;
}

export const ArcReactor: React.FC<ArcReactorProps> = ({
  isListening,
  isSpeaking,
  isProcessing,
  onToggleMic,
  statusText,
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center my-4 select-none">
      {/* Outer Glow Halo */}
      <div 
        className={`absolute w-72 h-72 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none ${
          isSpeaking
            ? 'bg-cyan-500/30'
            : isListening
            ? 'bg-sky-400/35'
            : isProcessing
            ? 'bg-amber-400/25'
            : 'bg-cyan-600/15'
        }`}
      />

      {/* Main Interactive Reactor Core */}
      <div className="relative w-56 h-56 flex items-center justify-center">
        {/* Outermost Dashed Tech Ring */}
        <motion.div
          animate={{ rotate: isProcessing ? 360 : isListening ? 180 : 360 }}
          transition={{
            duration: isProcessing ? 4 : isListening ? 8 : 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute inset-0 rounded-full border border-dashed border-cyan-500/30"
        />

        {/* Outer Ring with Cardinal Markers */}
        <div className="absolute inset-2 rounded-full border border-cyan-400/20 flex items-center justify-center">
          <span className="absolute -top-1 w-2 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_#38bdf8]" />
          <span className="absolute -bottom-1 w-2 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_#38bdf8]" />
          <span className="absolute -left-1 h-2 w-1 bg-cyan-400 rounded-full shadow-[0_0_8px_#38bdf8]" />
          <span className="absolute -right-1 h-2 w-1 bg-cyan-400 rounded-full shadow-[0_0_8px_#38bdf8]" />
        </div>

        {/* Counter-rotating segmented ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{
            duration: isProcessing ? 6 : 30,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute inset-6 rounded-full border-2 border-dashed border-cyan-400/40"
        />

        {/* Pulsing Energy Wave when Speaking or Listening */}
        {(isListening || isSpeaking) && (
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.7, 0.2, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute inset-8 rounded-full border ${
              isSpeaking ? 'border-cyan-300' : 'border-sky-400'
            }`}
          />
        )}

        {/* Intermediate Arc Core Housing */}
        <div className="absolute inset-10 rounded-full bg-gradient-to-b from-cyan-950/80 to-gray-950/90 border border-cyan-400/50 shadow-[inset_0_0_20px_rgba(6,182,212,0.3)] backdrop-blur-md flex items-center justify-center" />

        {/* Audio Waveform Bars (When Speaking or Listening) */}
        {isSpeaking ? (
          <div className="absolute z-20 flex items-center justify-center gap-1">
            {[40, 75, 95, 60, 100, 70, 45].map((h, i) => (
              <motion.div
                key={i}
                animate={{ height: [`${h * 0.3}px`, `${h * 0.5}px`, `${h * 0.2}px`] }}
                transition={{
                  duration: 0.5 + (i % 3) * 0.15,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                className="w-1.5 bg-gradient-to-t from-cyan-400 to-white rounded-full shadow-[0_0_8px_#22d3ee]"
              />
            ))}
          </div>
        ) : null}

        {/* Center Push-to-Talk Interactive Arc Trigger Button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onToggleMic}
          aria-label={isListening ? "Stop voice listening" : "Start voice listening"}
          className={`relative z-30 w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-lg ${
            isListening
              ? 'bg-gradient-to-tr from-sky-600 to-cyan-400 shadow-[0_0_30px_#06b6d4] text-white ring-4 ring-cyan-300/40'
              : isSpeaking
              ? 'bg-gradient-to-tr from-cyan-700 to-teal-500 shadow-[0_0_25px_#14b8a6] text-white'
              : isProcessing
              ? 'bg-gradient-to-tr from-amber-600 to-cyan-600 shadow-[0_0_25px_#f59e0b] text-white'
              : 'bg-gradient-to-tr from-gray-900 to-cyan-950/80 border border-cyan-500/50 text-cyan-400 hover:border-cyan-300 hover:text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
          }`}
        >
          {isProcessing ? (
            <Sparkles className="w-8 h-8 animate-spin" />
          ) : isSpeaking ? (
            <Volume2 className="w-8 h-8 animate-pulse" />
          ) : isListening ? (
            <Mic className="w-8 h-8 animate-bounce" />
          ) : (
            <Mic className="w-8 h-8" />
          )}

          <span className="text-[10px] font-mono tracking-widest uppercase mt-1 opacity-90">
            {isProcessing ? "THINKING" : isSpeaking ? "SPEAKING" : isListening ? "LISTENING" : "TAP TO TALK"}
          </span>
        </motion.button>
      </div>

      {/* Futuristic Status Kicker */}
      <div className="mt-3 flex items-center gap-2 text-xs font-mono text-cyan-400/90 tracking-wider">
        <span className={`w-2 h-2 rounded-full ${
          isProcessing ? 'bg-amber-400 animate-ping' : isListening ? 'bg-emerald-400 animate-pulse' : isSpeaking ? 'bg-cyan-400 animate-pulse' : 'bg-cyan-500'
        }`} />
        <span>{statusText || "J.A.R.V.I.S. MARK-VII ONLINE"}</span>
      </div>
    </div>
  );
};
