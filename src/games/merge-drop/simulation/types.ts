import { MergeDropConfig } from '../types';
import { MergeTier } from '../themeRegistry';

export type SimulationEventType =
  | 'drop'
  | 'merge'
  | 'bounce'
  | 'danger'
  | 'climax'
  | 'victory'
  | 'game_over';

export interface BaseSimulationEvent {
  type: SimulationEventType;
  tick: number;
  timeSeconds: number;
}

export interface DropEvent extends BaseSimulationEvent {
  type: 'drop';
  ballId: number;
  tier: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface MergeEvent extends BaseSimulationEvent {
  type: 'merge';
  newBallId: number;
  nextTier: number;
  originalTierIndex?: number;
  x: number;
  y: number;
  b1Id: number;
  b2Id: number;
  points: number;
  comboCount: number;
  isClimax: boolean;
}

export interface BounceEvent extends BaseSimulationEvent {
  type: 'bounce';
  ballId: number;
  speed: number;
}

export interface DangerEvent extends BaseSimulationEvent {
  type: 'danger';
  highestY: number;
  dangerY: number;
}

export interface ClimaxEvent extends BaseSimulationEvent {
  type: 'climax';
  tier: number;
  sunBallId: number;
}

export interface VictoryEvent extends BaseSimulationEvent {
  type: 'victory';
  finalScore: number;
  maxTier: number;
}

export interface GameOverEvent extends BaseSimulationEvent {
  type: 'game_over';
  finalScore: number;
  maxTier: number;
  reason: 'danger_overflow' | 'time_limit';
}

export type SimulationEvent =
  | DropEvent
  | MergeEvent
  | BounceEvent
  | DangerEvent
  | ClimaxEvent
  | VictoryEvent
  | GameOverEvent;

export interface SimBall {
  id: number;
  tier: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  hasLanded: boolean;
  mergeCooldown: number;
}

export interface DropAction {
  tick: number;
  tier: number;
  x?: number;
}

export interface SimulationTelemetry {
  seed: number;
  totalTicks: number;
  durationSeconds: number;
  finalScore: number;
  maxTierReached: number;
  ballsDropped: number;
  mergesCount: number;
  maxCombo: number;
  totalCombos: number;
  dangerLineSeconds: number;
  viralScore: number; // 0 - 100
  isVictory: boolean;
  events: SimulationEvent[];
  dropActions: DropAction[];
  config?: MergeDropConfig;
}
