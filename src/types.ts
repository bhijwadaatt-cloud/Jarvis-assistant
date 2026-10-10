export interface Contact {
  id: string;
  name: string;
  phone: string;
  relationship?: string;
  avatarColor?: string;
}

export interface ReminderItem {
  id: string;
  title: string;
  time: string; // e.g. "14:30" or "In 15 minutes"
  date?: string; // YYYY-MM-DD
  priority: 'normal' | 'high';
  completed: boolean;
  createdAt: number;
}

export type JarvisActionType = 
  | 'CALL' 
  | 'WHATSAPP' 
  | 'SMS' 
  | 'OPEN_APP' 
  | 'SETTING' 
  | 'ADD_REMINDER' 
  | 'DELETE_REMINDER' 
  | 'DAILY_BRIEFING' 
  | 'SEARCH' 
  | 'SPEAK';

export interface JarvisAction {
  type: JarvisActionType;
  target?: string;
  payload?: {
    phone?: string;
    message?: string;
    app?: string;
    feature?: string;
    state?: string;
    title?: string;
    time?: string;
    priority?: 'normal' | 'high';
    query?: string;
    summary?: string;
  };
}

export interface DeviceTelemetry {
  batteryLevel: number | null;
  isCharging: boolean | null;
  online: boolean;
  wakeLockActive: boolean;
  torchActive: boolean;
  vibrationSupported: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'jarvis';
  text: string;
  timestamp: string;
  actionExecuted?: JarvisAction;
}
