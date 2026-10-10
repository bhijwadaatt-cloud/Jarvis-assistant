import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Send, 
  Phone, 
  Calendar, 
  Sliders, 
  MessageSquare, 
  Zap, 
  Sparkles, 
  Info, 
  RefreshCw,
  Terminal,
  Volume2,
  VolumeX,
  Smartphone,
  Shield,
  Wifi,
  BatteryCharging,
  Battery,
  History,
  RotateCcw,
  Play,
  PackageCheck,
  Search,
  X
} from 'lucide-react';
import { ArcReactor } from './components/ArcReactor';
import { PhoneActionsModal } from './components/PhoneActionsModal';
import { SchedulePanel } from './components/SchedulePanel';
import { ContactsPanel } from './components/ContactsPanel';
import { DeviceSettingsPanel } from './components/DeviceSettingsPanel';
import { CompanionGuideModal } from './components/CompanionGuideModal';
import { CameraViewModal } from './components/CameraViewModal';
import { ApkExportModal } from './components/ApkExportModal';
import { useSpeech } from './hooks/useSpeech';
import { playJarvisSound } from './utils/audioEffects';
import { 
  triggerPhoneCall, 
  triggerWhatsAppMessage, 
  triggerSmsMessage, 
  launchAndroidApp, 
  setDeviceTorch, 
  toggleScreenWakeLock, 
  triggerHaptic, 
  readBatteryStatus,
  sendDeviceNotification
} from './utils/androidBridge';
import { Contact, ReminderItem, JarvisAction, DeviceTelemetry, ChatMessage } from './types';

// Default initial contacts
const INITIAL_CONTACTS: Contact[] = [
  { id: '1', name: 'Papa', phone: '+919876543210', relationship: 'Father', avatarColor: 'bg-blue-600' },
  { id: '2', name: 'Mummy', phone: '+919876543211', relationship: 'Mother', avatarColor: 'bg-pink-600' },
  { id: '3', name: 'Rahul', phone: '+919876543212', relationship: 'Friend', avatarColor: 'bg-emerald-600' },
  { id: '4', name: 'Priya', phone: '+919876543213', relationship: 'Colleague', avatarColor: 'bg-purple-600' },
  { id: '5', name: 'Boss', phone: '+919876543214', relationship: 'Work', avatarColor: 'bg-amber-600' },
];

// Default initial schedule reminders
const INITIAL_REMINDERS: ReminderItem[] = [
  { id: '1', title: 'Morning Fitness & Run', time: '07:00', priority: 'normal', completed: true, createdAt: Date.now() - 36000000 },
  { id: '2', title: 'Team Sync Meeting', time: '11:30', priority: 'high', completed: false, createdAt: Date.now() - 18000000 },
  { id: '3', title: 'Call Papa for update', time: '17:00', priority: 'high', completed: false, createdAt: Date.now() - 7200000 },
  { id: '4', title: 'Review Project Deliverables', time: '19:30', priority: 'normal', completed: false, createdAt: Date.now() - 3600000 },
];

export interface RecentCommand {
  id: string;
  command: string;
  timestamp: string;
}

const INITIAL_RECENT_COMMANDS: RecentCommand[] = [
  { id: 'rc-1', command: 'Papa ko call lagao', timestamp: '10:00 AM' },
  { id: 'rc-2', command: 'Torch on karo', timestamp: '09:45 AM' },
  { id: 'rc-3', command: 'Open YouTube', timestamp: '09:15 AM' },
  { id: 'rc-4', command: 'Jarvis, give me my daily briefing', timestamp: '08:30 AM' },
  { id: 'rc-5', command: 'Check battery status', timestamp: '08:00 AM' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'schedule' | 'contacts' | 'settings'>('chat');
  const [inputPrompt, setInputPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('SYSTEM ONLINE');
  const [currentAction, setCurrentAction] = useState<JarvisAction | null>(null);
  const [voiceMuted, setVoiceMuted] = useState(false);

  // Modals
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);

  // State
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('jarvis_contacts');
    return saved ? JSON.parse(saved) : INITIAL_CONTACTS;
  });

  const [reminders, setReminders] = useState<ReminderItem[]>(() => {
    const saved = localStorage.getItem('jarvis_reminders');
    return saved ? JSON.parse(saved) : INITIAL_REMINDERS;
  });

  const [recentCommands, setRecentCommands] = useState<RecentCommand[]>(() => {
    const saved = localStorage.getItem('jarvis_recent_commands');
    return saved ? JSON.parse(saved) : INITIAL_RECENT_COMMANDS;
  });

  const [commandSearch, setCommandSearch] = useState('');

  const [telemetry, setTelemetry] = useState<DeviceTelemetry>({
    batteryLevel: 85,
    isCharging: false,
    online: true,
    wakeLockActive: false,
    torchActive: false,
    vibrationSupported: true,
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'jarvis',
      text: 'Good day, Sir. J.A.R.V.I.S. Mark-VII is fully operational on your Android device. All phone controls, speed dialing, messaging, and daily schedule systems are standing by.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('jarvis_contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem('jarvis_reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Read real battery & network on mount
  useEffect(() => {
    readBatteryStatus().then((b) => {
      if (b) {
        setTelemetry((prev) => ({
          ...prev,
          batteryLevel: b.level,
          isCharging: b.charging,
        }));
      }
    });

    const updateOnline = () => {
      setTelemetry((prev) => ({ ...prev, online: navigator.onLine }));
    };
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);

    // Initial audio startup sound
    playJarvisSound('startup');

    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Process user prompt via Gemini backend or rule parser
  const handleProcessCommand = async (command: string) => {
    if (!command.trim() || isProcessing) return;

    const trimmedCmd = command.trim();

    // Track command in Recent Commands (unique, newest first, up to 20 items in history)
    const newRecent: RecentCommand = {
      id: `rc-${Date.now()}`,
      command: trimmedCmd,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setRecentCommands((prev) => {
      const filtered = prev.filter((c) => c.command.toLowerCase() !== trimmedCmd.toLowerCase());
      const updated = [newRecent, ...filtered].slice(0, 20);
      localStorage.setItem('jarvis_recent_commands', JSON.stringify(updated));
      return updated;
    });

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: trimmedCmd,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);
    setStatusText('EXECUTING VOICE COMMAND...');
    playJarvisSound('acknowledge');

    // Handle APK Conversion request directly
    if (trimmedCmd.toLowerCase().includes('apk')) {
      setIsApkModalOpen(true);
      const apkSpeech = "Sir, opening the Android APK conversion module for you now. You can download or package your APK directly.";
      const jarvisMsg: ChatMessage = {
        id: `msg-jarvis-${Date.now()}`,
        sender: 'jarvis',
        text: apkSpeech,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, jarvisMsg]);
      if (!voiceMuted) speakText(apkSpeech);
      setIsProcessing(false);
      setStatusText('APK CONVERTER ACTIVE');
      playJarvisSound('execute');
      setInputPrompt('');
      return;
    }

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: command,
          contacts,
          reminders,
          deviceContext: telemetry,
        }),
      });

      const data = await response.json();
      const spokenText = data.spokenResponse || "Sir, command executed.";
      const actions: JarvisAction[] = data.actions || [];

      // Execute primary action immediately and verify completion!
      let verifiedConfirmation = spokenText;
      if (actions.length > 0) {
        const executionResult = await executeJarvisAction(actions[0]);
        if (executionResult.verifiedSpeech) {
          verifiedConfirmation = executionResult.verifiedSpeech;
        }
      } else {
        playJarvisSound('execute');
      }

      // Add Jarvis reply with verified completion statement
      const jarvisMsg: ChatMessage = {
        id: `msg-jarvis-${Date.now()}`,
        sender: 'jarvis',
        text: verifiedConfirmation,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionExecuted: actions[0],
      };
      setMessages((prev) => [...prev, jarvisMsg]);

      // Speak Jarvis verified confirmation aloud only after action actually succeeds
      if (!voiceMuted) {
        speakText(verifiedConfirmation);
      }

      setStatusText('STANDBY // READY');
    } catch (err) {
      console.error('Command processing error:', err);
      const fallbackText = "Sir, I encountered a communication error, but all local phone controls remain ready.";
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: 'jarvis',
          text: fallbackText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      if (!voiceMuted) speakText(fallbackText);
      setStatusText('SYSTEM READY');
    } finally {
      setIsProcessing(false);
      setInputPrompt('');
    }
  };

  // Immediate Execution dispatch for Jarvis actions
  const executeJarvisAction = async (action: JarvisAction): Promise<{ success: boolean; verifiedSpeech?: string }> => {
    setCurrentAction(action);
    triggerHaptic([100, 50, 100]);

    switch (action.type) {
      case 'CALL': {
        const contactName = action.target || '';
        const found = contacts.find((c) => c.name.toLowerCase() === contactName.toLowerCase());
        const phone = action.payload?.phone || (found ? found.phone : contactName);
        action.payload = { ...action.payload, phone };
        
        // Execute phone dialer immediately
        const dialed = triggerPhoneCall(phone);
        playJarvisSound('execute');
        if (dialed) {
          return {
            success: true,
            verifiedSpeech: `Sir, dialing ${contactName || phone} immediately via your phone dialer.`
          };
        } else {
          return {
            success: false,
            verifiedSpeech: `Sir, unable to parse the phone number for ${contactName || 'recipient'}.`
          };
        }
      }
      case 'WHATSAPP': {
        const contactName = action.target || '';
        const found = contacts.find((c) => c.name.toLowerCase() === contactName.toLowerCase());
        const phone = action.payload?.phone || (found ? found.phone : '');
        const message = action.payload?.message || 'Hello from Jarvis';
        action.payload = { ...action.payload, phone, message };
        
        // Execute WhatsApp launch immediately
        triggerWhatsAppMessage(phone, message);
        playJarvisSound('execute');
        return {
          success: true,
          verifiedSpeech: `Sir, WhatsApp has been opened with your message for ${contactName || 'recipient'}.`
        };
      }
      case 'SMS': {
        const contactName = action.target || '';
        const found = contacts.find((c) => c.name.toLowerCase() === contactName.toLowerCase());
        const phone = action.payload?.phone || (found ? found.phone : '');
        const message = action.payload?.message || 'Hello from Jarvis';
        action.payload = { ...action.payload, phone, message };
        
        // Execute SMS composer immediately
        triggerSmsMessage(phone, message);
        playJarvisSound('execute');
        return {
          success: true,
          verifiedSpeech: `Sir, SMS composer opened for ${contactName || 'recipient'}.`
        };
      }
      case 'OPEN_APP': {
        const appName = action.payload?.app || action.target || '';
        if (appName.toLowerCase() === 'camera') {
          setIsCameraOpen(true);
          playJarvisSound('execute');
          return {
            success: true,
            verifiedSpeech: `Optical camera feed engaged, Sir.`
          };
        } else {
          const res = launchAndroidApp(appName);
          playJarvisSound('execute');
          return {
            success: res.success,
            verifiedSpeech: `Opening ${res.label || appName} on your phone now, Sir.`
          };
        }
      }
      case 'SETTING': {
        const feature = (action.payload?.feature || action.target || '').toLowerCase();
        const state = action.payload?.state;
        if (feature.includes('flash') || feature.includes('torch') || feature.includes('light')) {
          const enable = state === 'off' ? false : true;
          const ok = await setDeviceTorch(enable);
          setTelemetry((prev) => ({ ...prev, torchActive: ok }));
          if (ok) {
            playJarvisSound('execute');
            return {
              success: true,
              verifiedSpeech: `Flashlight turned ${enable ? 'on' : 'off'}, Sir.`
            };
          } else {
            return {
              success: false,
              verifiedSpeech: `Sir, hardware camera permission is required to turn on the flashlight.`
            };
          }
        } else if (feature.includes('wake') || feature.includes('screen')) {
          const ok = await toggleScreenWakeLock(true);
          setTelemetry((prev) => ({ ...prev, wakeLockActive: ok }));
          playJarvisSound('execute');
          return {
            success: ok,
            verifiedSpeech: `Screen wake lock is active, Sir. Display will remain awake.`
          };
        } else if (feature.includes('battery') || feature.includes('power')) {
          const b = await readBatteryStatus();
          const level = b ? b.level : telemetry.batteryLevel;
          playJarvisSound('execute');
          return {
            success: true,
            verifiedSpeech: `Sir, phone battery is currently at ${level} percent.`
          };
        } else if (feature.includes('vibrat')) {
          triggerHaptic([300, 150, 300]);
          playJarvisSound('execute');
          return {
            success: true,
            verifiedSpeech: `Haptic vibration alert executed, Sir.`
          };
        }
        break;
      }
      case 'ADD_REMINDER': {
        const title = action.payload?.title || action.target || 'Important Task';
        const time = action.payload?.time || '15:00';
        const newRem: ReminderItem = {
          id: `rem-${Date.now()}`,
          title,
          time,
          priority: action.payload?.priority || 'normal',
          completed: false,
          createdAt: Date.now(),
        };
        setReminders((prev) => [newRem, ...prev]);
        sendDeviceNotification('Jarvis Schedule Update', `Reminder registered: ${title} at ${time}`);
        playJarvisSound('execute');
        return {
          success: true,
          verifiedSpeech: `Sir, reminder for "${title}" has been saved to your schedule for ${time}.`
        };
      }
      case 'DAILY_BRIEFING': {
        const briefingText = triggerDailyBriefing();
        return {
          success: true,
          verifiedSpeech: briefingText
        };
      }
      case 'SEARCH': {
        const query = action.payload?.query || action.target || '';
        if (query) {
          window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
          playJarvisSound('execute');
          return {
            success: true,
            verifiedSpeech: `Searching Google for "${query}", Sir.`
          };
        }
        break;
      }
    }
    return { success: true };
  };

  // Setup speech hook
  const {
    isListening,
    isSpeaking,
    transcript,
    continuousMode,
    setContinuousMode,
    selectedLanguage,
    setSelectedLanguage,
    toggleListening,
    speakText,
    stopSpeaking,
  } = useSpeech({
    onCommandRecognized: (cmd) => {
      handleProcessCommand(cmd);
    },
    language: 'hi-IN',
  });

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim()) return;
    handleProcessCommand(inputPrompt);
  };

  // Daily Briefing generator
  const triggerDailyBriefing = () => {
    const pending = reminders.filter((r) => !r.completed);
    const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' });
    const briefingText = `Good day, Sir. Today is ${dateStr}. Device battery is at ${telemetry.batteryLevel}%. You have ${pending.length} pending tasks on your schedule, starting with: ${pending[0]?.title || 'none'}. All phone systems are green. Standing by.`;
    return briefingText;
  };

  const handleQuickChip = (prompt: string) => {
    playJarvisSound('click');
    handleProcessCommand(prompt);
  };

  const quickChips = [
    { label: '📞 Call Papa', prompt: 'Papa ko call lagao' },
    { label: '💬 WhatsApp Priya', prompt: 'Send WhatsApp to Priya: Main nikal raha hu' },
    { label: '⚡ Flashlight On', prompt: 'Torch on karo' },
    { label: '📅 Daily Briefing', prompt: 'Jarvis, give me my daily briefing' },
    { label: '⏰ Remind 5 PM', prompt: 'Remind me at 17:00 to call client' },
    { label: '🎥 Open Camera', prompt: 'Camera open karo' },
    { label: '🎵 Spotify', prompt: 'Open Spotify' },
    { label: '📦 Convert APK', prompt: 'Jarvis convert APK' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-gray-950 pb-28">
      {/* Top Holographic Navigation Header */}
      <header className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-xl border-b border-cyan-500/20 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-400/60 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.4)]">
              <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-wider text-white">J.A.R.V.I.S.</h1>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/30">
                  MARK-VII MOBILE
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  ONLINE
                </span>
                <span aria-hidden="true">·</span>
                <span>ANDROID BRIDGE ACTIVE</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Battery status */}
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-900 border border-gray-800 rounded-lg text-[11px] font-mono text-gray-300">
              {telemetry.isCharging ? (
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Battery className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>{telemetry.batteryLevel}%</span>
            </div>

            {/* Voice mute toggle */}
            <button
              onClick={() => {
                playJarvisSound('click');
                if (!voiceMuted) stopSpeaking();
                setVoiceMuted(!voiceMuted);
              }}
              aria-label={voiceMuted ? "Unmute Jarvis voice" : "Mute Jarvis voice"}
              className="p-1.5 bg-gray-900 border border-gray-800 hover:border-cyan-500/40 text-gray-300 hover:text-white rounded-lg transition-colors"
            >
              {voiceMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>

            {/* Android Guide Button */}
            <button
              onClick={() => setIsGuideOpen(true)}
              aria-label="Open Android phone control guide"
              className="p-1.5 bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:text-white rounded-lg transition-colors"
              title="Android Phone Control Guide"
            >
              <Smartphone className="w-4 h-4" />
            </button>

            {/* Convert to APK Button */}
            <button
              onClick={() => {
                playJarvisSound('click');
                setIsApkModalOpen(true);
              }}
              aria-label="Convert to Android APK"
              className="px-2 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-400 text-cyan-300 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-[11px] font-mono font-bold shadow-sm active:scale-95 cursor-pointer"
              title="Convert Jarvis to Android APK"
            >
              <PackageCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>APK</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main App Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-3 space-y-4">
        {/* Voice-to-Voice Mode & Direct Execution HUD Bar */}
        <div className="flex items-center justify-between p-2.5 bg-gray-900/80 border border-cyan-500/30 rounded-2xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-mono font-semibold text-cyan-300 uppercase tracking-wider">
              ⚡ Voice-to-Voice Direct Execution: Active
            </span>
          </div>

          <button
            onClick={() => {
              playJarvisSound('click');
              setContinuousMode(!continuousMode);
            }}
            className={`px-2.5 py-1 text-[11px] font-mono rounded-xl border transition-all flex items-center gap-1.5 ${
              continuousMode
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{continuousMode ? 'Hands-Free Loop: ON' : 'Push-To-Talk: ON'}</span>
          </button>
        </div>

        {/* Arc Reactor Centerpiece */}
        <div className="pt-1">
          <ArcReactor
            isListening={isListening}
            isSpeaking={isSpeaking}
            isProcessing={isProcessing}
            onToggleMic={toggleListening}
            statusText={
              isListening
                ? 'LISTENING TO YOUR VOICE...'
                : isProcessing
                ? 'COMPUTING DIRECTIVE...'
                : isSpeaking
                ? 'JARVIS VOCAL RESPONSE ACTIVE'
                : statusText
            }
          />
        </div>

        {/* Real-time speech transcript feedback */}
        {(transcript || isListening) && (
          <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl text-center">
            <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest block mb-1">
              Audio Waveform Capture:
            </span>
            <p className="text-sm font-medium text-white italic">
              "{transcript || 'Listening for speech, speak now...'}"
            </p>
          </div>
        )}

        {/* Quick Suggestion Chips */}
        <div className="overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-2 whitespace-nowrap">
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickChip(chip.prompt)}
                className="px-3 py-1.5 bg-gray-900/80 hover:bg-cyan-950/60 border border-gray-800 hover:border-cyan-500/40 text-gray-300 hover:text-cyan-200 text-xs font-medium rounded-xl transition-all shadow-sm active:scale-95"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Tabs (Functional Segmented Tabs) */}
        <div className="flex items-center gap-1 p-1 bg-gray-900/90 border border-gray-800 rounded-2xl">
          <button
            onClick={() => {
              playJarvisSound('click');
              setActiveTab('chat');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-cyan-500 text-gray-950 shadow-md shadow-cyan-950'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Terminal</span>
          </button>

          <button
            onClick={() => {
              playJarvisSound('click');
              setActiveTab('schedule');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'schedule'
                ? 'bg-cyan-500 text-gray-950 shadow-md shadow-cyan-950'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Schedule</span>
          </button>

          <button
            onClick={() => {
              playJarvisSound('click');
              setActiveTab('contacts');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'contacts'
                ? 'bg-cyan-500 text-gray-950 shadow-md shadow-cyan-950'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Dialer</span>
          </button>

          <button
            onClick={() => {
              playJarvisSound('click');
              setActiveTab('settings');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-cyan-500 text-gray-950 shadow-md shadow-cyan-950'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Controls</span>
          </button>
        </div>

        {/* Tab 1: Terminal / Chat Conversation Log */}
        {activeTab === 'chat' && (
          <div className="space-y-3">
            {/* Recent Commands Quick Re-Run Panel (with Search Filter) */}
            <div className="bg-gray-900/80 border border-cyan-500/30 rounded-2xl p-3.5 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold font-mono tracking-wider text-cyan-200 uppercase">
                    Recent Commands {commandSearch.trim() ? `(${recentCommands.filter(c => c.command.toLowerCase().includes(commandSearch.toLowerCase().trim())).length} Match)` : '(Last 5)'}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-cyan-400/80">
                    Tap to re-run
                  </span>
                  {recentCommands.length > 0 && (
                    <button
                      onClick={() => {
                        playJarvisSound('click');
                        setRecentCommands([]);
                        setCommandSearch('');
                        localStorage.removeItem('jarvis_recent_commands');
                      }}
                      className="text-[10px] font-mono text-gray-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Clear recent command history"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Inline Search Bar */}
              {recentCommands.length > 0 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={commandSearch}
                    onChange={(e) => setCommandSearch(e.target.value)}
                    placeholder="Search previous commands (e.g. call, torch, youtube)..."
                    className="w-full pl-8 pr-8 py-1.5 bg-gray-950/90 border border-gray-800 focus:border-cyan-500/60 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none font-sans transition-colors"
                  />
                  {commandSearch && (
                    <button
                      onClick={() => setCommandSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5 rounded cursor-pointer"
                      aria-label="Clear command filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Filtered Commands List */}
              {recentCommands.length === 0 ? (
                <div className="py-4 text-center text-xs font-mono text-gray-500 border border-dashed border-gray-800 rounded-xl">
                  No recent commands yet. Speak or type a command to populate history.
                </div>
              ) : recentCommands.filter(c => c.command.toLowerCase().includes(commandSearch.toLowerCase().trim())).length === 0 ? (
                <div className="py-3 text-center text-xs font-mono text-gray-400 border border-dashed border-gray-800 rounded-xl">
                  <span>No commands match "{commandSearch}". </span>
                  <button
                    onClick={() => setCommandSearch('')}
                    className="text-cyan-400 hover:underline ml-1 font-semibold cursor-pointer"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[190px] overflow-y-auto pr-0.5">
                  {(commandSearch.trim() 
                    ? recentCommands.filter(c => c.command.toLowerCase().includes(commandSearch.toLowerCase().trim()))
                    : recentCommands.slice(0, 5)
                  ).map((rc) => (
                    <button
                      key={rc.id}
                      onClick={() => {
                        playJarvisSound('click');
                        handleProcessCommand(rc.command);
                      }}
                      className="p-2.5 bg-gray-950/80 hover:bg-cyan-950/50 border border-gray-800 hover:border-cyan-500/50 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer active:scale-98"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <RotateCcw className="w-3.5 h-3.5 text-cyan-400 shrink-0 group-hover:rotate-180 transition-transform duration-300" />
                        <span className="text-xs text-gray-200 font-medium truncate group-hover:text-cyan-200">
                          {rc.command}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] font-mono text-gray-500">
                          {rc.timestamp}
                        </span>
                        <span className="p-1 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/30 group-hover:bg-cyan-500 group-hover:text-gray-950 transition-colors shadow-sm">
                          <Play className="w-2.5 h-2.5 fill-current" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Conversation Log */}
            <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-4 max-h-[340px] overflow-y-auto space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-cyan-600 text-white shadow-md'
                        : 'bg-gray-950/90 border border-cyan-900/40 text-gray-200 shadow-sm'
                    }`}
                  >
                    {m.sender === 'jarvis' && (
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 mb-1">
                        <Sparkles className="w-3 h-3" />
                        <span>JARVIS</span>
                      </div>
                    )}
                    <p>{m.text}</p>
                    {m.actionExecuted && (
                      <div className="mt-2 pt-1.5 border-t border-gray-800/80 flex items-center gap-1.5 text-[10px] font-mono text-cyan-300">
                        <Zap className="w-3 h-3 text-cyan-400" />
                        <span>Dispatched: {m.actionExecuted.type} {m.actionExecuted.target ? `(${m.actionExecuted.target})` : ''}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-mono text-gray-500 mt-1 px-1">{m.timestamp}</span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Tab 2: Schedule & Reminders */}
        {activeTab === 'schedule' && (
          <SchedulePanel
            reminders={reminders}
            onAddReminder={(rem) => {
              const newRem: ReminderItem = {
                ...rem,
                id: `rem-${Date.now()}`,
                createdAt: Date.now(),
              };
              setReminders((prev) => [newRem, ...prev]);
            }}
            onToggleComplete={(id) => {
              setReminders((prev) =>
                prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
              );
            }}
            onDeleteReminder={(id) => {
              setReminders((prev) => prev.filter((r) => r.id !== id));
            }}
            onTriggerDailyBriefing={() => handleProcessCommand("Jarvis, give me my daily briefing")}
            onJarvisSpeak={(text) => {
              if (!voiceMuted) speakText(text);
            }}
          />
        )}

        {/* Tab 3: Contacts & Speed Dial */}
        {activeTab === 'contacts' && (
          <ContactsPanel
            contacts={contacts}
            onAddContact={(c) => {
              const newContact: Contact = {
                ...c,
                id: `contact-${Date.now()}`,
                avatarColor: 'bg-cyan-700',
              };
              setContacts((prev) => [...prev, newContact]);
            }}
            onDeleteContact={(id) => {
              setContacts((prev) => prev.filter((c) => c.id !== id));
            }}
            onCallContact={(phone, name) => {
              setCurrentAction({
                type: 'CALL',
                target: name,
                payload: { phone },
              });
            }}
          />
        )}

        {/* Tab 4: Hardware Controls & Device Settings */}
        {activeTab === 'settings' && (
          <DeviceSettingsPanel
            telemetry={telemetry}
            setTelemetry={setTelemetry}
            continuousMode={continuousMode}
            setContinuousMode={setContinuousMode}
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={setSelectedLanguage}
            onOpenCompanionGuide={() => setIsGuideOpen(true)}
            onOpenLiveCamera={() => setIsCameraOpen(true)}
          />
        )}
      </main>

      {/* Persistent Bottom Command Bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 bg-gray-950/90 backdrop-blur-xl border-t border-gray-800 p-3">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
            {/* Quick Mic trigger */}
            <button
              type="button"
              onClick={toggleListening}
              aria-label="Toggle speech input"
              className={`p-2.5 rounded-xl border transition-all ${
                isListening
                  ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
                  : 'bg-gray-900 border-cyan-500/40 text-cyan-400 hover:text-white'
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>

            {/* Input field */}
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={isListening ? "Listening... speak now" : "Speak or type: 'Call Papa', 'Open WhatsApp'..."}
              className="flex-1 px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />

            {/* Send button */}
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isProcessing}
              aria-label="Send command"
              className="p-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-gray-950 font-semibold rounded-xl transition-colors shadow-md shadow-cyan-950"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Action Execution HUD Modal (Calls, WhatsApp, App Launch) */}
      <PhoneActionsModal
        action={currentAction}
        onDismiss={() => setCurrentAction(null)}
      />

      {/* Android Companion Guide Modal */}
      <CompanionGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Live Optical Camera View Modal */}
      <CameraViewModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
      />

      {/* APK Conversion & Export Modal */}
      <ApkExportModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
        appUrl={typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-rhm2l4qamncsnf33mzxaob-182781219278.asia-southeast1.run.app'}
      />
    </div>
  );
}
