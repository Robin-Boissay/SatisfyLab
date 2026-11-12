import { BallEscapeConfig } from '../types';

export type BallEscapeEventType =
  | 'bounce'
  | 'segment_break'
  | 'ring_advance'
  | 'escape'
  | 'time_up';

export interface BaseBallEscapeEvent {
  type: BallEscapeEventType;
  tick: number;
  timeSeconds: number;
}

export interface BallBounceEvent extends BaseBallEscapeEvent {
  type: 'bounce';
  ballIndex: number;
  ringIndex: number;
  bounceCount: number;
  speed: number;
  x: number;
  y: number;
}

export interface SegmentBreakEvent extends BaseBallEscapeEvent {
  type: 'segment_break';
  ringIndex: number;
  segmentIndex: number;
  x: number;
  y: number;
}

export interface RingAdvanceEvent extends BaseBallEscapeEvent {
  type: 'ring_advance';
  ballIndex: number;
  fromRingIndex: number;
  toRingIndex: number;
  x: number;
  y: number;
}

export interface EscapeEvent extends BaseBallEscapeEvent {
  type: 'escape';
  ballIndex: number;
  team?: string;
  x: number;
  y: number;
  escapeTimeSeconds: number;
}

export interface TimeUpEvent extends BaseBallEscapeEvent {
  type: 'time_up';
  finalBounces: number;
}

export type BallEscapeEvent =
  | BallBounceEvent
  | SegmentBreakEvent
  | RingAdvanceEvent
  | EscapeEvent
  | TimeUpEvent;

export interface BallEscapeTelemetry {
  seed: number;
  totalTicks: number;
  durationSeconds: number;
  hasEscaped: boolean;
  escapeTimeSeconds?: number;
  bouncesCount: number;
  maxSpeedReached: number;
  maxRingIndexReached: number;
  winnerTeam?: string;
  viralScore: number; // 0 à 100
  events: BallEscapeEvent[];
  config?: BallEscapeConfig;
}
