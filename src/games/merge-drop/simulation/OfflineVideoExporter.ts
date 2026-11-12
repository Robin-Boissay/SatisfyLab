import { MergeDropConfig } from '../types';
import { SimulationTelemetry } from './types';
import { MergeDropSimulation } from './MergeDropSimulation';
import { MergeDropGame } from '../MergeDropGame';
import { OfflineAudioSynthesizer } from './OfflineAudioSynthesizer';
import { textureManager } from '../themeRegistry';

export interface ExportProgress {
  stage: string;
  currentFrame: number;
  totalFrames: number;
  percent: number;
  renderFps?: number;
  etaSeconds?: number;
}

export interface ExportOptions {
  resolution?: '720p' | '1080p';
}

export class OfflineVideoExporter {
  /**
   * Exporte une partie déterministe en vidéo MP4 à 60.00 FPS constants
   * avec zéro perte de frame (calcul hors-ligne image par image + audio et voix IA synchronisés).
   * 
   * Modes de résolution :
   * - 720p (720x1280)  : Ultra-rapide (~1m30), idéal pour TikTok/Reels/Shorts
   * - 1080p (1080x1920): Qualité master studio (~4m)
   */
  public static async exportGame(
    telemetry: SimulationTelemetry,
    config: MergeDropConfig,
    onProgress?: (p: ExportProgress) => void,
    options?: ExportOptions
  ): Promise<Blob> {
    const totalFrames = telemetry.totalTicks;
    const sessionId = `render_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const resolution = options?.resolution || '720p';
    const width = resolution === '1080p' ? 1080 : 720;
    const height = resolution === '1080p' ? 1920 : 1280;
    const jpegQuality = 0.85; // Qualité visuelle optimale et encodage DCT 25% plus rapide

    if (onProgress) {
      onProgress({
        stage: `Initialisation FFmpeg (${resolution === '1080p' ? '1080x1920 Full HD' : '720x1280 HD'})...`,
        currentFrame: 0,
        totalFrames,
        percent: 0
      });
    }

    // 1. Initialisation de la session côté backend
    const startRes = await fetch('/api/offline-render/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, fps: 60 })
    });

    if (!startRes.ok) {
      throw new Error(`Échec démarrage session FFmpeg (${startRes.status})`);
    }

    // 2. Synthèse sonore et vocale hors-ligne à l'échantillon près
    if (onProgress) {
      onProgress({
        stage: 'Synthèse audio numérique & voix IA (0 décalage)...',
        currentFrame: 0,
        totalFrames,
        percent: 4
      });
    }

    const effectiveConfig: MergeDropConfig = telemetry.config
      ? { ...config, ...telemetry.config }
      : config;

    const audioWavBlob = await OfflineAudioSynthesizer.synthesizeAudio(
      telemetry.events,
      telemetry.durationSeconds,
      effectiveConfig
    );

    // 3. Calcul & capture image par image sur un canvas configuré à la résolution choisie
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;

    const game = new MergeDropGame(offscreenCanvas, effectiveConfig, () => {});
    game.setDimensions(width, height);
    game.pauseLoop();

    // Précharge et attend les textures d'images complètes avant de capturer la moindre frame
    await textureManager.preloadThemeImagesAsync(game.getActiveTiers());

    const sim = new MergeDropSimulation(telemetry.seed, effectiveConfig);
    let frameChunks: Blob[] = [];
    const CHUNK_SIZE = 30; // Envoi par paquets de 30 images (~500ms de vidéo) pour réduire l'overhead HTTP

    // File d'attente d'upload asynchrone non-bloquante (Pipelining)
    const pendingUploads: Promise<void>[] = [];
    const MAX_CONCURRENT_UPLOADS = 2;

    const flushChunk = async (blobs: Blob[]) => {
      if (blobs.length === 0) return;
      const payload = new Blob(blobs, { type: 'application/octet-stream' });
      const uploadPromise = (async () => {
        const res = await fetch(`/api/offline-render/chunk?sessionId=${sessionId}`, {
          method: 'POST',
          body: payload
        });
        if (!res.ok) {
          throw new Error(`Échec upload chunk vidéo (${res.status})`);
        }
      })();

      pendingUploads.push(uploadPromise);
      uploadPromise.finally(() => {
        const idx = pendingUploads.indexOf(uploadPromise);
        if (idx !== -1) pendingUploads.splice(idx, 1);
      });

      if (pendingUploads.length >= MAX_CONCURRENT_UPLOADS) {
        await Promise.race(pendingUploads);
      }
    };

    const startTime = performance.now();

    for (let frame = 0; frame < totalFrames; frame++) {
      const events = sim.tick();
      game.renderOfflineStep(sim, events);

      const frameBlob = await new Promise<Blob>((resolve) => {
        offscreenCanvas.toBlob((b) => resolve(b!), 'image/jpeg', jpegQuality);
      });
      frameChunks.push(frameBlob);

      if (frameChunks.length >= CHUNK_SIZE || frame === totalFrames - 1) {
        const chunkToSend = frameChunks;
        frameChunks = [];
        await flushChunk(chunkToSend);
      }

      if (onProgress && (frame % 15 === 0 || frame === totalFrames - 1)) {
        const percent = Math.min(95, Math.round(5 + (frame / totalFrames) * 90));
        const elapsedSec = (performance.now() - startTime) / 1000;
        const currentFps = elapsedSec > 0 ? (frame + 1) / elapsedSec : 0;
        const remainingFrames = totalFrames - (frame + 1);
        const etaSeconds = currentFps > 0 ? Math.round(remainingFrames / currentFps) : 0;

        const etaText = etaSeconds > 0 ? ` (~${etaSeconds}s restants)` : '';
        onProgress({
          stage: `Rendu des images 60 FPS (${frame + 1} / ${totalFrames})${etaText}...`,
          currentFrame: frame + 1,
          totalFrames,
          percent,
          renderFps: Math.round(currentFps),
          etaSeconds
        });
      }

      // Laisse respirer le moteur de rendu du navigateur
      if (frame % 60 === 0) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    // Attente de l'achèvement de tous les paquets d'images en cours d'envoi
    await Promise.all(pendingUploads);

    game.destroy();

    // 4. Muxage final audio + vidéo via FFmpeg
    if (onProgress) {
      onProgress({
        stage: 'Muxage final MP4 H.264 + AAC 60 FPS...',
        currentFrame: totalFrames,
        totalFrames,
        percent: 96
      });
    }

    const finishRes = await fetch(`/api/offline-render/finish?sessionId=${sessionId}`, {
      method: 'POST',
      body: audioWavBlob
    });

    if (!finishRes.ok) {
      throw new Error(`Échec de la finalisation vidéo (${finishRes.status})`);
    }

    const mp4Blob = await finishRes.blob();

    if (onProgress) {
      onProgress({
        stage: 'Vidéo 60 FPS prête !',
        currentFrame: totalFrames,
        totalFrames,
        percent: 100
      });
    }

    return mp4Blob;
  }
}
