import React, { useRef, useEffect } from 'react';
import { GameHUDState, GameInstance } from '../core/types';
import { useLanguage } from '../core/i18n';
import { Volume2, VolumeX, RotateCcw, Maximize2, Play, Zap } from 'lucide-react';
import { sound } from '../core/SoundEngine';

interface GameViewportProps {
  gameInstance: GameInstance | null;
  hudState: GameHUDState;
  isMuted: boolean;
  onToggleMute: () => void;
  onReset: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isRecording?: boolean;
  recordingDuration?: string;
  onToggleRecord?: () => void;
  notification?: string | null;
}

export const GameViewport: React.FC<GameViewportProps> = ({
  gameInstance,
  hudState,
  isMuted,
  onToggleMute,
  onReset,
  canvasRef,
  isRecording = false,
  recordingDuration = '00:00',
  onToggleRecord,
  notification
}) => {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameInstance?.handlePointerDown) {
      gameInstance.handlePointerDown(e.nativeEvent, e.clientX, e.clientY);
    } else {
      gameInstance?.start();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameInstance?.handlePointerMove) {
      gameInstance.handlePointerMove(e.nativeEvent, e.clientX, e.clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameInstance?.handlePointerUp) {
      gameInstance.handlePointerUp(e.nativeEvent);
    }
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[500px] aspect-[9/16] max-h-[92vh] mx-auto rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-[#06080d] select-none touch-none flex flex-col justify-between"
    >
      {/* Floating REC 9:16 Live Indicator */}
      {isRecording && (
        <div className="absolute top-3 right-3 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 border border-red-500/70 shadow-[0_0_15px_rgba(239,68,68,0.4)] backdrop-blur text-red-400 font-mono text-xs font-bold pointer-events-none animate-pulse">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="tracking-wider">{t('viewport.rec_badge')}</span>
          <span className="text-white font-mono">{recordingDuration}</span>
        </div>
      )}

      {/* Quick Notification Toast */}
      {notification && (
        <div className="absolute top-16 inset-x-0 mx-auto w-max max-w-[85%] px-3.5 py-1.5 rounded-xl bg-slate-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-mono font-bold shadow-2xl backdrop-blur z-30 pointer-events-none text-center">
          {notification}
        </div>
      )}

      {/* The 60 FPS Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full h-full block cursor-pointer"
      />

      {/* Start / Action Prompt Overlay */}
      {(hudState.isWaitingToStart || (hudState.statusText && (hudState.statusText.includes('Clique') || hudState.statusText.includes('Click')))) && (
        <div
          onClick={() => gameInstance?.start()}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] cursor-pointer"
        >
          <div className="p-4 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 mb-3 shadow-neon-cyan animate-bounce">
            <Play className="w-8 h-8 fill-current ml-0.5" />
          </div>
          <p className="text-sm font-bold text-white tracking-widest uppercase text-center px-4">
            {hudState.overlayPromptText || hudState.statusText || t('viewport.click_to_play')}
          </p>
        </div>
      )}

      {/* Bottom Control Actions */}
      <div className="absolute bottom-3 inset-x-3 sm:inset-x-4 z-20 flex items-center justify-between pointer-events-auto gap-2">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={onReset}
            title={t('viewport.reset_title')}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-700/60 backdrop-blur transition-all flex-shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Bouton Enregistrement Vidéo 9:16 (REC) */}
          <button
            onClick={onToggleRecord}
            title={isRecording ? t('viewport.rec_active_title') : t('viewport.rec_idle_title')}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border backdrop-blur transition-all flex-shrink-0 ${
              isRecording
                ? 'bg-red-950/90 border-red-500 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-red-400 border-slate-700/60 hover:border-red-500/50'
            }`}
          >
            <span className="relative flex h-2.5 w-2.5">
              {isRecording && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isRecording ? 'bg-red-500' : 'bg-red-500'}`} />
            </span>
            <span className="tracking-wider">
              {isRecording ? recordingDuration : 'REC'}
            </span>
            <span className="text-[10px] text-slate-400 border border-slate-700/80 px-1 py-0.5 rounded font-mono font-normal">
              V
            </span>
          </button>
        </div>

        {/* Bouton Rafale Continue Niveau 1 (quand disponible) */}
        {hudState.extraActionLabel && (
          <button
            onClick={() => gameInstance?.triggerExtraAction?.()}
            className={`px-3 py-2 rounded-xl text-[11px] font-bold font-mono tracking-wider flex items-center gap-1.5 border backdrop-blur transition-all shadow-md ${
              hudState.extraActionActive
                ? 'bg-pink-950/80 border-[#ff007f] text-[#ff007f] shadow-neon-magenta animate-pulse'
                : 'bg-slate-900/90 hover:bg-slate-800/90 border-cyan-500/50 text-cyan-300 hover:border-cyan-400 hover:shadow-neon-cyan'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${hudState.extraActionActive ? 'fill-[#ff007f]' : 'text-cyan-400'}`} />
            <span>{hudState.extraActionLabel}</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={onToggleMute}
            title={t('viewport.mute_title')}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-700/60 backdrop-blur transition-all"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleFullscreen}
            title={t('viewport.fullscreen_title')}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-700/60 backdrop-blur transition-all"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
