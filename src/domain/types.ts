export type Mood = "idle" | "happy" | "sad" | "sleep";

export type PetEventType =
  | "save"
  | "typing"
  | "diagImprove"
  | "diagWorsen"
  | "taskSuccess"
  | "taskFail"
  | "gitCommit"
  | "idleTick"
  | "agentSuccess"
  | "agentFail";

export interface PetState {
  affection: number;
  companionship: number;
  companionshipLevel: number;
  mood: Mood;
  lastEventAt: number;
  bubbleText: string;
}

export interface EventResult {
  state: PetState;
  applied: boolean;
  affectionDelta: number;
  companionshipDelta: number;
  leveledUp: boolean;
  message: string;
}

export interface EngineConfig {
  failChance: number;
  cooldownMs: Record<PetEventType, number>;
  rewards: Record<
    PetEventType,
    { affection: number; companionship: number; failAffection?: number }
  >;
  companionshipPerLevel: number;
  affectionOnLevelUp: number;
  affectionMin: number;
  affectionMax: number;
  random?: () => number;
  now?: () => number;
}

export const DEFAULT_CONFIG: EngineConfig = {
  failChance: 0.35,
  cooldownMs: {
    save: 8_000,
    typing: 15_000,
    diagImprove: 5_000,
    diagWorsen: 8_000,
    taskSuccess: 10_000,
    taskFail: 10_000,
    gitCommit: 5_000,
    idleTick: 60_000,
    agentSuccess: 20_000,
    agentFail: 20_000,
  },
  rewards: {
    save: { affection: 1, companionship: 4 },
    typing: { affection: 0, companionship: 3 },
    diagImprove: { affection: 3, companionship: 2 },
    diagWorsen: { affection: 0, companionship: 1, failAffection: -2 },
    taskSuccess: { affection: 5, companionship: 6 },
    taskFail: { affection: 0, companionship: 2, failAffection: -3 },
    gitCommit: { affection: 4, companionship: 5 },
    idleTick: { affection: 0, companionship: 1 },
    agentSuccess: { affection: 4, companionship: 8 },
    agentFail: { affection: 0, companionship: 3, failAffection: -2 },
  },
  companionshipPerLevel: 100,
  affectionOnLevelUp: 5,
  affectionMin: 0,
  affectionMax: 999,
};
