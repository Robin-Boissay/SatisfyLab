export type ConfigFieldType = 'range' | 'boolean' | 'color' | 'select' | 'number' | 'text';

export interface BaseConfigField {
  id: string;
  label: string;
  type: ConfigFieldType;
  category?: 'physics' | 'visuals' | 'gameplay' | 'audio' | 'texts';
  description?: string;
  visibleIf?: (values: Record<string, any>) => boolean;
}

export interface RangeConfigField extends BaseConfigField {
  type: 'range';
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit?: string;
}

export interface BooleanConfigField extends BaseConfigField {
  type: 'boolean';
  defaultValue: boolean;
}

export interface ColorConfigField extends BaseConfigField {
  type: 'color';
  defaultValue: string;
}

export interface SelectConfigField extends BaseConfigField {
  type: 'select';
  options: { label: string; value: string | number }[];
  defaultValue: string | number;
}

export interface NumberConfigField extends BaseConfigField {
  type: 'number';
  min?: number;
  max?: number;
  defaultValue: number;
}

export interface StringConfigField extends BaseConfigField {
  type: 'text';
  placeholder?: string;
  defaultValue: string;
}

export type ConfigField =
  | RangeConfigField
  | BooleanConfigField
  | ColorConfigField
  | SelectConfigField
  | NumberConfigField
  | StringConfigField;

export type ConfigSchema = Record<string, ConfigField>;

export interface GameHUDState {
  title?: string;
  primaryMetricLabel?: string;
  primaryMetricValue?: string | number;
  primaryMetricColor?: string;
  secondaryMetricLabel?: string;
  secondaryMetricValue?: string | number;
  secondaryMetricColor?: string;
  isDanger?: boolean;
  isFinished?: boolean;
  isWaitingToStart?: boolean;
  overlayPromptText?: string;
  statusText?: string;
  extraActionLabel?: string;
  extraActionActive?: boolean;
  topOffset?: number;
}

export interface GameInstance {
  start: () => void;
  reset: () => void;
  destroy: () => void;
  updateConfig: (newConfig: Record<string, any>) => void;
  triggerExtraAction?: () => void;
  handlePointerDown?: (e: MouseEvent | TouchEvent, x: number, y: number) => void;
  handlePointerMove?: (e: MouseEvent | TouchEvent, x: number, y: number) => void;
  handlePointerUp?: (e: MouseEvent | TouchEvent) => void;
}

export interface GameModule<TConfig = Record<string, any>> {
  id: string;
  name: string;
  shortDescription: string;
  description?: string;
  badge?: string;
  icon: string; // Lucide icon name
  tags?: string[];
  accentColor?: string;
  defaultConfig: TConfig;
  configSchema: ConfigSchema;
  createGame: (
    canvas: HTMLCanvasElement,
    config: TConfig,
    onHUDUpdate: (hud: GameHUDState) => void
  ) => GameInstance;
}
