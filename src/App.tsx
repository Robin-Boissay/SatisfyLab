import React, { useState, useEffect, useRef } from 'react';
import { GAMES_REGISTRY, getGameById } from './core/registry';
import { GameHUDState, GameInstance } from './core/types';
import { GameViewport } from './components/GameViewport';
import { SettingsPanel } from './components/SettingsPanel';
import { HubHome } from './components/HubHome';
import { sound } from './core/SoundEngine';
import { useVideoRecorder } from './core/useVideoRecorder';
import { useLanguage, Language } from './core/i18n';
import { LanguageToggle } from './components/LanguageToggle';
import { ArrowLeft, Sparkles, SlidersHorizontal } from 'lucide-react';

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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameInstanceRef = useRef<GameInstance | null>(null);

  const {
    isRecording,
    formattedDuration,
    toggleRecording,
    stopRecording,
    notification
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
    const updated = {
      ...activeConfig,
      [key]: value
    };

    setGameConfigs((prev) => ({
      ...prev,
      [activeGameId]: updated
    }));

    if (gameInstanceRef.current) {
      gameInstanceRef.current.updateConfig({ [key]: value });
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
      if (e.code === 'KeyR') {
        handleResetGame();
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
  }, [activeGameId, currentView, toggleRecording]);

  // 1. PAGE D'ACCUEIL DU SITE : LE HUB
  if (currentView === 'hub') {
    return (
      <>
        <LanguageToggle />
        <HubHome onSelectGame={handleLaunchGame} />
      </>
    );
  }

  // 2. PAGE DE JEU EN COURS (VIEWPORT 9:16 + PARAMÈTRES)
  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen overflow-x-hidden bg-[#080a0f] text-slate-100">
      <LanguageToggle />

      {/* Zone Principale de Jeu (Centrée avec vue 9:16) */}
      <main className="flex-1 flex flex-col items-center justify-between p-2 sm:p-4 lg:p-5 overflow-hidden">
        {/* Barre supérieure rapide de navigation */}
        <div className="w-full max-w-[500px] flex items-center justify-between pb-2 text-xs font-mono pr-28 lg:pr-0">
          <button
            onClick={handleBackToHub}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-800 transition-all group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>{t('app.hub_home')}</span>
          </button>

          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[11px] font-bold text-slate-200 tracking-wider uppercase">
              {getGameMeta(activeGame.id).name || activeGame.name}
            </span>
          </div>

          <button
            onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
            className="lg:hidden p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400"
            title={t('app.settings')}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

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
          />
        </div>
      </main>

      {/* Panneau de Contrôles & Réglages */}
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
        isOpenMobile={isMobileDrawerOpen}
        onToggleMobile={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
      />
    </div>
  );
};

export default App;
