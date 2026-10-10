import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Download, 
  ExternalLink, 
  Check, 
  Copy, 
  Layers, 
  ShieldCheck, 
  ArrowRight,
  PackageCheck
} from 'lucide-react';
import { playJarvisSound } from '../utils/audioEffects';

interface ApkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl: string;
}

export const ApkExportModal: React.FC<ApkExportModalProps> = ({ isOpen, onClose, appUrl }) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(appUrl);
    playJarvisSound('acknowledge');
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const bubblewrapCommand = `npx @bubblewrap/cli init --manifest="${appUrl}/manifest.webmanifest"
npx @bubblewrap/cli build`;

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(bubblewrapCommand);
    playJarvisSound('acknowledge');
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const pwaBuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(appUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl max-h-[88vh] overflow-y-auto bg-gray-900 border border-cyan-500/40 rounded-3xl p-5 shadow-2xl text-left space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-400 flex items-center justify-center">
              <PackageCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Convert Jarvis to Android APK
              </h2>
              <p className="text-[11px] font-mono text-cyan-400/80">
                PWA to Native Android Package (.apk / .aab)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close APK modal"
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Method 1: Instant 1-Click APK Generator (PWABuilder by Microsoft/Google) */}
        <div className="p-4 bg-gradient-to-br from-cyan-950/60 to-gray-950 border border-cyan-500/40 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-cyan-500 text-gray-950 flex items-center justify-center text-xs font-bold">1</span>
              <span>1-Click APK Generator (PWABuilder)</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
              RECOMMENDED
            </span>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">
            Google aur Microsoft ka official **PWABuilder** aapke Jarvis URL ko 1-click me direct installable **Android APK package** me convert kar deta hai:
          </p>

          <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
              <span>Your Jarvis App URL</span>
              <button
                onClick={handleCopyUrl}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
              >
                {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <code className="block text-[11px] font-mono text-cyan-300 bg-gray-950 p-2 rounded truncate">
              {appUrl}
            </code>
          </div>

          <a
            href={pwaBuilderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-gray-950 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-950 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Open PWABuilder & Download APK</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </a>
        </div>

        {/* Method 2: Native WebAPK (Zero PC / Install Directly on Android) */}
        <div className="p-4 bg-gray-950/80 border border-gray-800 rounded-2xl space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
            <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-400 flex items-center justify-center text-xs">2</span>
            <span>Instant Mobile WebAPK (No PC Required)</span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            Android Chrome ka inbuilt **Google Play Services WebAPK engine** bina kisi manual download ke phone par native APK install kar deta hai:
          </p>
          <ol className="text-xs text-gray-300 space-y-1.5 list-decimal list-inside bg-gray-900/60 p-3 rounded-xl border border-gray-800">
            <li>Apne Android phone me Chrome ya Brave browser me Jarvis URL kholein.</li>
            <li>Top-right corner me <b>⋮ (Three Dots)</b> menu par tap karein.</li>
            <li><b>"Install App"</b> ya <b>"Add to Home Screen"</b> choose karein.</li>
            <li>Android background me real signed WebAPK generate karke app list me add kar dega!</li>
          </ol>
        </div>

        {/* Method 3: Command Line / Bubblewrap for Developers */}
        <div className="p-4 bg-gray-950/80 border border-gray-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-purple-950 border border-purple-400 flex items-center justify-center text-xs">3</span>
              <span>CLI / Bubblewrap APK Builder</span>
            </span>
            <button
              onClick={handleCopyCmd}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
            >
              {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3 bg-gray-900 border border-gray-800 rounded-xl text-[11px] font-mono text-cyan-300 overflow-x-auto">
            {bubblewrapCommand}
          </pre>
          <p className="text-[11px] text-gray-400">
            Terminal me run karke directly Google Play Store compatible APK / AAB generate kar sakte hain.
          </p>
        </div>

        {/* Bottom Actions */}
        <div className="pt-2 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
