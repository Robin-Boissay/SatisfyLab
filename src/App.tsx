import React, { useState, useEffect, useRef } from 'react';
import { GAMES_REGISTRY, getGameById } from './core/registry';
import { GameHUDState, GameInstance } from './core/types';
import { GameViewport } from './components/GameViewport';
import { SettingsPanel } from './components/SettingsPanel';
import { LeftSettingsPanel } from './components/LeftSettingsPanel';
import { RightSettingsPanel } from './components/RightSettingsPanel';
import { PresetModal } from './components/PresetModal';
import { HubHome } from './components/HubHome';
import { sound } from './core/SoundEngine';
import { useVideoRecorder } from './core/useVideoRecorder';
import { useLanguage, Language } from './core/i18n';
import { LanguageToggle } from './components/LanguageToggle';
import { ArrowLeft, Sparkles, SlidersHorizontal, PanelLeftOpen, PanelRightOpen, Bookmark, Zap, Square } from 'lucide-react';
import { CUSTOM_SHAPE_PRESETS, CustomShapePreset } from './games/merge-drop/types';
import { BatchSimulatorModal } from './components/BatchSimulatorModal';
import { SimulationTelemetry } from './games/merge-drop/simulation/types';

export const App: React.FC = () => {
  const { language, t, getGameMeta, getDefaultTexts } = useLanguage();

  // Vue active : 'hub' (page d'accueil catalogue) ou 'game' (vue du jeu)
  const [currentView, setCurrentView] = useState<'hub' | 'game'>('hub');
  const [activeGameId, setActiveGameId] = useState<string>('ball-escape');
  const [gameConfigs, setGameConfigs] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    GAMES_REGISTRY.forEach((g) => {
      initial[g.id] = { ...g.defaultConfig };
    });
    return initial;
  });

  const [hudState, setHudState] = useState<GameHUDState>({});
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState<boolean>(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [activeReplay, setActiveReplay] = useState<SimulationTelemetry | null>(null);

  const handlePlayReplay = (telemetry: SimulationTelemetry) => {
    setActiveReplay(telemetry);
    if (gameInstanceRef.current && (gameInstanceRef.current as any).startReplay) {
      (gameInstanceRef.current as any).startReplay(telemetry, () => {
        setActiveReplay(null);
      });
    }
  };

  const handleStopReplay = () => {
    if (gameInstanceRef.current && (gameInstanceRef.current as any).stopReplay) {
      (gameInstanceRef.current as any).stopReplay();
    }
    setActiveReplay(null);
  };

  // État de réduction des panneaux latéraux (persistant via localStorage)
  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('satisfylab_left_panel_collapsed') === 'true';
  });
  const [isRightCollapsed, setIsRightCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('satisfylab_right_panel_collapsed') === 'true';
  });

  const handleToggleLeftPanel = () => {
    setIsLeftCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('satisfylab_left_panel_collapsed', String(next));
      return next;
    });
  };

  const handleToggleRightPanel = () => {
    setIsRightCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('satisfylab_right_panel_collapsed', String(next));
      return next;
    });
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameInstanceRef = useRef<GameInstance | null>(null);

  const {
    isRecording,
    formattedDuration,
    toggleRecording,
    stopRecording,
    notification,
    pendingRecording,
    isConverting,
    downloadWebM,
    convertToMp4,
    dismissExport
  } = useVideoRecorder();

  const activeGame = getGameById(activeGameId) || GAMES_REGISTRY[0];
  const activeConfig = gameConfigs[activeGameId] || activeGame.defaultConfig;

  // Mise à jour automatique des textes par défaut des jeux lors du changement de langue
  const prevLangRef = useRef<Language>(language);
  useEffect(() => {
    const prevLang = prevLangRef.current;
    if (prevLang !== language) {
      prevLangRef.current = language;

      setGameConfigs((prevConfigs) => {
        const nextConfigs = { ...prevConfigs };
        GAMES_REGISTRY.forEach((g) => {
          const prevDefaults = getDefaultTexts(g.id, prevLang);
          const newDefaults = getDefaultTexts(g.id, language);
          const currentConfig = { ...nextConfigs[g.id] };

          // Si le texte correspondait au défaut de la langue précédente, le traduire vers la nouvelle langue
          Object.keys(newDefaults).forEach((textKey) => {
            if (!currentConfig[textKey] || currentConfig[textKey] === prevDefaults[textKey]) {
              currentConfig[textKey] = newDefaults[textKey];
            }
          });

          nextConfigs[g.id] = currentConfig;
        });

        // Si une instance de jeu est en cours, la synchroniser en direct
        if (gameInstanceRef.current && nextConfigs[activeGameId]) {
          gameInstanceRef.current.updateConfig(nextConfigs[activeGameId]);
        }

        return nextConfigs;
      });
    }
  }, [language, activeGameId, getDefaultTexts]);

  // Lancement d'un jeu depuis le Hub
  const handleLaunchGame = (gameId: string) => {
    if (isRecording) {
      stopRecording();
    }
    setActiveGameId(gameId);
    setCurrentView('game');
  };

  const handleBackToHub = () => {
    if (isRecording) {
      stopRecording();
    }
    setCurrentView('hub');
  };

  // Initialisation et changement de jeu
  useEffect(() => {
    if (currentView !== 'game' || !canvasRef.current) return;

    // Détruire l'ancienne instance si elle existe
    if (gameInstanceRef.current) {
      gameInstanceRef.current.destroy();
      gameInstanceRef.current = null;
    }

    // Créer la nouvelle instance de jeu
    const instance = activeGame.createGame(
      canvasRef.current,
      activeConfig,
      (hud) => setHudState(hud)
    );
    gameInstanceRef.current = instance;

    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy();
        gameInstanceRef.current = null;
      }
    };
  }, [activeGameId, currentView]);

  // Mise à jour de config en temps réel (sans rechargement, 60 FPS immédiat)
  const handleConfigChange = (key: string, value: any) => {
    let updated = {
      ...activeConfig,
      [key]: value
    };

    // Si l'utilisateur choisit un preset de conteneur, appliquer toutes ses dimensions
    if (key === 'CUSTOM_PRESET' && CUSTOM_SHAPE_PRESETS[value as CustomShapePreset]) {
      updated = {
        ...updated,
        ...CUSTOM_SHAPE_PRESETS[value as CustomShapePreset],
        CONTAINER_SHAPE: 'custom' // Bascule automatique sur la forme sur-mesure
      };
    } else if (key.startsWith('CUSTOM_') && activeConfig.CONTAINER_SHAPE !== 'custom') {
      updated.CONTAINER_SHAPE = 'custom';
    }

    setGameConfigs((prev) => ({
      ...prev,
      [activeGameId]: updated
    }));

    if (gameInstanceRef.current) {
      gameInstanceRef.current.updateConfig(updated);
    }
  };

  const handleResetConfig = () => {
    const defaults = { ...activeGame.defaultConfig };
    setGameConfigs((prev) => ({
      ...prev,
      [activeGameId]: defaults
    }));
    if (gameInstanceRef.current) {
      gameInstanceRef.current.updateConfig(defaults);
      gameInstanceRef.current.reset();
    }
  };

  const handleApplyPreset = (importedConfig: Record<string, any>) => {
    const updated = {
      ...activeConfig,
      ...importedConfig
    };
    setGameConfigs((prev) => ({
      ...prev,
      [activeGameId]: updated
    }));
    if (gameInstanceRef.current) {
      gameInstanceRef.current.updateConfig(updated);
    }
  };

  const handleResetGame = () => {
    if (gameInstanceRef.current) {
      sound.init();
      gameInstanceRef.current.reset();
    }
  };

  const handleToggleMute = () => {
    sound.init();
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Raccourcis clavier globaux (uniquement quand en jeu)
  useEffect(() => {
    if (currentView !== 'game') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Escape' && activeReplay) {
        e.preventDefault();
        handleStopReplay();
        return;
      }
      if (e.code === 'KeyR') {
        if (activeReplay) {
          handleStopReplay();
        } else {
          handleResetGame();
        }
      } else if (e.code === 'KeyM') {
        handleToggleMute();
      } else if (e.code === 'KeyV') {
        e.preventDefault();
        toggleRecording(canvasRef.current, activeGameId);
      } else if (e.code === 'KeyA') {
        if (gameInstanceRef.current?.triggerExtraAction) {
          gameInstanceRef.current.triggerExtraAction();
        }
      } else if (e.code === 'Space') {
        sound.init();
        if (gameInstanceRef.current) {
          gameInstanceRef.current.start();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeGameId, currentView, toggleRecording, activeReplay]);

  // 1. PAGE D'ACCUEIL DU SITE : LE HUB
  if (currentView === 'hub') {
    return (
      <>
        <LanguageToggle />
        <HubHome onSelectGame={handleLaunchGame} />
      </>
    );
  }

  // 2. PAGE DE JEU EN COURS (LAYOUT PC : GAUCHE + VIEWPORT 9:16 AU CENTRE + DROITE)
  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen overflow-hidden bg-[#080a0f] text-slate-100 select-none">
      <LanguageToggle />

      {/* Panneau GAUCHE (Desktop) : Visuels, Formes du Conteneur & Textes */}
      <LeftSettingsPanel
        activeGame={activeGame}
        activeGameId={activeGameId}
        config={activeConfig}
        onSelectGame={(id) => {
          if (isRecording) {
            stopRecording();
          }
          setActiveGameId(id);
        }}
        onBackToHub={handleBackToHub}
        onConfigChange={handleConfigChange}
        onResetConfig={handleResetConfig}
        onOpenPresets={() => setIsPresetModalOpen(true)}
        isCollapsed={isLeftCollapsed}
        onToggleCollapse={handleToggleLeftPanel}
      />

      {/* Zone Principale de Jeu (Centrée avec vue 9:16) */}
      <main className="flex-1 flex flex-col items-center justify-between p-2 sm:p-3 lg:p-4 min-w-0 h-full overflow-hidden">
        {/* Barre supérieure rapide de navigation */}
        <div className="w-full max-w-[500px] flex items-center justify-between pb-1.5 text-xs font-mono pr-28 lg:pr-0">
          <button
            onClick={handleBackToHub}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-800 transition-all group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>{t('app.hub_home')}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPresetModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all shadow-sm"
            title={t('settings.presets_tooltip')}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{t('settings.presets')}</span>
          </button>

          {activeGameId === 'merge-drop' && (
            <button
              type="button"
              onClick={() => setIsBatchModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-fuchsia-950/80 to-cyan-950/80 hover:from-fuchsia-900 hover:to-cyan-900 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-bold transition-all shadow-md active:scale-95 group"
              title={language === 'fr' ? 'Simulateur Batch IA & Export Vidéo 60 FPS' : 'AI Batch Simulator & 60 FPS Export'}
            >
              <Zap className="w-3.5 h-3.5 text-fuchsia-400 group-hover:animate-pulse" />
              <span>{language === 'fr' ? 'Simulateur IA & Export 60FPS' : 'AI Batch & 60FPS'}</span>
            </button>
          )}

          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[11px] font-bold text-slate-200 tracking-wider uppercase truncate max-w-[150px] sm:max-w-none">
              {getGameMeta(activeGame.id).name || activeGame.name}
            </span>
          </div>

          {/* Raccourcis pour rouvrir rapidement les panneaux sur desktop s'ils sont réduits */}
          <div className="hidden lg:flex items-center gap-1.5">
            {isLeftCollapsed && (
              <button
                type="button"
                onClick={handleToggleLeftPanel}
                className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-all shadow-sm"
                title={language === 'fr' ? 'Afficher les visuels (Gauche)' : 'Show visuals (Left)'}
              >
                <PanelLeftOpen className="w-3.5 h-3.5" />
                <span>{language === 'fr' ? 'Visuels' : 'Visuals'}</span>
              </button>
            )}
            {isRightCollapsed && (
              <button
                type="button"
                onClick={handleToggleRightPanel}
                className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-all shadow-sm"
                title={language === 'fr' ? 'Afficher le moteur & gameplay (Droite)' : 'Show engine & gameplay (Right)'}
              >
                <PanelRightOpen className="w-3.5 h-3.5" />
                <span>{language === 'fr' ? 'Moteur' : 'Engine'}</span>
              </button>
            )}
          </div>

          <button
            onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
            className="lg:hidden p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400"
            title={t('app.settings')}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Barre flottante d'état et d'arrêt du Replay */}
        {activeReplay && (
          <div className="w-full max-w-[500px] mb-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-950/95 via-slate-900/95 to-cyan-950/90 border border-rose-500/60 backdrop-blur-md shadow-xl shadow-rose-950/40 flex items-center justify-between gap-3 animate-fadeIn flex-shrink-0 z-30">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-extrabold text-white">
                  <span>{language === 'fr' ? 'Visionnage Simulation' : 'Watching Simulation'}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-rose-300 border border-rose-500/30">
                    Seed #{activeReplay.seed}
                  </span>
                </div>
                <div className="text-[10px] text-slate-300 truncate">
                  Score Viral: <b className="text-cyan-400">{activeReplay.viralScore}/100</b> • Max Combo: <b className="text-orange-400">x{activeReplay.maxCombo}</b>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleStopReplay();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex-shrink-0 cursor-pointer"
              title={language === 'fr' ? 'Arrêter le visionnage et reprendre la partie (Échap)' : 'Stop replay and return to game (Esc)'}
            >
              <Square className="w-3 h-3 fill-current" />
              <span>{language === 'fr' ? 'Quitter le visionnage' : 'Exit Replay'}</span>
            </button>
          </div>
        )}

        {/* Viewport 9:16 du jeu */}
        <div className="flex-1 flex items-center justify-center w-full min-h-0">
          <GameViewport
            gameInstance={gameInstanceRef.current}
            hudState={hudState}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onReset={handleResetGame}
            canvasRef={canvasRef}
            isRecording={isRecording}
            recordingDuration={formattedDuration}
            onToggleRecord={() => toggleRecording(canvasRef.current, activeGameId)}
            notification={notification}
            pendingRecording={pendingRecording}
            isConverting={isConverting}
            onDownloadWebM={downloadWebM}
            onConvertToMp4={convertToMp4}
            onDismissExport={dismissExport}
          />
        </div>
      </main>

      {/* Panneau DROIT (Desktop) : Moteur Physique, Gameplay & Commandes rapides */}
      <RightSettingsPanel
        activeGame={activeGame}
        config={activeConfig}
        onConfigChange={handleConfigChange}
        onResetConfig={handleResetConfig}
        onResetGame={handleResetGame}
        onOpenPresets={() => setIsPresetModalOpen(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isRecording={isRecording}
        recordingDuration={formattedDuration}
        onToggleRecord={() => toggleRecording(canvasRef.current, activeGameId)}
        isCollapsed={isRightCollapsed}
        onToggleCollapse={handleToggleRightPanel}
      />

      {/* Tiroir Mobile (Écrans < lg) : Tous les réglages en un seul tiroir */}
      <SettingsPanel
        activeGame={activeGame}
        activeGameId={activeGameId}
        config={activeConfig}
        onSelectGame={(id) => {
          if (isRecording) {
            stopRecording();
          }
          setActiveGameId(id);
        }}
        onBackToHub={handleBackToHub}
        onConfigChange={handleConfigChange}
        onResetConfig={handleResetConfig}
        onOpenPresets={() => setIsPresetModalOpen(true)}
        isOpenMobile={isMobileDrawerOpen}
        onToggleMobile={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
      />

      {/* Modale d'exportation et d'importation de presets */}
      <PresetModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        gameId={activeGameId}
        gameName={getGameMeta(activeGame.id).name || activeGame.name}
        currentConfig={activeConfig}
        onApplyPreset={handleApplyPreset}
      />

      {/* Modale Simulateur Batch IA & Export Vidéo 60 FPS */}
      <BatchSimulatorModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        config={activeConfig}
        onPlayReplay={handlePlayReplay}
        language={language}
      />
    </div>
  );
};

export default App;
