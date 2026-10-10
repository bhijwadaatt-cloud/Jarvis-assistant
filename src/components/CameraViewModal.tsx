import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, RefreshCw, Zap, Circle } from 'lucide-react';
import { playJarvisSound } from '../utils/audioEffects';

interface CameraViewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CameraViewModal: React.FC<CameraViewModalProps> = ({ isOpen, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }
      setCapturedPhoto(null);
      return;
    }

    let activeStream: MediaStream | null = null;
    async function startCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false,
        });
        activeStream = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (e) {
        console.warn('Camera stream error:', e);
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen, facingMode]);

  if (!isOpen) return null;

  const toggleFacing = () => {
    playJarvisSound('click');
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const takeSnapshot = () => {
    playJarvisSound('execute');
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      setCapturedPhoto(canvas.toDataURL('image/jpeg'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-gray-950 border border-cyan-500/50 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Top HUD Bar */}
        <div className="absolute top-0 inset-x-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-mono text-cyan-300 tracking-widest">
              HUD OPTICAL SCANNER: {facingMode.toUpperCase()}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close camera"
            className="p-1.5 bg-black/50 text-gray-300 hover:text-white rounded-full border border-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Viewport with HUD Targeting Overlay */}
        <div className="relative aspect-[3/4] bg-black flex items-center justify-center overflow-hidden">
          {capturedPhoto ? (
            <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {/* Holographic targeting reticle */}
          <div className="absolute inset-12 border border-cyan-500/30 rounded-2xl pointer-events-none flex items-center justify-center">
            <div className="w-16 h-16 border-2 border-dashed border-cyan-400/60 rounded-full animate-spin" style={{ animationDuration: '20s' }} />
            <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_#38bdf8]" />
            <div className="absolute top-2 left-2 text-[9px] font-mono text-cyan-400">TRK: 98.4%</div>
            <div className="absolute bottom-2 right-2 text-[9px] font-mono text-cyan-400">OPT_RES: 1080P</div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="p-4 bg-gray-900 border-t border-gray-800 flex items-center justify-around">
          <button
            onClick={toggleFacing}
            aria-label="Flip camera"
            className="p-3 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-2xl transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {capturedPhoto ? (
            <button
              onClick={() => setCapturedPhoto(null)}
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-gray-950 text-xs font-bold rounded-2xl"
            >
              Retake Optical Scan
            </button>
          ) : (
            <button
              onClick={takeSnapshot}
              aria-label="Capture snapshot"
              className="w-14 h-14 rounded-full border-4 border-cyan-400/60 bg-white/20 hover:bg-white/40 flex items-center justify-center transition-transform active:scale-90"
            >
              <div className="w-10 h-10 rounded-full bg-cyan-400 shadow-[0_0_12px_#38bdf8]" />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-3 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-2xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
