import { BallEscapeConfig } from '../types';
import { BallEscapeSimulation } from './BallEscapeSimulation';
import { BallEscapeTelemetry } from './types';

export interface BallEscapeBatchOptions {
  count?: number;
  baseSeed?: number;
  maxDurationSeconds?: number;
  config?: Partial<BallEscapeConfig>;
  onProgress?: (progress: {
    completed: number;
    total: number;
    currentBest: BallEscapeTelemetry | null;
  }) => void;
}

export class BallEscapeBatchSimulator {
  /**
   * Exécute une série de simulations par lots de N seeds en mode headless
   * Découpage en micro-tâches pour garantir la réactivité absolue de l'interface utilisateur.
   */
  public static async runBatch(
    options: BallEscapeBatchOptions = {}
  ): Promise<BallEscapeTelemetry[]> {
    const count = options.count || 30;
    const baseSeed = options.baseSeed ?? Math.floor(Math.random() * 1000000);
    const maxDuration = options.maxDurationSeconds || options.config?.CHALLENGE_TIME_LIMIT || 30;
    const config: Partial<BallEscapeConfig> = { ...options.config };

    const results: BallEscapeTelemetry[] = [];
    let currentBest: BallEscapeTelemetry | null = null;

    const batchChunkSize = 5;

    for (let i = 0; i < count; i += batchChunkSize) {
      const chunkEnd = Math.min(count, i + batchChunkSize);

      for (let j = i; j < chunkEnd; j++) {
        const seed = baseSeed + j * 1013 + 7;
        const sim = new BallEscapeSimulation(seed, config);
        const telemetry = sim.simulateFull(maxDuration);

        results.push(telemetry);

        if (!currentBest || telemetry.viralScore > currentBest.viralScore) {
          currentBest = telemetry;
        }
      }

      if (options.onProgress) {
        options.onProgress({
          completed: chunkEnd,
          total: count,
          currentBest
        });
      }

      await new Promise((r) => setTimeout(r, 0));
    }

    // Tri par score viral décroissant par défaut
    results.sort((a, b) => b.viralScore - a.viralScore);
    return results;
  }
}
