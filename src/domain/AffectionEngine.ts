import {
  DEFAULT_CONFIG,
  EngineConfig,
  EventResult,
  Mood,
  PetEventType,
  PetState,
} from "./types";

const BUBBLES: Record<PetEventType, { ok: string; fail?: string }> = {
  save: { ok: "存好了～" },
  typing: { ok: "陪你敲敲敲" },
  diagImprove: { ok: "问题变少了！" },
  diagWorsen: { ok: "呜…红线变多了", fail: "（小声）有点不开心" },
  taskSuccess: { ok: "编译/测试过啦！" },
  taskFail: { ok: "这次没过…下次加油", fail: "失败了…好感掉一点" },
  gitCommit: { ok: "Commit 收到！" },
  idleTick: { ok: "Zzz…" },
  agentSuccess: { ok: "Agent 干完啦" },
  agentFail: { ok: "Agent 翻车了", fail: "呜哇 review 挂了" },
};

export function createInitialState(now = Date.now()): PetState {
  return {
    affection: 10,
    companionship: 0,
    companionshipLevel: 0,
    mood: "idle",
    lastEventAt: now,
    bubbleText: "你好，我是大肥鱼～",
  };
}

export class AffectionEngine {
  private cooldowns = new Map<PetEventType, number>();
  private readonly config: EngineConfig;
  private readonly random: () => number;
  private readonly now: () => number;

  constructor(
    private state: PetState = createInitialState(),
    config: Partial<EngineConfig> = {},
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config, cooldownMs: { ...DEFAULT_CONFIG.cooldownMs, ...config.cooldownMs }, rewards: { ...DEFAULT_CONFIG.rewards, ...config.rewards } };
    this.random = this.config.random ?? Math.random;
    this.now = this.config.now ?? Date.now;
  }

  getState(): PetState {
    return { ...this.state };
  }

  loadState(state: PetState): void {
    this.state = { ...state };
  }

  apply(event: PetEventType): EventResult {
    const t = this.now();
    const last = this.cooldowns.get(event);
    const cd = this.config.cooldownMs[event] ?? 0;
    if (last !== undefined && t - last < cd) {
      return {
        state: this.getState(),
        applied: false,
        affectionDelta: 0,
        companionshipDelta: 0,
        leveledUp: false,
        message: "冷却中",
      };
    }
    this.cooldowns.set(event, t);

    const reward = this.config.rewards[event];
    let affectionDelta = reward.affection;
    let companionshipDelta = reward.companionship;
    let failedRoll = false;

    if (reward.failAffection !== undefined && reward.failAffection < 0) {
      failedRoll = this.random() < this.config.failChance;
      if (failedRoll) {
        affectionDelta = reward.failAffection;
      }
    }

    this.state.affection = clamp(
      this.state.affection + affectionDelta,
      this.config.affectionMin,
      this.config.affectionMax,
    );
    this.state.companionship += Math.max(0, companionshipDelta);

    let leveledUp = false;
    while (this.state.companionship >= this.config.companionshipPerLevel) {
      this.state.companionship -= this.config.companionshipPerLevel;
      this.state.companionshipLevel += 1;
      this.state.affection = clamp(
        this.state.affection + this.config.affectionOnLevelUp,
        this.config.affectionMin,
        this.config.affectionMax,
      );
      leveledUp = true;
    }

    this.state.mood = moodFor(event, affectionDelta, failedRoll);
    this.state.lastEventAt = t;
    const texts = BUBBLES[event];
    this.state.bubbleText = failedRoll && texts.fail ? texts.fail : texts.ok;
    if (leveledUp) {
      this.state.bubbleText = `陪伴升到 Lv${this.state.companionshipLevel}！好感+${this.config.affectionOnLevelUp}`;
      this.state.mood = "happy";
    }

    return {
      state: this.getState(),
      applied: true,
      affectionDelta,
      companionshipDelta,
      leveledUp,
      message: this.state.bubbleText,
    };
  }

  setSleepIfIdle(idleMs: number): PetState {
    if (this.now() - this.state.lastEventAt >= idleMs && this.state.mood !== "sleep") {
      this.state.mood = "sleep";
      this.state.bubbleText = "Zzz…还在呢";
    }
    return this.getState();
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function moodFor(event: PetEventType, affectionDelta: number, failedRoll: boolean): Mood {
  if (event === "idleTick") {
    return "sleep";
  }
  if (failedRoll || affectionDelta < 0) {
    return "sad";
  }
  if (affectionDelta > 0 || event === "taskSuccess" || event === "agentSuccess" || event === "gitCommit") {
    return "happy";
  }
  return "idle";
}
