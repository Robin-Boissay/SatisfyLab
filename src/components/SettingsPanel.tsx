import React from 'react';
import { GameModule } from '../core/types';
import { GAMES_REGISTRY } from '../core/registry';
import { DynamicControls } from './DynamicControls';
import { useLanguage } from '../core/i18n';
import {
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Grid
} from 'lucide-react';

interface SettingsPanelProps {
  activeGame: GameModule<any>;
  activeGameId: string;
  config: Record<string, any>;
  onSelectGame: (id: string) => void;
  onBackToHub: () => void;
  onConfigChange: (key: string, value: any) => void;
  onResetConfig: () => void;
  isOpenMobile: boolean;
  onToggleMobile: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  activeGame,
  activeGameId,
  config,
  onSelectGame,
  onBackToHub,
  onConfigChange,
  onResetConfig,
  isOpenMobile,
  onToggleMobile
}) => {
  const { t, getGameMeta } = useLanguage();
  const currentMeta = getGameMeta(activeGame.id);

  return (
    <aside className="w-full lg:w-96 flex-shrink-0 flex flex-col bg-slate-950/70 border-t lg:border-t-0 lg:border-l border-slate-800/80 backdrop-blur-md transition-all">
      {/* Mobile Drawer Header Toggle */}
      <div className="lg:hidden p-3 border-b border-slate-800 flex items-center justify-between gap-2">
        <button
          onClick={onBackToHub}
          className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-xs font-semibold text-cyan-400 flex items-center gap-1.5 flex-shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('app.hub_short')}</span>
        </button>

        <button
          onClick={onToggleMobile}
          className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/60 text-sm font-semibold text-slate-200"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <span>{t('app.settings')}</span>
          </div>
          {isOpenMobile ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Content Area (Always visible on desktop, toggleable on mobile) */}
      <div
        className={`${
          isOpenMobile ? 'block' : 'hidden lg:block'
        } p-4 space-y-5 overflow-y-auto max-h-[60vh] lg:max-h-[100vh]`}
      >
        {/* Header / Brand & Return to Hub */}
        <div className="hidden lg:flex items-center justify-between pb-3 border-b border-slate-800">
          <button
            onClick={onBackToHub}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800/90 text-slate-300 hover:text-cyan-400 border border-slate-800 transition-all text-xs font-bold font-mono group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>{t('settings.back_to_hub')}</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-cyan-400" />
            </div>
          </div>
        </div>

        {/* Compact Game Switcher Dropdown */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
              <Grid className="w-3 h-3 text-cyan-400" />
              {t('settings.current_game')}
            </label>
            <button
              onClick={onBackToHub}
              className="text-[10px] text-cyan-400 hover:underline font-mono"
            >
              {t('settings.view_all')} ({GAMES_REGISTRY.length})
            </button>
          </div>

          <div className="relative">
            <select
              value={activeGameId}
              onChange={(e) => onSelectGame(e.target.value)}
              className="w-full appearance-none px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-cyan-400 cursor-pointer pr-8"
            >
              {GAMES_REGISTRY.map((game) => (
                <option key={game.id} value={game.id} className="bg-slate-900 text-slate-100">
                  {getGameMeta(game.id).name || game.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Active Game Description Card */}
        <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-1">
          <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wide">
            {currentMeta.name || activeGame.name}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {currentMeta.shortDescription || activeGame.shortDescription}
          </p>
        </div>

        {/* Dynamic Controls generated from the Game Schema */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              {t('settings.title')}
            </h3>
            <span className="text-[10px] text-slate-500">{t('settings.subtitle')}</span>
          </div>

          <DynamicControls
            schema={activeGame.configSchema}
            values={config}
            defaultValues={activeGame.defaultConfig}
            onChange={onConfigChange}
            onReset={onResetConfig}
          />
        </div>
      </div>
    </aside>
  );
};
