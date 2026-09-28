import React, { useState } from 'react';
import {
  Phone,
  PhoneCall,
  Shield,
  HeartPulse,
  Sparkles,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertOctagon,
  Radio
} from 'lucide-react';

export default function EmergencySidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(null);

  const emergencyContacts = [
    {
      title: 'National Emergency',
      shortTitle: '112 Unified',
      desc: 'Police, Fire, Ambulance',
      number: '112',
      badge: 'Unified',
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
      pillBg: 'bg-red-500 text-white hover:bg-red-600',
      btnBg: 'bg-red-600 hover:bg-red-700 text-white',
    },
    {
      title: 'Tourist Helpline',
      shortTitle: '1363 Tourist Desk',
      desc: '24/7 Multi-lingual Desk',
      number: '1363',
      dialNumber: '1800-11-1363',
      badge: 'Tourist Desk',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      pillBg: 'bg-amber-500 text-white hover:bg-amber-600',
      btnBg: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    {
      title: 'Medical Ambulance',
      shortTitle: '102 Ambulance',
      desc: 'Rapid Trauma Unit',
      number: '102',
      badge: 'Medical',
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
      pillBg: 'bg-blue-600 text-white hover:bg-blue-700',
      btnBg: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    {
      title: 'Women Safety',
      shortTitle: '1091 Women Safety',
      desc: 'Immediate Protection',
      number: '1091',
      badge: 'Safety',
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
      pillBg: 'bg-rose-600 text-white hover:bg-rose-700',
      btnBg: 'bg-rose-600 hover:bg-rose-700 text-white',
    },
    {
      title: 'Disaster Response',
      shortTitle: '1070 Disaster',
      desc: 'Natural Hazard Helpline',
      number: '1070',
      badge: 'Disaster',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      pillBg: 'bg-emerald-600 text-white hover:bg-emerald-700',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
  ];

  const handleCopy = (num) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* MOBILE PHONE VIEW: HORIZONTAL MOVING STRIP ATTACHED AT TOP                */}
      {/* ========================================================================= */}
      <div className="block lg:hidden w-full mb-1">
        <div className="panel-card rounded-xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm overflow-hidden relative">
          <div className="flex items-center gap-2">
            
            {/* Left Fixed Label */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600 text-white shrink-0 shadow-sm z-10">
              <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
              <span className="text-[10px] font-black tracking-wider uppercase">Hotlines</span>
            </div>

            {/* Moving / Scrollable Strip */}
            <div className="flex-1 overflow-hidden relative group">
              <div className="animate-ticker flex items-center gap-2 py-0.5">
                {/* Double the list for seamless marquee loop */}
                {[...emergencyContacts, ...emergencyContacts].map((contact, idx) => (
                  <a
                    key={`${contact.number}-${idx}`}
                    href={`tel:${contact.dialNumber || contact.number}`}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold shadow-xs whitespace-nowrap transition-all ${contact.pillBg}`}
                    title={`Tap to call ${contact.title}: ${contact.number}`}
                  >
                    <Phone className="w-3 h-3" />
                    <span>{contact.shortTitle}</span>
                  </a>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP VIEW: LEFT VERTICAL EMERGENCY SIDEBAR                             */}
      {/* ========================================================================= */}
      <aside
        className={`hidden lg:flex transition-all duration-300 panel-card rounded-xl border flex-col shrink-0 ${
          isCollapsed ? 'w-14 items-center p-2' : 'w-64 p-4'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-3 w-full">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-red-600 dark:text-red-500" />
              <div>
                <h3 className="font-extrabold text-xs tracking-tight">Direct Hotlines</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">1-Tap Emergency Dials</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
            title={isCollapsed ? 'Expand Hotlines' : 'Collapse Hotlines'}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Emergency Contacts Vertical Strip */}
        <div className="space-y-2.5 w-full">
          {emergencyContacts.map((contact) => (
            <div
              key={contact.number}
              className={`rounded-lg border transition-all ${contact.bg} ${isCollapsed ? 'p-2 text-center' : 'p-2.5'}`}
            >
              {isCollapsed ? (
                <a
                  href={`tel:${contact.dialNumber || contact.number}`}
                  className="flex flex-col items-center justify-center text-slate-700 dark:text-slate-300 hover:text-red-500"
                  title={`${contact.title}: ${contact.dialNumber || contact.number}`}
                >
                  <Phone className="w-4 h-4 mb-1" />
                  <span className="font-mono font-extrabold text-[10px]">{contact.number}</span>
                </a>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                      {contact.badge}
                    </span>
                    <button
                      onClick={() => handleCopy(contact.dialNumber || contact.number)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-[10px]"
                      title="Copy Hotline Number"
                    >
                      {copiedNumber === (contact.dialNumber || contact.number) ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">{contact.title}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{contact.desc}</p>
                  </div>

                  <a
                    href={`tel:${contact.dialNumber || contact.number}`}
                    className={`w-full py-1 px-2 rounded-md font-bold text-xs flex items-center justify-between shadow-sm transition-all ${contact.btnBg}`}
                  >
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      Dial Hotline
                    </span>
                    <span className="font-mono text-xs">{contact.number}</span>
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>

        {!isCollapsed && (
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 text-center">
            Location data automatically transmitted on active emergency calls.
          </div>
        )}
      </aside>
    </>
  );
}

