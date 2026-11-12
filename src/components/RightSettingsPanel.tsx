import React from 'react';
import { GameModule } from '../core/types';
import { DynamicControls } from './DynamicControls';
import { useLanguage } from '../core/i18n';
import {
  RotateCcw,
  Sliders,
  Activity,
  PanelRightClose,
  PanelRightOpen,
  Volume2,
  VolumeX,
  Video,
  PlayCircle,
  Zap,
  Bookmark
} from 'lucide-react';

interface RightSettingsPanelProps {
  activeGame: GameModule<any>;
  config: Record<string, any>;
  onConfigChange: (key: string, value: any) => void;
  onResetConfig: () => void;
  onResetGame: () => void;
  onOpenPresets?: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isRecording: boolean;
  recordingDuration: string;
  onToggleRecord: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const RightSettingsPanel: React.FC<RightSettingsPanelProps> = ({
  activeGame,
  config,
  onConfigChange,
  onResetConfig,
  onResetGame,
  onOpenPresets,
  isMuted,
  onToggleMute,
  isRecording,
  recordingDuration,
  onToggleRecord,
  isCollapsed,
  onToggleCollapse
}) => {
  const { t, language } = useLanguage();

  if (isCollapsed) {
    return (
      <aside className="hidden lg:flex flex-col items-center py-4 w-14 flex-shrink-0 bg-slate-950/80 border-l border-slate-800/80 backdrop-blur-md transition-all select-none justify-between">
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            title={language === 'fr' ? 'Ouvrir les réglages moteur & gameplay (Droite)' : 'Open engine & gameplay settings (Right)'}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 hover:text-cyan-300 transition-all shadow-md group"
          >
            <PanelRightOpen className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>

          {onOpenPresets && (
            <button
              type="button"
              onClick={onOpenPresets}
              title={t('settings.presets_tooltip')}
              className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 text-cyan-400 hover:text-cyan-300 transition-all shadow-sm"
            >
              <Bookmark className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onResetGame}
            title={language === 'fr' ? 'Recommencer la partie (R)' : 'Restart game (R)'}
            className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 text-slate-400 hover:text-cyan-400 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Badge vertical orienté */}
        <div className="flex flex-col items-center gap-2 py-6">
          <Zap className="w-4 h-4 text-cyan-400/80" />
          <div className="text-[10px] font-bold font-mono tracking-widest uppercase text-slate-500 [writing-mode:vertical-lr] rotate-180">
            {language === 'fr' ? 'GAMEPLAY & MOTEUR' : 'GAMEPLAY & ENGINE'}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Sliders className="w-3.5 h-3.5" />
          <Activity className="w-3.5 h-3.5" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden lg:flex flex-col w-80 xl:w-[380px] 2xl:w-[420px] flex-shrink-0 bg-slate-950/80 border-l border-slate-800/80 backdrop-blur-md transition-all select-none h-full overflow-hidden">
      {/* Entête du panneau droit */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleCollapse}
            title={language === 'fr' ? 'Réduire le panneau droit' : 'Collapse right panel'}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-800 transition-all"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 text-xs font-black tracking-wider uppercase text-slate-200">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>{language === 'fr' ? 'Moteur & Gameplay' : 'Engine & Gameplay'}</span>
          </div>
        </div>

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
            onClick={onResetConfig}
            title={t('settings.reset_all')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-800 text-[11px] font-semibold transition-all"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden xl:inline">{language === 'fr' ? 'Défaut' : 'Reset'}</span>
          </button>
        </div>
      </div>

      {/* Contenu déroulant */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
        {/* Barre de commandes rapides du jeu */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <PlayCircle className="w-3.5 h-3.5 text-cyan-400" />
              {language === 'fr' ? 'Commandes Rapides' : 'Quick Actions'}
            </span>
            <span className="text-[10px] font-mono text-slate-500">60 FPS</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={onResetGame}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 hover:text-white transition-all text-center gap-1 group"
              title={language === 'fr' ? 'Recommencer la partie (Touche R)' : 'Restart game (R key)'}
            >
              <RotateCcw className="w-4 h-4 text-cyan-400 group-hover:rotate-180 transition-transform duration-500" />
              <span className="text-[10px] font-bold leading-none">{language === 'fr' ? 'Rejouer' : 'Restart'}</span>
              <span className="text-[9px] font-mono text-slate-500">[R]</span>
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center gap-1 ${
                isMuted
                  ? 'bg-rose-950/30 border-rose-800/60 text-rose-400'
                  : 'bg-slate-800/70 hover:bg-slate-700/80 border-slate-700/60 text-slate-200 hover:text-white'
              }`}
              title={language === 'fr' ? 'Couper / Activer le son (Touche M)' : 'Mute / Unmute sound (M key)'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              <span className="text-[10px] font-bold leading-none">
                {isMuted ? (language === 'fr' ? 'Muet' : 'Muted') : (language === 'fr' ? 'Son' : 'Sound')}
              </span>
              <span className="text-[9px] font-mono text-slate-500">[M]</span>
            </button>

            <button
              type="button"
              onClick={onToggleRecord}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center gap-1 ${
                isRecording
                  ? 'bg-rose-600/20 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                  : 'bg-slate-800/70 hover:bg-slate-700/80 border-slate-700/60 text-slate-200 hover:text-white'
              }`}
              title={language === 'fr' ? 'Enregistrer vidéo Full HD (Touche V)' : 'Record Full HD video (V key)'}
            >
              <div className="relative">
                <Video className={`w-4 h-4 ${isRecording ? 'text-rose-400' : 'text-cyan-400'}`} />
                {isRecording && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 absolute -top-1 -right-1 animate-ping" />
                )}
              </div>
              <span className="text-[10px] font-bold leading-none">
                {isRecording ? recordingDuration : (language === 'fr' ? 'Rec HD' : 'Rec HD')}
              </span>
              <span className="text-[9px] font-mono text-slate-500">[V]</span>
            </button>
          </div>
        </div>

        {/* Titre du bloc de réglages */}
        <div className="flex items-center gap-2 pt-1 pb-0.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-neon-cyan" />
          <h2 className="text-xs font-black tracking-wider uppercase text-slate-200">
            {language === 'fr' ? '⚡ Moteur Physique & Règles' : '⚡ Physics Engine & Rules'}
          </h2>
        </div>

        {/* Contrôles dynamiques : Gameplay & Physique */}
        <DynamicControls
          schema={activeGame.configSchema}
          values={config}
          defaultValues={activeGame.defaultConfig}
          onChange={onConfigChange}
          onReset={onResetConfig}
          allowedCategories={['gameplay', 'physics']}
          defaultTab="all"
          showReset={false}
        />
      </div>
    </aside>
  );
};

