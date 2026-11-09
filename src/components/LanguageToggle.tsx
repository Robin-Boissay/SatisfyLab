import React from 'react';
import { useLanguage } from '../core/i18n';
import { Globe } from 'lucide-react';

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className="fixed top-3.5 right-3 sm:right-5 z-50 flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-full p-0.5 shadow-2xl select-none"
      title={language === 'fr' ? 'Changer de langue (Switch to English)' : 'Switch language (Passer en Français)'}
    >
      <div className="pl-2 pr-1 text-slate-400 flex items-center">
        <Globe className="w-3.5 h-3.5 text-cyan-400" />
      </div>

      <button
        type="button"
        onClick={() => setLanguage('fr')}
        className={`px-2.5 py-1 rounded-full text-[11px] font-black font-mono tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
          language === 'fr'
            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-neon-cyan'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
        }`}
      >
        <span>FR</span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 rounded-full text-[11px] font-black font-mono tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
          language === 'en'
            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-neon-cyan'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
        }`}
      >
        <span>EN</span>
      </button>
    </div>
  );
};

