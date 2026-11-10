import assert from "assert";
import {
  AffectionEngine,
  createInitialState,
} from "../domain/AffectionEngine";

function run(): void {
  // success raises affection
  {
    const engine = new AffectionEngine(createInitialState(0), {
      now: () => 1000,
      random: () => 0.99,
    });
    const r = engine.apply("taskSuccess");
    assert.strictEqual(r.applied, true);
    assert.ok(r.affectionDelta > 0);
    assert.ok(r.state.affection > 10);
  }

  // cooldown blocks
  {
    let t = 1000;
    const engine = new AffectionEngine(createInitialState(0), {
      now: () => t,
      random: () => 0.99,
    });
    assert.strictEqual(engine.apply("save").applied, true);
    assert.strictEqual(engine.apply("save").applied, false);
    t = 20_000;
    assert.strictEqual(engine.apply("save").applied, true);
  }

  // fail roll can drop affection
  {
    const engine = new AffectionEngine(createInitialState(0), {
      now: () => 1000,
      random: () => 0.01,
      failChance: 0.35,
    });
    const before = engine.getState().affection;
    const r = engine.apply("taskFail");
    assert.strictEqual(r.applied, true);
    assert.ok(r.affectionDelta < 0);
    assert.ok(r.state.affection < before);
  }

  // companionship level grants affection
  {
    const engine = new AffectionEngine(
      { ...createInitialState(0), companionship: 99 },
      {
        now: () => 1000,
        random: () => 0.99,
        companionshipPerLevel: 100,
        affectionOnLevelUp: 5,
      },
    );
    const before = engine.getState().affection;
    const r = engine.apply("typing");
    assert.strictEqual(r.leveledUp, true);
    assert.strictEqual(r.state.companionshipLevel, 1);
    assert.ok(r.state.affection >= before + 5);
  }

  console.log("domain tests passed");
}

run();
