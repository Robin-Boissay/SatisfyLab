import React from 'react';
import { GameModule } from '../core/types';
import { GAMES_REGISTRY } from '../core/registry';
import { DynamicControls } from './DynamicControls';
import { useLanguage } from '../core/i18n';
import {
  ArrowLeft,
  ChevronDown,
  Eye,
  Type,
  Volume2,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
  Bookmark
} from 'lucide-react';

interface LeftSettingsPanelProps {
  activeGame: GameModule<any>;
  activeGameId: string;
  config: Record<string, any>;
  onSelectGame: (id: string) => void;
  onBackToHub: () => void;
  onConfigChange: (key: string, value: any) => void;
  onResetConfig: () => void;
  onOpenPresets?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const LeftSettingsPanel: React.FC<LeftSettingsPanelProps> = ({
  activeGame,
  activeGameId,
  config,
  onSelectGame,
  onBackToHub,
  onConfigChange,
  onResetConfig,
  onOpenPresets,
  isCollapsed,
  onToggleCollapse
}) => {
  const { t, getGameMeta, language } = useLanguage();
  const currentMeta = getGameMeta(activeGame.id);

  if (isCollapsed) {
    return (
      <aside className="hidden lg:flex flex-col items-center py-4 w-14 flex-shrink-0 bg-slate-950/80 border-r border-slate-800/80 backdrop-blur-md transition-all select-none justify-between">
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            title={language === 'fr' ? 'Ouvrir les réglages visuels (Gauche)' : 'Open visual settings (Left)'}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 hover:text-cyan-300 transition-all shadow-md group"
          >
            <PanelLeftOpen className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>

          <button
            type="button"
            onClick={onBackToHub}
            title={t('settings.back_to_hub')}
            className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Badge vertical orienté */}
        <div className="flex flex-col items-center gap-2 py-6">
          <Palette className="w-4 h-4 text-cyan-400/80" />
          <div className="text-[10px] font-bold font-mono tracking-widest uppercase text-slate-500 [writing-mode:vertical-lr] rotate-180">
            {language === 'fr' ? 'VISUELS & TEXTES' : 'VISUALS & TEXTS'}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Eye className="w-3.5 h-3.5" />
          <Volume2 className="w-3.5 h-3.5" />
          <Type className="w-3.5 h-3.5" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden lg:flex flex-col w-80 xl:w-[380px] 2xl:w-[420px] flex-shrink-0 bg-slate-950/80 border-r border-slate-800/80 backdrop-blur-md transition-all select-none h-full overflow-hidden">
      {/* Entête du panneau gauche */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={onBackToHub}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800/90 text-slate-300 hover:text-cyan-400 border border-slate-800 transition-all text-xs font-bold font-mono group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>{t('settings.back_to_hub')}</span>
        </button>

        <div className="flex items-center gap-1.5">
          {onOpenPresets && (
            <button
              type="button"
              onClick={onOpenPresets}
              title={t('settings.presets_tooltip')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold transition-all shadow-sm"
            >
              <Bookmark className="w-3 h-3" />
              <span>{t('settings.presets')}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleCollapse}
            title={language === 'fr' ? 'Réduire le panneau gauche' : 'Collapse left panel'}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-800 transition-all"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contenu déroulant */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
        {/* Sélecteur de jeu rapide */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              {t('settings.current_game')}
            </label>
            <span className="text-[10px] font-mono text-slate-500">
              {GAMES_REGISTRY.length} {language === 'fr' ? 'jeux' : 'games'}
            </span>
          </div>

          <div className="relative">
            <select
              value={activeGameId}
              onChange={(e) => onSelectGame(e.target.value)}
              className="w-full appearance-none px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-cyan-400 cursor-pointer pr-8 hover:border-slate-600 transition-colors"
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

        {/* Fiche descriptive du jeu */}
        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-1">
          <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wide">
            {currentMeta.name || activeGame.name}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {currentMeta.shortDescription || activeGame.shortDescription}
          </p>
        </div>

        {/* Titre du bloc de réglages */}
        <div className="flex items-center gap-2 pt-1 pb-0.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-neon-cyan" />
          <h2 className="text-xs font-black tracking-wider uppercase text-slate-200">
            {language === 'fr' ? '🎨 Visuels, Décor & Textes' : '🎨 Visuals, Design & Texts'}
          </h2>
        </div>

        {/* Contrôles dynamiques : Visuels, Audio & Textes */}
        <DynamicControls
          schema={activeGame.configSchema}
          values={config}
          defaultValues={activeGame.defaultConfig}
          onChange={onConfigChange}
          onReset={onResetConfig}
          allowedCategories={['visuals', 'audio', 'texts']}
          defaultTab="all"
          showReset={false}
        />

        {activeGameId === 'merge-drop' && (
          <div className="pt-2">
            <a
              href="/theme-studio.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 via-sky-500/15 to-fuchsia-500/20 border border-cyan-500/40 text-cyan-200 hover:text-white hover:border-cyan-300 text-xs font-bold transition-all shadow-md group"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm group-hover:scale-110 transition-transform">✂️</span>
                <span>{language === 'fr' ? 'Studio de Découpe IA' : 'AI Theme Studio'}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/30 text-cyan-200 font-mono">
                10 Paliers
              </span>
            </a>
          </div>
        )}
      </div>
    </aside>
  );
};

