import React from 'react';
import { 
  Zap, 
  Battery, 
  BatteryCharging, 
  Eye, 
  Volume2, 
  Vibrate, 
  Mic, 
  Sliders, 
  ExternalLink,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { DeviceTelemetry } from '../types';
import { setDeviceTorch, toggleScreenWakeLock, triggerHaptic, launchAndroidApp } from '../utils/androidBridge';
import { playJarvisSound } from '../utils/audioEffects';

interface DeviceSettingsPanelProps {
  telemetry: DeviceTelemetry;
  setTelemetry: React.Dispatch<React.SetStateAction<DeviceTelemetry>>;
  continuousMode: boolean;
  setContinuousMode: (val: boolean) => void;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  onOpenCompanionGuide: () => void;
  onOpenLiveCamera: () => void;
}

export const DeviceSettingsPanel: React.FC<DeviceSettingsPanelProps> = ({
  telemetry,
  setTelemetry,
  continuousMode,
  setContinuousMode,
  selectedLanguage,
  setSelectedLanguage,
  onOpenCompanionGuide,
  onOpenLiveCamera,
}) => {
  const handleToggleTorch = async () => {
    playJarvisSound('click');
    const newState = !telemetry.torchActive;
    const ok = await setDeviceTorch(newState);
    setTelemetry((prev) => ({ ...prev, torchActive: ok }));
  };

  const handleToggleWakeLock = async () => {
    playJarvisSound('click');
    const newState = !telemetry.wakeLockActive;
    const ok = await toggleScreenWakeLock(newState);
    setTelemetry((prev) => ({ ...prev, wakeLockActive: ok }));
  };

  const handleTestHaptic = () => {
    playJarvisSound('execute');
    triggerHaptic([150, 100, 250]);
  };

  const quickApps = [
    { name: 'youtube', label: 'YouTube' },
    { name: 'whatsapp', label: 'WhatsApp' },
    { name: 'camera', label: 'Camera HUD', action: onOpenLiveCamera },
    { name: 'spotify', label: 'Spotify' },
    { name: 'maps', label: 'Google Maps' },
    { name: 'calculator', label: 'Calculator' },
    { name: 'settings', label: 'Phone Settings' },
    { name: 'chrome', label: 'Chrome' },
    { name: 'clock', label: 'Clock & Alarm' },
  ];

  return (
    <div className="space-y-5">
      {/* Telemetry & Quick Toggles */}
      <div>
        <h2 className="text-base font-semibold text-white tracking-wide">Hardware & Device Settings</h2>
        <p className="text-xs text-gray-400 font-mono mt-0.5">
          Real-time Android hardware sensor controls and voice triggers.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
          {/* Torch / Flashlight */}
          <button
            onClick={handleToggleTorch}
            className={`p-3 rounded-xl border text-left transition-all ${
              telemetry.torchActive
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-gray-900/60 border-gray-800 text-gray-300 hover:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <Zap className={`w-5 h-5 ${telemetry.torchActive ? 'text-amber-400 fill-amber-400' : 'text-gray-400'}`} />
              <span className="text-[10px] font-mono uppercase">{telemetry.torchActive ? 'ON' : 'OFF'}</span>
            </div>
            <div className="mt-2 text-xs font-semibold text-white">Flashlight</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Hardware Torch</div>
          </button>

          {/* Wake Lock */}
          <button
            onClick={handleToggleWakeLock}
            className={`p-3 rounded-xl border text-left transition-all ${
              telemetry.wakeLockActive
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-gray-900/60 border-gray-800 text-gray-300 hover:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <Eye className={`w-5 h-5 ${telemetry.wakeLockActive ? 'text-cyan-400' : 'text-gray-400'}`} />
              <span className="text-[10px] font-mono uppercase">{telemetry.wakeLockActive ? 'ACTIVE' : 'IDLE'}</span>
            </div>
            <div className="mt-2 text-xs font-semibold text-white">Always On</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Screen WakeLock</div>
          </button>

          {/* Battery Status */}
          <div className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl text-left">
            <div className="flex items-center justify-between">
              {telemetry.isCharging ? (
                <BatteryCharging className="w-5 h-5 text-emerald-400" />
              ) : (
                <Battery className="w-5 h-5 text-cyan-400" />
              )}
              <span className="text-[10px] font-mono text-cyan-400">
                {telemetry.batteryLevel !== null ? `${telemetry.batteryLevel}%` : '85%'}
              </span>
            </div>
            <div className="mt-2 text-xs font-semibold text-white">Phone Battery</div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              {telemetry.isCharging ? 'Charging Active' : 'Discharging'}
            </div>
          </div>

          {/* Haptic Vibrate */}
          <button
            onClick={handleTestHaptic}
            className="p-3 bg-gray-900/60 border border-gray-800 hover:border-gray-700 rounded-xl text-left transition-all"
          >
            <div className="flex items-center justify-between">
              <Vibrate className="w-5 h-5 text-purple-400" />
              <span className="text-[10px] font-mono text-purple-400">TEST</span>
            </div>
            <div className="mt-2 text-xs font-semibold text-white">Vibration</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Haptic Pulse</div>
          </button>
        </div>
      </div>

      {/* Voice & AI Configuration */}
      <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-2xl space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>Jarvis Voice & Recognition Config</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-mono text-gray-300 mb-1">Primary Voice Language</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="hi-IN">Hindi (India - हिंदी / Hinglish)</option>
              <option value="en-IN">English (India)</option>
              <option value="en-US">English (United States)</option>
            </select>
          </div>

          <div>
            <label className="block font-mono text-gray-300 mb-1">Hands-Free Continuous Mode</label>
            <button
              onClick={() => {
                playJarvisSound('click');
                setContinuousMode(!continuousMode);
              }}
              className={`w-full px-3 py-2 rounded-xl border flex items-center justify-between transition-colors ${
                continuousMode
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-medium'
                  : 'bg-gray-950 border-gray-800 text-gray-400'
              }`}
            >
              <span>{continuousMode ? 'Always Listening Active' : 'Push-to-Talk (Default)'}</span>
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick App Launcher Grid */}
      <div>
        <h3 className="text-sm font-semibold text-white tracking-wide mb-2 flex items-center justify-between">
          <span>Quick App Launcher</span>
          <span className="text-[11px] text-gray-400 font-mono">Say "Open [App]"</span>
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {quickApps.map((a) => (
            <button
              key={a.name}
              onClick={() => {
                playJarvisSound('click');
                if (a.action) {
                  a.action();
                } else {
                  launchAndroidApp(a.name);
                }
              }}
              className="p-2.5 bg-gray-900/60 border border-gray-800/80 hover:border-cyan-500/40 rounded-xl text-center transition-all flex flex-col items-center justify-center gap-1"
            >
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-medium text-gray-200">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Android System Automation Bridge Banner */}
      <div className="p-4 bg-gradient-to-r from-cyan-950/40 to-blue-950/30 border border-cyan-500/30 rounded-2xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Android Deep OS Control Companion</span>
          </div>
          <p className="text-xs text-gray-300 mt-1 max-w-md">
            For 100% full phone control (auto-locking screen, Bluetooth/WiFi toggles, auto-answering calls), view the MacroDroid / Tasker integration setup.
          </p>
        </div>
        <button
          onClick={onOpenCompanionGuide}
          className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 text-xs font-bold rounded-xl flex items-center gap-1 shrink-0 ml-3 shadow-md shadow-cyan-950"
        >
          <span>Setup Guide</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
