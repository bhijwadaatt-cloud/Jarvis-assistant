import React, { useState } from 'react';
import { Phone, MessageSquare, Plus, Trash2, UserPlus, PhoneCall } from 'lucide-react';
import { Contact } from '../types';
import { triggerPhoneCall, triggerWhatsAppMessage } from '../utils/androidBridge';
import { playJarvisSound } from '../utils/audioEffects';

interface ContactsPanelProps {
  contacts: Contact[];
  onAddContact: (contact: Omit<Contact, 'id'>) => void;
  onDeleteContact: (id: string) => void;
  onCallContact: (phone: string, name: string) => void;
}

export const ContactsPanel: React.FC<ContactsPanelProps> = ({
  contacts,
  onAddContact,
  onDeleteContact,
  onCallContact,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    onAddContact({
      name: name.trim(),
      phone: phone.trim(),
      relationship: relationship.trim() || 'Contact',
    });

    setName('');
    setPhone('');
    setRelationship('');
    setShowAddModal(false);
    playJarvisSound('execute');
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white tracking-wide">Phone Contacts & Speed Dial</h2>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            Say "Call [Name]" or "WhatsApp [Name]" to execute instantly.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-gray-950 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-cyan-950"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Contact</span>
        </button>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <form onSubmit={handleSubmit} className="bg-gray-900 border border-cyan-500/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-white">Register New Phone Contact</h3>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="text-xs text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">Name / Nickname</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Papa, Rohit"
                className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">Relation / Label</label>
              <input
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="e.g. Family, Work, Friend"
                className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-1">Phone Number (with country code if needed)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+919876543210"
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 text-xs font-semibold rounded-xl"
            >
              Save to Jarvis Phone Book
            </button>
          </div>
        </form>
      )}

      {/* Contacts Grid / List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {contacts.map((c) => (
          <div
            key={c.id}
            className="p-3 bg-gray-900/60 border border-gray-800/80 hover:border-cyan-500/40 rounded-xl flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-300 text-sm">
                {c.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">{c.name}</h4>
                <div className="flex items-center gap-2 text-xs text-gray-400 font-mono mt-0.5">
                  <span>{c.relationship}</span>
                  <span aria-hidden="true">·</span>
                  <span>{c.phone}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onCallContact(c.phone, c.name)}
                aria-label={`Call ${c.name}`}
                className="p-2 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm"
              >
                <PhoneCall className="w-4 h-4" />
              </button>
              <button
                onClick={() => triggerWhatsAppMessage(c.phone, `Hello ${c.name}`)}
                aria-label={`WhatsApp ${c.name}`}
                className="p-2 bg-emerald-700/60 hover:bg-emerald-600 text-white rounded-lg transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteContact(c.id)}
                aria-label={`Delete ${c.name}`}
                className="p-2 text-gray-500 hover:text-rose-400 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
