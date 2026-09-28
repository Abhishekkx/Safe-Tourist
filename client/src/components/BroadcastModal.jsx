import React, { useState } from 'react';
import { Radio, AlertOctagon, Send, X } from 'lucide-react';
import { socket } from '../utils/socket';

export default function BroadcastModal({ isOpen, onClose }) {
  const [title, setTitle] = useState('SEVERE WEATHER / SAFETY WARNING');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('HIGH');
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const handleBroadcast = (e) => {
    e.preventDefault();
    const payload = {
      title,
      message,
      severity,
      broadcastTime: new Date().toLocaleTimeString(),
    };

    socket.emit('BROADCAST_SAFETY_ALERT', payload);
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-red-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            <h3 className="font-extrabold text-lg text-white">Broadcast Emergency Safety Alert</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        {sentSuccess ? (
          <div className="py-6 text-center space-y-2">
            <AlertOctagon className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-lg font-bold text-white">Alert Broadcasted to All Active Tourist Devices!</h4>
          </div>
        ) : (
          <form onSubmit={handleBroadcast} className="space-y-4">
            
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Broadcast Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                required
              />
            </div>

            {/* Severity Level */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Severity Level</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500"
              >
                <option value="CRITICAL">CRITICAL (Immediate Shelter / Evacuation)</option>
                <option value="HIGH">HIGH (Severe Weather / Caution)</option>
                <option value="INFO">INFORMATIONAL (Road Closure / Event)</option>
              </select>
            </div>

            {/* Warning Message */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Alert Message</label>
              <textarea
                rows="3"
                placeholder="Enter alert instruction for tourists in the zone..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-red-500"
                required
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30"
              >
                <Send className="w-3.5 h-3.5" />
                Transmit Alert Broadcast
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
