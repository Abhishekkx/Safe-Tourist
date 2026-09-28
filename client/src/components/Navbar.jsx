import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldAlert,
  Radio,
  PhoneCall,
  Globe,
  ShieldCheck,
  Lock,
  UserCheck,
  Sun,
  Moon,
  ChevronDown,
  X,
  Phone,
  LogOut
} from 'lucide-react';

export default function Navbar({
  currentRole,
  setRole,
  adminToken,
  onLoginSubmit,
  onLogoutClick,
  theme,
  toggleTheme,
}) {
  const [lang, setLang] = useState('EN');
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);

  // Login Form States
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');

  const dropdownRef = useRef(null);

  // Close login dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowLoginDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    onLoginSubmit(username, password);
    setShowLoginDropdown(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 panel-card border-b px-2.5 sm:px-4 lg:px-8 py-2 w-full max-w-full overflow-x-hidden">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-1.5 sm:gap-4">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-600 text-white shadow-sm shrink-0">
              <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-xs sm:text-sm tracking-tight whitespace-nowrap">SafeTourist</h1>
              <span className="hidden xs:inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                Active
              </span>
            </div>
          </div>

          {/* Role Switcher & Controls */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            
            {/* Role Navigation Display / Switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 sm:p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] sm:text-xs font-semibold items-center">
              {adminToken ? (
                /* Authenticated Administrator Toggle */
                <>
                  <button
                    onClick={() => setRole('tourist')}
                    className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-md transition-all ${
                      currentRole === 'tourist'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Radio className="w-3 h-3 text-emerald-500" />
                    <span className="hidden sm:inline">Tourist View</span>
                    <span className="sm:hidden">Tourist</span>
                  </button>

                  <button
                    onClick={() => setRole('admin')}
                    className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-md transition-all ${
                      currentRole === 'admin'
                        ? 'bg-red-600 text-white shadow-sm font-bold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span className="hidden sm:inline">Command Center</span>
                    <span className="sm:hidden">Command</span>
                  </button>
                </>
              ) : (
                /* Unauthenticated Tourist View Badge */
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold text-[11px] sm:text-xs whitespace-nowrap">
                    <Radio className="w-3 h-3 text-red-500 animate-pulse" />
                    <span className="hidden sm:inline">Tourist Portal</span>
                    <span className="sm:hidden">Tourist</span>
                  </div>

                  <button
                    onClick={() => setShowLoginDropdown(true)}
                    className="flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-md text-slate-500 hover:text-red-500 dark:hover:text-red-400 text-[11px] font-medium transition-all"
                    title="Admin Login Required to Access Command Dashboard"
                  >
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span className="hidden md:inline">Command</span>
                  </button>
                </div>
              )}
            </div>

            {/* Hotline Drawer Trigger (Desktop/Tablet) */}
            <button
              onClick={() => setShowContactsModal(true)}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-500" />
              <span>Hotlines</span>
            </button>

            {/* Theme Switcher Toggle (Light vs Dark) */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-all shrink-0"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" />}
            </button>

            {/* Language Selector Dropdown (Desktop) */}
            <div className="relative hidden lg:flex items-center text-xs font-semibold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1">
              <Globe className="w-3.5 h-3.5 text-slate-400 mr-1" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="bg-transparent text-slate-700 dark:text-slate-200 outline-none cursor-pointer text-xs"
              >
                <option value="EN">EN</option>
                <option value="ES">ES</option>
                <option value="HI">HI</option>
                <option value="FR">FR</option>
              </select>
            </div>

            {/* Admin Login Dropdown Menu */}
            <div className="relative shrink-0" ref={dropdownRef}>
              {adminToken ? (
                <button
                  onClick={onLogoutClick}
                  className="flex items-center gap-1 text-[11px] sm:text-xs px-2 sm:px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-semibold"
                  title="Responder Active - Click to Logout"
                >
                  <UserCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Active</span>
                  <LogOut className="w-3 h-3 sm:ml-1" />
                </button>
              ) : (
                <button
                  onClick={() => setShowLoginDropdown(!showLoginDropdown)}
                  className="flex items-center gap-1 text-[11px] sm:text-xs px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 font-semibold transition-all"
                  title="Admin / Responder Login"
                >
                  <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-500" />
                  <span className="hidden sm:inline">Admin</span>
                  <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </button>
              )}

              {/* Login Dropdown Popover Menu */}
              {showLoginDropdown && !adminToken && (
                <div className="absolute right-0 mt-2 w-72 p-4 rounded-xl panel-card border shadow-xl z-50 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 mb-3">
                    <span className="font-extrabold text-xs">Responder Portal Login</span>
                    <button onClick={() => setShowLoginDropdown(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-2.5 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Username</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 outline-none focus:border-red-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 outline-none focus:border-red-500"
                        required
                      />
                    </div>

                    <div className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                      Demo: <strong className="text-red-500">admin</strong> / <strong className="text-red-500">admin123</strong>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-sm transition-all"
                    >
                      Sign In to Command Center
                    </button>
                  </form>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Emergency Hotlines Modal */}
      {showContactsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-red-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Emergency Direct Hotlines</h3>
              </div>
              <button onClick={() => setShowContactsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <a
                href="tel:112"
                className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/30 hover:bg-red-100 transition-all"
              >
                <div>
                  <p className="font-bold text-xs text-red-600 dark:text-red-400">National Emergency Unified Line</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Police, Ambulance & Fire</p>
                </div>
                <span className="font-mono font-extrabold text-base text-slate-900 dark:text-white">112</span>
              </a>

              <a
                href="tel:1363"
                className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 hover:bg-amber-100 transition-all"
              >
                <div>
                  <p className="font-bold text-xs text-amber-600 dark:text-amber-400">Tourist Safety & Information Desk</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Multi-lingual Assistance</p>
                </div>
                <span className="font-mono font-extrabold text-base text-slate-900 dark:text-white">1800-11-1363</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
