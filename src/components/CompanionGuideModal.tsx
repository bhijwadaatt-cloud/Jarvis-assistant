import React, { useState } from 'react';
import { X, Check, Copy, Smartphone, Shield, Radio, Terminal, ExternalLink } from 'lucide-react';
import { playJarvisSound } from '../utils/audioEffects';

interface CompanionGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompanionGuideModal: React.FC<CompanionGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyCode = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    playJarvisSound('acknowledge');
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const macroDroidWebhook = `https://trigger.macrodroid.com/YOUR_DEVICE_ID/jarvis_action?cmd=toggle_wifi`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto bg-gray-900 border border-cyan-500/40 rounded-3xl p-5 shadow-2xl text-left space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Android Full Phone Control Guide
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close guide"
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Install as Mobile App */}
        <div className="p-4 bg-gray-950/70 border border-gray-800 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-cyan-400">
            <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-400 flex items-center justify-center text-xs">1</span>
            <span>Apne Android Phone Par App Install Karein (PWA)</span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            1. Apne Android phone me Google Chrome ya Brave browser me is app ko kholein.<br />
            2. Top-right corner me <b>⋮ (Three Dots)</b> par tap karein.<br />
            3. <b>"Add to Home screen"</b> ya <b>"Install App"</b> par tap karein.<br />
            4. Ab Jarvis aapke phone ke home screen par ek native app ki tarah bina browser bar ke full-screen chalega!
          </p>
        </div>

        {/* Step 2: What works out of the box */}
        <div className="p-4 bg-gray-950/70 border border-gray-800 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
            <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-400 flex items-center justify-center text-xs">2</span>
            <span>Seamless Live Features (Direct Phone Control)</span>
          </div>
          <ul className="text-xs text-gray-300 space-y-1.5 list-disc list-inside">
            <li><b>Calling:</b> "Call Papa" bolte hi direct dialer trigger hota hai.</li>
            <li><b>WhatsApp:</b> "Send WhatsApp to Priya 'Hello'" bolte hi WhatsApp chat open karke message type kar deta hai.</li>
            <li><b>SMS:</b> "Send SMS to Rahul" bolte hi default messaging app me le jata hai.</li>
            <li><b>Apps:</b> YouTube, Camera, Spotify, Maps, Calculator bolte hi direct launch hote hain.</li>
            <li><b>Flashlight:</b> Hardware torch seedha phone se on/off hoti hai.</li>
            <li><b>Reminders:</b> Alarm tone, haptic vibration aur spoken alert bajata hai.</li>
          </ul>
        </div>

        {/* Step 3: Native Android Kotlin Project & Samsung One UI Configuration */}
        <div className="p-4 bg-gradient-to-br from-cyan-950/60 to-gray-950 border border-cyan-500/40 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-cyan-500 text-gray-950 flex items-center justify-center text-xs font-bold">3</span>
              <span>Native Kotlin App & Samsung One UI Setup</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
              JARVIS CORE
            </span>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">
            Samsung Galaxy phones par deep system integration ke liye Native Android Kotlin project <code className="text-cyan-300 bg-gray-950 px-1 py-0.5 rounded font-mono">/android</code> directory me ready hai:
          </p>

          <div className="space-y-2 text-xs text-gray-300">
            <div className="p-2.5 bg-gray-900 rounded-xl border border-gray-800 space-y-1">
              <p className="font-semibold text-white flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>1. Default Assistant Setting:</span>
              </p>
              <p className="text-gray-400">Settings &gt; Apps &gt; Choose default apps &gt; Digital assistant app &gt; Select <b>J.A.R.V.I.S.</b></p>
            </div>

            <div className="p-2.5 bg-gray-900 rounded-xl border border-gray-800 space-y-1">
              <p className="font-semibold text-white flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. Samsung Battery Protection (Screen-off Hotword):</span>
              </p>
              <p className="text-gray-400">App Info &gt; Battery &gt; Set to <b>"Unrestricted"</b> (Samsung One UI ke background sleep limits bypass karne ke liye).</p>
            </div>

            <div className="p-2.5 bg-gray-900 rounded-xl border border-gray-800 space-y-1">
              <p className="font-semibold text-white flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-purple-400" />
                <span>3. Accessibility UI Automation:</span>
              </p>
              <p className="text-gray-400">Settings &gt; Accessibility &gt; Installed services &gt; Turn on <b>J.A.R.V.I.S. Automation</b> (auto WhatsApp typing & Instagram profile navigation ke liye).</p>
            </div>
          </div>
        </div>

        {/* Step 4: Deep OS Automation (MacroDroid / Tasker Bridge) */}
        <div className="p-4 bg-gray-950/70 border border-cyan-900/40 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-purple-400">
            <span className="w-5 h-5 rounded-full bg-purple-950 border border-purple-400 flex items-center justify-center text-xs">3</span>
            <span>Deep System Automation (MacroDroid / Tasker Integration)</span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            Agar aap chahte hain ki Jarvis aapka <b>Screen Lock kare, Bluetooth/WiFi switch kare, ya background call pick kare</b>:
          </p>
          <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-gray-400">
              <span>MacroDroid Webhook URL Format</span>
              <button
                onClick={() => copyCode(macroDroidWebhook, 1)}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
              >
                {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIndex === 1 ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <code className="block text-[11px] font-mono text-cyan-300 bg-gray-950 p-2 rounded break-all">
              {macroDroidWebhook}
            </code>
            <p className="text-[11px] text-gray-400">
              Google Play Store se free app <b>MacroDroid</b> install karein, usme "Webhook Trigger" select karein aur action me "Turn Screen Off" ya "Toggle Bluetooth" daalein!
            </p>
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 text-xs font-bold rounded-xl"
          >
            Got it, Sir
          </button>
        </div>
      </div>
    </div>
  );
};
