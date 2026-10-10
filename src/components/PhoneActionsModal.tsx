import React, { useEffect } from 'react';
import { Phone, MessageSquare, Send, ExternalLink, X, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { JarvisAction } from '../types';
import { triggerPhoneCall, triggerWhatsAppMessage, triggerSmsMessage, launchAndroidApp } from '../utils/androidBridge';
import { playJarvisSound } from '../utils/audioEffects';

interface PhoneActionsModalProps {
  action: JarvisAction | null;
  onDismiss: () => void;
}

export const PhoneActionsModal: React.FC<PhoneActionsModalProps> = ({ action, onDismiss }) => {
  useEffect(() => {
    if (!action) return;
    playJarvisSound('acknowledge');

    // Auto-dismiss after 6 seconds
    const timer = setTimeout(() => {
      onDismiss();
    }, 6000);
    return () => clearTimeout(timer);
  }, [action, onDismiss]);

  if (!action) return null;

  const handleReDial = () => {
    const phone = action.payload?.phone || action.target || '';
    triggerPhoneCall(phone);
  };

  const handleSendWhatsApp = () => {
    const phone = action.payload?.phone || '';
    const message = action.payload?.message || '';
    triggerWhatsAppMessage(phone, message);
    onDismiss();
  };

  const handleSendSms = () => {
    const phone = action.payload?.phone || '';
    const message = action.payload?.message || '';
    triggerSmsMessage(phone, message);
    onDismiss();
  };

  return (
    <div className="fixed inset-x-0 bottom-24 z-50 px-4 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="bg-gray-900/95 border border-cyan-500/40 rounded-2xl p-4 shadow-2xl shadow-cyan-950/60 backdrop-blur-xl">
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-cyan-300 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Jarvis Direct Action Dispatched: {action.type}</span>
            </span>
          </div>
          <button
            onClick={onDismiss}
            aria-label="Dismiss action"
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Content Based on Type */}
        {action.type === 'CALL' && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <Phone className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-semibold text-white">{action.target || 'Contact'}</h4>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono">
                    DIALED
                  </span>
                </div>
                <p className="text-xs font-mono text-gray-300">{action.payload?.phone || 'Dispatched to Phone Dialer'}</p>
              </div>
            </div>
            <button
              onClick={handleReDial}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-950 active:scale-95 transition-transform"
            >
              <span>Re-Dial</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {action.type === 'WHATSAPP' && (
          <div className="mt-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">To: {action.target}</h4>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    WHATSAPP LAUNCHED
                  </span>
                </div>
                <div className="mt-1 p-2 bg-gray-950/80 rounded-lg border border-gray-800 text-xs text-gray-200">
                  "{action.payload?.message || 'Hello'}"
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                onClick={onDismiss}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white rounded-lg"
              >
                Dismiss
              </button>
              <button
                onClick={handleSendWhatsApp}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Re-Open WhatsApp</span>
              </button>
            </div>
          </div>
        )}

        {action.type === 'SMS' && (
          <div className="mt-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-400 shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">To: {action.target}</h4>
                  <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/30">
                    SMS OPENED
                  </span>
                </div>
                <div className="mt-1 p-2 bg-gray-950/80 rounded-lg border border-gray-800 text-xs text-gray-200">
                  "{action.payload?.message || 'Hello'}"
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                onClick={onDismiss}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white rounded-lg"
              >
                Dismiss
              </button>
              <button
                onClick={handleSendSms}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Re-Open SMS</span>
              </button>
            </div>
          </div>
        )}

        {action.type === 'OPEN_APP' && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-400 flex items-center justify-center text-blue-400">
                <ExternalLink className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">App Launched</h4>
                <p className="text-xs text-cyan-300 font-mono capitalize">{action.payload?.app || action.target}</p>
              </div>
            </div>
            <button
              onClick={() => {
                launchAndroidApp(action.payload?.app || action.target || '');
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1"
            >
              <span>Relaunch</span>
            </button>
          </div>
        )}

        {action.type === 'SETTING' && (
          <div className="mt-2 text-xs text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Hardware parameter updated: <b>{action.target}</b></span>
          </div>
        )}
      </div>
    </div>
  );
};
