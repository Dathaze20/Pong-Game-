import { describe, it, expect } from 'vitest';
import GameLogic from '../game-logic.js';

const { clampPaddle, paddleHitsBall, reflectOffPaddle, computeAiDifficulty, isWinningScore } = GameLogic;

describe('clampPaddle', () => {
  it('keeps the paddle within the court bounds', () => {
    expect(clampPaddle(-10, 80, 400)).toBe(0);
    expect(clampPaddle(500, 80, 400)).toBe(320);
    expect(clampPaddle(150, 80, 400)).toBe(150);
  });
});

describe('paddleHitsBall', () => {
  const base = { bx: 30, by: 100, br: 8, pmar: 10, pw: 12, paddleY: 80, paddleH: 60, courtW: 500 };

  it('detects a left paddle hit only when the ball is moving left and overlapping', () => {
    expect(paddleHitsBall({ ...base, bdx: -5, side: 'left' })).toBe(true);
    expect(paddleHitsBall({ ...base, bdx: 5, side: 'left' })).toBe(false);
  });

  it('does not register a left hit when the ball is outside the paddle height range', () => {
    expect(paddleHitsBall({ ...base, bdx: -5, by: 500, side: 'left' })).toBe(false);
  });

  it('detects a right paddle hit only when the ball is moving right and overlapping', () => {
    const right = { ...base, bx: 470, paddleY: 80 };
    expect(paddleHitsBall({ ...right, bdx: 5, side: 'right' })).toBe(true);
    expect(paddleHitsBall({ ...right, bdx: -5, side: 'right' })).toBe(false);
  });
});

describe('reflectOffPaddle', () => {
  it('sends the ball rightward off the left paddle and leftward off the right paddle', () => {
    const left = reflectOffPaddle({ by: 110, paddleY: 80, paddleH: 60, speed: 400, side: 'left' });
    expect(left.bdx).toBeGreaterThan(0);

    const right = reflectOffPaddle({ by: 110, paddleY: 80, paddleH: 60, speed: 400, side: 'right' });
    expect(right.bdx).toBeLessThan(0);
  });

  it('bounces straight back when hit dead-center', () => {
    const center = reflectOffPaddle({ by: 110, paddleY: 80, paddleH: 60, speed: 400, side: 'left' });
    expect(center.bdy).toBeCloseTo(0, 5);
  });

  it('angles the return based on where the ball hit the paddle', () => {
    const top = reflectOffPaddle({ by: 80, paddleY: 80, paddleH: 60, speed: 400, side: 'left' });
    const bottom = reflectOffPaddle({ by: 140, paddleY: 80, paddleH: 60, speed: 400, side: 'left' });
    expect(top.bdy).toBeLessThan(0);
    expect(bottom.bdy).toBeGreaterThan(0);
  });

  it('keeps the resultant speed equal to the input speed', () => {
    const { bdx, bdy } = reflectOffPaddle({ by: 95, paddleY: 80, paddleH: 60, speed: 400, side: 'left' });
    expect(Math.hypot(bdx, bdy)).toBeCloseTo(400, 5);
  });
});

describe('computeAiDifficulty', () => {
  const cfg = { startSpd: 0.5, endSpd: 1, startErr: 40, endErr: 10, react: 1 };

  it('ramps difficulty up as the match progresses', () => {
    const early = computeAiDifficulty(cfg, 0, 0, 15);
    const late = computeAiDifficulty(cfg, 13, 13, 15);
    expect(late.speed).toBeGreaterThan(early.speed);
    expect(late.err).toBeLessThan(early.err);
  });

  it('rubber-bands: eases off when the AI (right side) is far ahead', () => {
    const tied = computeAiDifficulty(cfg, 5, 5, 15);
    const aiAhead = computeAiDifficulty(cfg, 0, 5, 15);
    expect(aiAhead.speed).toBeLessThan(tied.speed);
    expect(aiAhead.err).toBeGreaterThan(tied.err);
  });

  it('helps out less when the AI is behind, at the same match progress', () => {
    // Same total points (so progress is equal) but a different score gap,
    // isolating the rubber-band effect from the difficulty ramp.
    const tied = computeAiDifficulty(cfg, 5, 5, 15);
    const aiBehind = computeAiDifficulty(cfg, 8, 2, 15);
    expect(aiBehind.speed).toBeGreaterThan(tied.speed);
  });
});

describe('isWinningScore', () => {
  it('is true once a score reaches the target', () => {
    expect(isWinningScore(15, 15)).toBe(true);
    expect(isWinningScore(16, 15)).toBe(true);
    expect(isWinningScore(14, 15)).toBe(false);
  });
});
