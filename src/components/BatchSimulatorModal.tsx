import React, { useState, useEffect } from 'react';
import { MergeDropConfig, ContainerShape, CUSTOM_SHAPE_PRESETS, CustomShapePreset } from '../games/merge-drop/types';
import { BatchSimulator } from '../games/merge-drop/simulation/BatchSimulator';
import { SimulationTelemetry } from '../games/merge-drop/simulation/types';
import { OfflineVideoExporter, ExportProgress } from '../games/merge-drop/simulation/OfflineVideoExporter';
import { getThemeDefinition, getTierLocalizedName } from '../games/merge-drop/themeRegistry';
import {
  Sparkles,
  Trophy,
  Play,
  Download,
  Flame,
  AlertTriangle,
  Clock,
  Video,
  X,
  Loader2,
  CheckCircle2,
  Zap,
  Film,
  Gauge,
  TrendingUp,
  Box,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const CONTAINER_OPTIONS: { id: ContainerShape; labelFr: string; labelEn: string; icon: string }[] = [
  { id: 'jar', labelFr: 'Jarre Galbée', labelEn: 'Curved Jar', icon: '🏺' },
  { id: 'circle', labelFr: 'Fiole Ronde', labelEn: 'Round Flask', icon: '🔮' },
  { id: 'custom', labelFr: 'Sur-mesure', labelEn: 'Custom Shape', icon: '✨' },
  { id: 'tube', labelFr: 'Tube & Cuve', labelEn: 'Tube & Chamber', icon: '🧪' }
];

const CUSTOM_PRESET_OPTIONS: { id: CustomShapePreset; labelFr: string; labelEn: string; icon: string }[] = [
  { id: 'erlenmeyer', labelFr: '🧪 Erlenmeyer', labelEn: '🧪 Erlenmeyer', icon: '🧪' },
  { id: 'hourglass', labelFr: '⏳ Sablier', labelEn: '⏳ Hourglass', icon: '⏳' },
  { id: 'vase', labelFr: '🏺 Amphore', labelEn: '🏺 Vase', icon: '🏺' },
  { id: 'diamond', labelFr: '💎 Diamant', labelEn: '💎 Diamond', icon: '💎' },
  { id: 'funnel', labelFr: '🌪️ Entonnoir', labelEn: '🌪️ Funnel', icon: '🌪️' },
  { id: 'wavy', labelFr: '🌊 Ondulé', labelEn: '🌊 Wavy', icon: '🌊' }
];

interface BatchSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MergeDropConfig;
  onPlayReplay: (telemetry: SimulationTelemetry) => void;
  language?: 'fr' | 'en';
}

export const BatchSimulatorModal: React.FC<BatchSimulatorModalProps> = ({
  isOpen,
  onClose,
  config,
  onPlayReplay,
  language = 'fr'
}) => {
  const isEn = language === 'en';
  const [simCount, setSimCount] = useState<number>(30);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simProgress, setSimProgress] = useState<{ completed: number; total: number }>({ completed: 0, total: 0 });
  const [runs, setRuns] = useState<SimulationTelemetry[]>([]);

  // Forme de contenant & Dimensions exactes pour la simulation
  const [containerShape, setContainerShape] = useState<ContainerShape>(config.CONTAINER_SHAPE || 'jar');
  const [containerTopY, setContainerTopY] = useState<number>(config.CONTAINER_TOP_Y ?? 190);
  const [containerBottomY, setContainerBottomY] = useState<number>(config.CONTAINER_BOTTOM_Y ?? 790);

  // Dimensions sur-mesure
  const [customPreset, setCustomPreset] = useState<CustomShapePreset>(config.CUSTOM_PRESET || 'erlenmeyer');
  const [customNeckWidth, setCustomNeckWidth] = useState<number>(config.CUSTOM_NECK_WIDTH ?? 45);
  const [customBellyWidth, setCustomBellyWidth] = useState<number>(config.CUSTOM_BELLY_WIDTH ?? 135);
  const [customBellyPos, setCustomBellyPos] = useState<number>(config.CUSTOM_BELLY_POSITION ?? 0.55);
  const [customBottomWidth, setCustomBottomWidth] = useState<number>(config.CUSTOM_BOTTOM_WIDTH ?? 220);
  const [customCurvature, setCustomCurvature] = useState<number>(config.CUSTOM_CURVATURE ?? 0.05);
  const [customWaveCount, setCustomWaveCount] = useState<number>(config.CUSTOM_WAVE_COUNT ?? 0);
  const [customWaveAmp, setCustomWaveAmp] = useState<number>(config.CUSTOM_WAVE_AMPLITUDE ?? 0);
  const [customBottomWaveCount, setCustomBottomWaveCount] = useState<number>(config.CUSTOM_BOTTOM_WAVE_COUNT ?? 0);
  const [customBottomWaveAmp, setCustomBottomWaveAmp] = useState<number>(config.CUSTOM_BOTTOM_WAVE_AMPLITUDE ?? 0);
  const [customBottomWaveStyle, setCustomBottomWaveStyle] = useState<'smooth' | 'spikes'>(config.CUSTOM_BOTTOM_WAVE_STYLE || 'smooth');

  const [showAdvancedDimensions, setShowAdvancedDimensions] = useState<boolean>(false);

  // Synchronisation avec les réglages actifs du jeu
  const syncWithGameConfig = () => {
    setContainerShape(config.CONTAINER_SHAPE || 'jar');
    setContainerTopY(config.CONTAINER_TOP_Y ?? 190);
    setContainerBottomY(config.CONTAINER_BOTTOM_Y ?? 790);
    setCustomPreset(config.CUSTOM_PRESET || 'erlenmeyer');
    setCustomNeckWidth(config.CUSTOM_NECK_WIDTH ?? 45);
    setCustomBellyWidth(config.CUSTOM_BELLY_WIDTH ?? 135);
    setCustomBellyPos(config.CUSTOM_BELLY_POSITION ?? 0.55);
    setCustomBottomWidth(config.CUSTOM_BOTTOM_WIDTH ?? 220);
    setCustomCurvature(config.CUSTOM_CURVATURE ?? 0.05);
    setCustomWaveCount(config.CUSTOM_WAVE_COUNT ?? 0);
    setCustomWaveAmp(config.CUSTOM_WAVE_AMPLITUDE ?? 0);
    setCustomBottomWaveCount(config.CUSTOM_BOTTOM_WAVE_COUNT ?? 0);
    setCustomBottomWaveAmp(config.CUSTOM_BOTTOM_WAVE_AMPLITUDE ?? 0);
    setCustomBottomWaveStyle(config.CUSTOM_BOTTOM_WAVE_STYLE || 'smooth');
  };

  useEffect(() => {
    syncWithGameConfig();
  }, [config, isOpen]);

  const handleApplyPreset = (preset: CustomShapePreset) => {
    setCustomPreset(preset);
    const p = CUSTOM_SHAPE_PRESETS[preset];
    if (p) {
      if (p.CUSTOM_NECK_WIDTH !== undefined) setCustomNeckWidth(p.CUSTOM_NECK_WIDTH);
      if (p.CUSTOM_BELLY_WIDTH !== undefined) setCustomBellyWidth(p.CUSTOM_BELLY_WIDTH);
      if (p.CUSTOM_BELLY_POSITION !== undefined) setCustomBellyPos(p.CUSTOM_BELLY_POSITION);
      if (p.CUSTOM_BOTTOM_WIDTH !== undefined) setCustomBottomWidth(p.CUSTOM_BOTTOM_WIDTH);
      if (p.CUSTOM_CURVATURE !== undefined) setCustomCurvature(p.CUSTOM_CURVATURE);
      if (p.CUSTOM_WAVE_COUNT !== undefined) setCustomWaveCount(p.CUSTOM_WAVE_COUNT);
      if (p.CUSTOM_WAVE_AMPLITUDE !== undefined) setCustomWaveAmp(p.CUSTOM_WAVE_AMPLITUDE);
      if (p.CUSTOM_BOTTOM_WAVE_COUNT !== undefined) setCustomBottomWaveCount(p.CUSTOM_BOTTOM_WAVE_COUNT);
      if (p.CUSTOM_BOTTOM_WAVE_AMPLITUDE !== undefined) setCustomBottomWaveAmp(p.CUSTOM_BOTTOM_WAVE_AMPLITUDE);
      if (p.CUSTOM_BOTTOM_WAVE_STYLE !== undefined) setCustomBottomWaveStyle(p.CUSTOM_BOTTOM_WAVE_STYLE);
    }
  };

  // Configuration de cadence progressive pour le batch
  const [startRate, setStartRate] = useState<number>(config.AUTO_STREAM_START_RATE ?? 2);
  const [maxRate, setMaxRate] = useState<number>(config.AUTO_STREAM_MAX_RATE ?? 10);
  const [rampStep, setRampStep] = useState<number>(config.AUTO_STREAM_RAMP_STEP ?? 1);
  const [rampInterval, setRampInterval] = useState<number>(config.AUTO_STREAM_RAMP_INTERVAL ?? 4);
  const [rampEnabled, setRampEnabled] = useState<boolean>(config.AUTO_STREAM_RAMP_ENABLED ?? true);

  // État de l'exportation vidéo hors-ligne 60 FPS
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [exportedBlobUrl, setExportedBlobUrl] = useState<string | null>(null);
  const [exportResolution, setExportResolution] = useState<'720p' | '1080p'>('720p');

  if (!isOpen) return null;

  const themeDef = getThemeDefinition(config.SKIN_THEME || 'potatoes');
  const timeToMax = rampStep > 0 && maxRate > startRate ? Math.ceil((maxRate - startRate) / rampStep) * rampInterval : 0;

  const handleStartSimulation = async () => {
    setIsSimulating(true);
    setSimProgress({ completed: 0, total: simCount });
    setRuns([]);

    const effectiveConfig: MergeDropConfig = {
      ...config,
      CONTAINER_SHAPE: containerShape,
      CONTAINER_TOP_Y: containerTopY,
      CONTAINER_BOTTOM_Y: containerBottomY,
      CUSTOM_PRESET: customPreset,
      CUSTOM_NECK_WIDTH: customNeckWidth,
      CUSTOM_BELLY_WIDTH: customBellyWidth,
      CUSTOM_BELLY_POSITION: customBellyPos,
      CUSTOM_BOTTOM_WIDTH: customBottomWidth,
      CUSTOM_CURVATURE: customCurvature,
      CUSTOM_WAVE_COUNT: customWaveCount,
      CUSTOM_WAVE_AMPLITUDE: customWaveAmp,
      CUSTOM_BOTTOM_WAVE_COUNT: customBottomWaveCount,
      CUSTOM_BOTTOM_WAVE_AMPLITUDE: customBottomWaveAmp,
      CUSTOM_BOTTOM_WAVE_STYLE: customBottomWaveStyle,
      AUTO_STREAM_ACTIVE: true,
      AUTO_STREAM_RAMP_ENABLED: rampEnabled,
      AUTO_STREAM_START_RATE: startRate,
      AUTO_STREAM_MAX_RATE: maxRate,
      AUTO_STREAM_RAMP_STEP: rampStep,
      AUTO_STREAM_RAMP_INTERVAL: rampInterval
    };

    try {
      const results = await BatchSimulator.runBatch({
        count: simCount,
        maxDurationSeconds: 48,
        config: effectiveConfig,
        onProgress: (p) => {
          setSimProgress({ completed: p.completed, total: p.total });
        }
      });
      setRuns(results);
    } catch (e) {
      console.error('Erreur simulation batch:', e);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleExportOfflineVideo = async (run: SimulationTelemetry) => {
    setIsExporting(true);
    setExportProgress({ stage: 'Démarrage...', currentFrame: 0, totalFrames: run.totalTicks, percent: 0 });
    setExportedBlobUrl(null);

    const exportConfig: MergeDropConfig = run.config || {
      ...config,
      CONTAINER_SHAPE: containerShape,
      CONTAINER_TOP_Y: containerTopY,
      CONTAINER_BOTTOM_Y: containerBottomY,
      CUSTOM_PRESET: customPreset,
      CUSTOM_NECK_WIDTH: customNeckWidth,
      CUSTOM_BELLY_WIDTH: customBellyWidth,
      CUSTOM_BELLY_POSITION: customBellyPos,
      CUSTOM_BOTTOM_WIDTH: customBottomWidth,
      CUSTOM_CURVATURE: customCurvature,
      CUSTOM_WAVE_COUNT: customWaveCount,
      CUSTOM_WAVE_AMPLITUDE: customWaveAmp,
      CUSTOM_BOTTOM_WAVE_COUNT: customBottomWaveCount,
      CUSTOM_BOTTOM_WAVE_AMPLITUDE: customBottomWaveAmp,
      CUSTOM_BOTTOM_WAVE_STYLE: customBottomWaveStyle,
      AUTO_STREAM_ACTIVE: true,
      AUTO_STREAM_RAMP_ENABLED: rampEnabled,
      AUTO_STREAM_START_RATE: startRate,
      AUTO_STREAM_MAX_RATE: maxRate,
      AUTO_STREAM_RAMP_STEP: rampStep,
      AUTO_STREAM_RAMP_INTERVAL: rampInterval
    };

    try {
      const mp4Blob = await OfflineVideoExporter.exportGame(
        run,
        exportConfig,
        (p) => {
          setExportProgress(p);
        },
        { resolution: exportResolution }
      );

      const url = URL.createObjectURL(mp4Blob);
      setExportedBlobUrl(url);

      // Déclenchement automatique du téléchargement
      const a = document.createElement('a');
      a.href = url;
      a.download = `satisfylab_60fps_${exportResolution}_seed${run.seed}_score${run.viralScore}.mp4`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 500);
    } catch (err: any) {
      console.error('Erreur export hors-ligne:', err);
      alert(err.message || 'Erreur lors de l’encodage vidéo');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans">
        {/* En-tête de la Modale */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>{isEn ? 'AI Batch Simulator & 60 FPS Exporter' : 'Simulateur Batch IA & Export Vidéo 60 FPS'}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                  {isEn ? 'Zero Lag' : '0 Saccade'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {isEn
                  ? 'Simulate dozens of games in seconds and export the best viral run in silky-smooth 60 FPS.'
                  : 'Simulez des dizaines de parties en 1 seconde et exportez le meilleur run viral à 60 FPS sans saccade.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps de la modale */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stratégie de Tir Progressif (Pacing TikTok) */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {isEn ? 'Drop Cadence Strategy (TikTok Pacing)' : 'Stratégie de Tir Progressif (Pacing TikTok)'}
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rampEnabled}
                  onChange={(e) => setRampEnabled(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 w-4 h-4"
                />
                <span className="text-xs text-slate-300 font-medium">
                  {isEn ? 'Progressive Ramp' : 'Accélération progressive'}
                </span>
              </label>
            </div>

            {rampEnabled ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Cadence de départ */}
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{isEn ? 'Start Rate' : 'Départ'}</span>
                    <span className="font-mono font-bold text-cyan-400">{startRate} b/s</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={startRate}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setStartRate(v);
                      if (v > maxRate) setMaxRate(v);
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="text-[10px] text-slate-500">
                    {isEn ? 'Initial rate' : 'Billes / sec au début'}
                  </div>
                </div>

                {/* Cadence maximale */}
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{isEn ? 'Max Rate' : 'Plafond Max'}</span>
                    <span className="font-mono font-bold text-fuchsia-400">{maxRate} b/s</span>
                  </div>
                  <input
                    type="range"
                    min={startRate}
                    max={25}
                    step={1}
                    value={maxRate}
                    onChange={(e) => setMaxRate(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-400"
                  />
                  <div className="text-[10px] text-slate-500">
                    {isEn ? 'Maximum rate' : 'Cadence maximale'}
                  </div>
                </div>

                {/* Accélération */}
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{isEn ? 'Ramp Step' : 'Augmentation'}</span>
                    <span className="font-mono font-bold text-amber-400">+{rampStep} b/s</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={5}
                    step={0.5}
                    value={rampStep}
                    onChange={(e) => setRampStep(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                  <div className="text-[10px] text-slate-500">
                    {isEn ? 'Added per step' : 'Billes en + par palier'}
                  </div>
                </div>

                {/* Intervalle */}
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{isEn ? 'Interval' : 'Toutes les'}</span>
                    <span className="font-mono font-bold text-emerald-400">{rampInterval}s</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={15}
                    step={1}
                    value={rampInterval}
                    onChange={(e) => setRampInterval(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                  <div className="text-[10px] text-slate-500">
                    {isEn ? 'Step interval' : 'Délai entre augmentations'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {isEn ? 'Constant drop rate:' : 'Cadence constante de tir :'}
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={20}
                    step={1}
                    value={startRate}
                    onChange={(e) => setStartRate(Number(e.target.value))}
                    className="w-32 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <span className="font-mono font-bold text-cyan-400 text-xs">{startRate} b/s</span>
                </div>
              </div>
            )}

            {/* Aperçu du timing de montée en puissance */}
            {rampEnabled && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-[11px] text-cyan-300">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span>
                  {isEn ? (
                    <>
                      Pacing: Starts at <b>{startRate} b/s</b> ➔ ramps <b>+{rampStep} b/s</b> every{' '}
                      <b>{rampInterval}s</b> ➔ reaches cap of <b>{maxRate} b/s</b> at <b>{timeToMax}s</b>.
                    </>
                  ) : (
                    <>
                      Pacing : Démarre à <b>{startRate} b/s</b> ➔ monte de <b>+{rampStep} b/s</b> toutes les{' '}
                      <b>{rampInterval}s</b> ➔ atteint le max <b>{maxRate} b/s</b> en <b>{timeToMax}s</b> de jeu.
                    </>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Forme & Dimensions Réelles du Contenant pour la Simulation */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {isEn ? 'Container & Geometry' : 'Contenant & Dimensions (Fidélité 100%)'}
                </span>
              </div>
              <button
                type="button"
                onClick={syncWithGameConfig}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 text-[11px] font-semibold border border-cyan-800/40 transition-colors shadow-sm"
                title={isEn ? 'Synchronize with the game active container' : 'Synchroniser avec le conteneur actuellement actif dans le jeu'}
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isEn ? 'Sync with Game' : 'Sync Conteneur du Jeu'}</span>
              </button>
            </div>

            {/* 4 Boutons de formes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {CONTAINER_OPTIONS.map((opt) => {
                const isSelected = containerShape === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isSimulating}
                    onClick={() => {
                      setContainerShape(opt.id);
                      if (opt.id === 'custom' && !config.CUSTOM_PRESET) {
                        handleApplyPreset('erlenmeyer');
                      }
                    }}
                    className={`p-3 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1.5 border ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-neon-cyan'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <span className="text-[11px] font-semibold">{isEn ? opt.labelEn : opt.labelFr}</span>
                  </button>
                );
              })}
            </div>

            {/* Fiche récapitulative des dimensions exactes prises en compte */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    {isEn ? 'Active Container in Simulation :' : 'Contenant pris en compte :'} <b>{CONTAINER_OPTIONS.find((c) => c.id === containerShape)?.[isEn ? 'labelEn' : 'labelFr']}</b>
                  </span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                  Hauteur : {containerBottomY - containerTopY} px
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="text-slate-400">
                  <span className="text-slate-300 font-medium">Hauteur : </span>
                  Haut <b className="text-cyan-400">{containerTopY} px</b> ➔ Fond <b className="text-cyan-400">{containerBottomY} px</b>
                </div>
                <div className="text-slate-400 truncate">
                  <span className="text-slate-300 font-medium">Largeurs : </span>
                  {containerShape === 'custom' && (
                    <span>
                      Col <b className="text-fuchsia-400">{customNeckWidth}px</b> • Panse <b className="text-fuchsia-400">{customBellyWidth}px</b> ({Math.round(customBellyPos * 100)}%) • Fond <b className="text-fuchsia-400">{customBottomWidth}px</b>
                    </span>
                  )}
                  {containerShape === 'jar' && (
                    <span>Col <b>80px</b> • Panse <b>430px</b> • Fond <b>330px</b></span>
                  )}
                  {containerShape === 'circle' && (
                    <span>Col <b>90px</b> • Rayon sphère <b className="text-fuchsia-400">{Math.round(Math.max(130, Math.min(225, (containerBottomY - containerTopY - 110) * 0.52)))}px</b></span>
                  )}
                  {containerShape === 'tube' && (
                    <span>Tube <b>80px</b> • Cuve <b>420px</b></span>
                  )}
                </div>
              </div>
            </div>

            {/* Bouton déroulant pour ajuster les dimensions directement */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAdvancedDimensions(!showAdvancedDimensions)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    {isEn ? 'Adjust Container Dimensions (Height & Width)' : 'Ajuster les Hauteurs & Largeurs du Contenant'}
                  </span>
                </div>
                {showAdvancedDimensions ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {showAdvancedDimensions && (
                <div className="mt-2.5 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3.5 animate-fadeIn">
                  {/* Réglage des Hauteurs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{isEn ? 'Top Height (Y min)' : 'Hauteur Haut (Y min)'}</span>
                        <span className="font-mono font-bold text-cyan-400">{containerTopY} px</span>
                      </div>
                      <input
                        type="range"
                        min={100}
                        max={300}
                        step={5}
                        value={containerTopY}
                        onChange={(e) => setContainerTopY(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{isEn ? 'Bottom Height (Y max)' : 'Hauteur Bas / Fond (Y max)'}</span>
                        <span className="font-mono font-bold text-cyan-400">{containerBottomY} px</span>
                      </div>
                      <input
                        type="range"
                        min={550}
                        max={920}
                        step={5}
                        value={containerBottomY}
                        onChange={(e) => setContainerBottomY(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                    </div>
                  </div>

                  {/* Si forme Sur-mesure : Presets + Largeurs */}
                  {containerShape === 'custom' && (
                    <div className="pt-2 border-t border-slate-800 space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold">
                        <span>{isEn ? 'Shape Preset :' : 'Préréglage de Forme :'}</span>
                        <div className="flex flex-wrap gap-1">
                          {CUSTOM_PRESET_OPTIONS.map((pr) => (
                            <button
                              key={pr.id}
                              type="button"
                              onClick={() => handleApplyPreset(pr.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                customPreset === pr.id
                                  ? 'bg-fuchsia-600 text-white shadow-sm'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {pr.icon}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>{isEn ? 'Neck Width' : 'Largeur Col'}</span>
                            <span className="font-mono font-bold text-fuchsia-400">{customNeckWidth}px</span>
                          </div>
                          <input
                            type="range"
                            min={35}
                            max={180}
                            step={5}
                            value={customNeckWidth}
                            onChange={(e) => setCustomNeckWidth(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-400"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>{isEn ? 'Belly Width' : 'Largeur Panse'}</span>
                            <span className="font-mono font-bold text-fuchsia-400">{customBellyWidth}px</span>
                          </div>
                          <input
                            type="range"
                            min={60}
                            max={235}
                            step={5}
                            value={customBellyWidth}
                            onChange={(e) => setCustomBellyWidth(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-400"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>{isEn ? 'Belly Position' : 'Hauteur Panse'}</span>
                            <span className="font-mono font-bold text-fuchsia-400">{Math.round(customBellyPos * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min={0.2}
                            max={0.8}
                            step={0.05}
                            value={customBellyPos}
                            onChange={(e) => setCustomBellyPos(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-400"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>{isEn ? 'Bottom Width' : 'Largeur Fond'}</span>
                            <span className="font-mono font-bold text-fuchsia-400">{customBottomWidth}px</span>
                          </div>
                          <input
                            type="range"
                            min={40}
                            max={235}
                            step={5}
                            value={customBottomWidth}
                            onChange={(e) => setCustomBottomWidth(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-400"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Panneau de configuration du batch */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-slate-300">
                {isEn ? 'Number of games to simulate :' : 'Nombre de parties à simuler :'}
              </span>
              <div className="flex items-center gap-1.5">
                {[15, 30, 50].map((count) => (
                  <button
                    key={count}
                    type="button"
                    disabled={isSimulating}
                    onClick={() => setSimCount(count)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      simCount === count
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-neon-cyan'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {count} {isEn ? 'runs' : 'parties'}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={isSimulating || isExporting}
              onClick={handleStartSimulation}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all shadow-lg ${
                isSimulating
                  ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/40 cursor-wait'
                  : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-fuchsia-600 hover:opacity-95 text-white active:scale-95 shadow-cyan-500/30'
              }`}
            >
              {isSimulating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                  <span>
                    {isEn ? 'Simulating' : 'Simulation en cours'} ({simProgress.completed}/{simProgress.total})...
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>{isEn ? `Simulate ${simCount} Games (Headless)` : `Lancer la simulation de ${simCount} parties`}</span>
                </>
              )}
            </button>
          </div>

          {/* Overlay d'exportation vidéo en cours */}
          {isExporting && exportProgress && (
            <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-300 flex items-center gap-2">
                  <Film className="w-4 h-4 text-cyan-400 animate-pulse" />
                  {exportProgress.stage}
                </span>
                <div className="flex items-center gap-3">
                  {exportProgress.renderFps ? (
                    <span className="text-[11px] font-mono text-cyan-300/80 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/40">
                      ⚡ {exportProgress.renderFps} FPS
                    </span>
                  ) : null}
                  <span className="font-mono text-cyan-400 font-bold">{exportProgress.percent}%</span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 transition-all duration-150"
                  style={{ width: `${exportProgress.percent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  {isEn
                    ? 'Frame-by-frame rendering with zero drops + synced AI voice.'
                    : 'Rendu déterministe image par image sans aucune saccade + voix IA synchronisée.'}
                </span>
                <span className="font-mono font-bold text-cyan-400 uppercase text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {exportResolution === '1080p' ? '1080p Full HD' : '⚡ 720p HD Rapide'}
                </span>
              </div>
            </div>
          )}

          {/* Liste des résultats de simulation */}
          {runs.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between pb-2 border-b border-slate-800 gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  {isEn ? `Top ${runs.length} Curated Runs (Viral Score)` : `Top ${runs.length} Parties (Score de Rétention TikTok)`}
                </span>

                {/* Sélecteur de Résolution d'Exportation */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {isEn ? 'Format :' : 'Qualité :'}
                  </span>
                  <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                    <button
                      type="button"
                      disabled={isExporting}
                      onClick={() => setExportResolution('720p')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                        exportResolution === '720p'
                          ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title={isEn ? '720x1280 @ 60 FPS (~1m15 - Ideal for TikTok/Shorts)' : '720x1280 @ 60 FPS (~1m15 - Recommandé TikTok/Shorts)'}
                    >
                      ⚡ 720p HD (~1m15)
                    </button>
                    <button
                      type="button"
                      disabled={isExporting}
                      onClick={() => setExportResolution('1080p')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                        exportResolution === '1080p'
                          ? 'bg-fuchsia-600 text-white shadow-md font-extrabold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title={isEn ? '1080x1920 @ 60 FPS (~4m - Master Full HD)' : '1080x1920 @ 60 FPS (~4m - Qualité Master Full HD)'}
                    >
                      💎 1080p (~4m)
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                {runs.slice(0, 10).map((run, idx) => {
                  const maxTierData = themeDef.tiers[run.maxTierReached] || themeDef.tiers[0];
                  const tierName = getTierLocalizedName(maxTierData, isEn);
                  const isTop1 = idx === 0;

                  return (
                    <div
                      key={run.seed}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        isTop1
                          ? 'bg-gradient-to-r from-cyan-950/50 via-slate-900 to-fuchsia-950/30 border-cyan-500/50 shadow-lg shadow-cyan-950/30'
                          : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      {/* Informations du Run */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs flex-shrink-0 ${
                            idx === 0
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : idx === 1
                              ? 'bg-slate-300/20 text-slate-300 border border-slate-400/40'
                              : idx === 2
                              ? 'bg-amber-700/20 text-amber-600 border border-amber-700/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          #{idx + 1}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-white flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block"
                                style={{ backgroundColor: maxTierData.color }}
                              />
                              {tierName}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              Seed #{run.seed}
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800/80 text-cyan-300 border border-slate-700/60">
                              {CONTAINER_OPTIONS.find((c) => c.id === (run.config?.CONTAINER_SHAPE || containerShape))?.[isEn ? 'labelEn' : 'labelFr'] || '🏺 Jarre'}
                            </span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                              Score Viral: {run.viralScore}/100
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Flame className="w-3 h-3 text-orange-400" />
                              Combo x{run.maxCombo} ({run.totalCombos} {isEn ? 'cascades' : 'cascades'})
                            </span>
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                              {run.dangerLineSeconds.toFixed(1)}s {isEn ? 'in danger' : 'en zone rouge'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-cyan-400" />
                              {run.durationSeconds.toFixed(1)}s
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions sur ce Run */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onPlayReplay(run);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Play className="w-3 h-3 text-cyan-400" />
                          <span>{isEn ? 'Play Live' : 'Rejouer en direct'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={isExporting}
                          onClick={() => handleExportOfflineVideo(run)}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
                        >
                          <Download className="w-3 h-3" />
                          <span>
                            {isEn
                              ? `Export MP4 (${exportResolution.toUpperCase()})`
                              : `Exporter MP4 (${exportResolution.toUpperCase()})`}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {runs.length === 0 && !isSimulating && (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Zap className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-xs font-medium">
                {isEn
                  ? 'Click the button above to simulate multiple games and find the most satisfying run.'
                  : 'Cliquez sur le bouton ci-dessus pour simuler plusieurs parties et dénicher le run le plus viral.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
