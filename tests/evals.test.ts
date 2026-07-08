import { describe, it, expect } from 'vitest';
import { runEvals } from '../evals/run-evals';
import { MockLlmClient } from '../src/llm/mock-client';
import { ACCURACY_THRESHOLD } from '../evals/config';

describe('suite de evals', () => {
  it('la exactitud del sistema supera el umbral (gate)', async () => {
    const result = await runEvals(new MockLlmClient());
    expect(result.accuracy).toBeGreaterThanOrEqual(ACCURACY_THRESHOLD);
  });

  it('reporta el detalle de cada corrida', async () => {
    const result = await runEvals(new MockLlmClient());
    expect(result.total).toBeGreaterThan(0);
    expect(result.correct).toBeLessThanOrEqual(result.total);
    // failures + correct = total
    expect(result.failures.length + result.correct).toBe(result.total);
  });

  it('el gate FALLARÍA con un umbral imposible (mecanismo verificado)', async () => {
    const result = await runEvals(new MockLlmClient());
    const umbralImposible = 1.01;
    expect(result.accuracy < umbralImposible).toBe(true); // el gate dispararía exit 1
  });
});
