import { MergeDropConfig } from '../types';
import { MergeDropSimulation } from './MergeDropSimulation';
import { SimulationTelemetry } from './types';

export interface BatchSimulatorOptions {
  count?: number;
  baseSeed?: number;
  maxDurationSeconds?: number;
  config?: Partial<MergeDropConfig>;
  onProgress?: (progress: { completed: number; total: number; currentBest: SimulationTelemetry | null }) => void;
}

export class BatchSimulator {
  /**
   * Lance une simulation par lots de N parties en mode headless
   */
  public static async runBatch(options: BatchSimulatorOptions = {}): Promise<SimulationTelemetry[]> {
    const count = options.count || 30;
    const baseSeed = options.baseSeed ?? Math.floor(Math.random() * 1000000);
    const maxDuration = options.maxDurationSeconds || 50;
    const config: Partial<MergeDropConfig> = {
      ...options.config,
      AUTO_STREAM_ACTIVE: options.config?.AUTO_STREAM_ACTIVE ?? true,
      AUTO_STREAM_RATE: options.config?.AUTO_STREAM_RATE ?? 6
    };

    const results: SimulationTelemetry[] = [];
    let currentBest: SimulationTelemetry | null = null;

    // Découpage en micro-tâches pour ne jamais figer l'interface utilisateur
    const batchChunkSize = 5;

    for (let i = 0; i < count; i += batchChunkSize) {
      const chunkEnd = Math.min(count, i + batchChunkSize);

      for (let j = i; j < chunkEnd; j++) {
        const seed = baseSeed + j * 997 + 13;
        const sim = new MergeDropSimulation(seed, config);
        const telemetry = sim.simulateFull(maxDuration);
        telemetry.config = { ...config } as MergeDropConfig;

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

      // Permet au navigateur de rafraîchir l'UI entre chaque petit lot
      await new Promise((r) => setTimeout(r, 0));
    }

    // Tri par score de viralité décroissant (la meilleure partie en premier)
    results.sort((a, b) => b.viralScore - a.viralScore);
    return results;
  }
}
