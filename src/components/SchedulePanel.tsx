import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, Trash2, CheckCircle, Bell, Sparkles } from 'lucide-react';
import { ReminderItem } from '../types';
import { playJarvisSound } from '../utils/audioEffects';
import { triggerHaptic, sendDeviceNotification } from '../utils/androidBridge';

interface SchedulePanelProps {
  reminders: ReminderItem[];
  onAddReminder: (reminder: Omit<ReminderItem, 'id' | 'createdAt'>) => void;
  onToggleComplete: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onTriggerDailyBriefing: () => void;
  onJarvisSpeak: (text: string) => void;
}

export const SchedulePanel: React.FC<SchedulePanelProps> = ({
  reminders,
  onAddReminder,
  onToggleComplete,
  onDeleteReminder,
  onTriggerDailyBriefing,
  onJarvisSpeak,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('14:00');
  const [priority, setPriority] = useState<'normal' | 'high'>('normal');

  // Monitor reminders to fire alerts when matching current time
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${currentHours}:${currentMinutes}`;

      reminders.forEach((r) => {
        if (!r.completed && r.time === timeStr) {
          playJarvisSound('alert');
          triggerHaptic([300, 150, 300, 150, 400]);
          sendDeviceNotification(`Jarvis Protocol Alert`, `Sir, your scheduled task "${r.title}" is due now.`);
          onJarvisSpeak(`Sir, reminder alert: ${r.title} is scheduled for right now.`);
        }
      });
    }, 30000); // check every 30s

    return () => clearInterval(interval);
  }, [reminders, onJarvisSpeak]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddReminder({
      title: title.trim(),
      time,
      priority,
      completed: false,
    });

    setTitle('');
    setShowAddModal(false);
    playJarvisSound('execute');
  };

  const pendingReminders = reminders.filter((r) => !r.completed);
  const completedReminders = reminders.filter((r) => r.completed);

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white tracking-wide">Daily Schedule & Reminders</h2>
          <div className="flex items-center gap-2 text-xs text-cyan-400/80 font-mono mt-0.5">
            <span>{pendingReminders.length} pending</span>
            <span aria-hidden="true">·</span>
            <span>{completedReminders.length} completed</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onTriggerDailyBriefing}
            className="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Briefing</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-gray-950 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-cyan-950"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <form onSubmit={handleSubmit} className="bg-gray-900 border border-cyan-500/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-white">Create New Schedule Item</h3>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="text-xs text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-1">Task Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Call Doctor, Meeting with Rahul, Gym"
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">Time (24h)</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="normal">Normal</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 text-xs font-semibold rounded-xl"
            >
              Save Schedule Item
            </button>
          </div>
        </form>
      )}

      {/* Reminders List */}
      <div className="space-y-2">
        {reminders.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-xs font-mono border border-dashed border-gray-800 rounded-2xl">
            No schedule events recorded yet, Sir. Speak "Remind me to..." or tap Add Task above.
          </div>
        ) : (
          reminders.map((r) => (
            <div
              key={r.id}
              className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                r.completed
                  ? 'bg-gray-950/50 border-gray-900 opacity-60'
                  : r.priority === 'high'
                  ? 'bg-amber-950/20 border-amber-500/30'
                  : 'bg-gray-900/60 border-cyan-900/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onToggleComplete(r.id)}
                  aria-label={r.completed ? "Mark incomplete" : "Mark complete"}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                    r.completed ? 'bg-emerald-500 text-gray-950' : 'border border-gray-700 hover:border-cyan-400 text-transparent'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
                <div>
                  <h4 className={`text-sm font-medium ${r.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                    {r.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-mono mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      {r.time}
                    </span>
                    {r.priority === 'high' && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-400 flex items-center gap-1">
                          <Bell className="w-3 h-3" /> Urgent
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onDeleteReminder(r.id)}
                aria-label="Delete reminder"
                className="p-1.5 text-gray-500 hover:text-rose-400 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
