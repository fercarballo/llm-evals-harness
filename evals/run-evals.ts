import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyTicket, type Category } from '../src/classifier';
import { MockLlmClient } from '../src/llm/mock-client';
import { exactMatch } from './scorers';
import { ACCURACY_THRESHOLD } from './config';
import type { LlmClient } from '../src/llm/client';

/**
 * Runner de evals.
 *
 * Corre el clasificador sobre el golden dataset, puntúa cada caso con exact-match
 * y calcula la exactitud agregada. Aplica el umbral como GATE: si la exactitud
 * está por debajo, termina con código != 0 (el pipeline falla).
 *
 * Usa el cliente MOCK: gratis, reproducible, apto para correr en cada PR.
 */

interface DatasetItem {
  input: string;
  expected: Category;
}

export interface EvalResult {
  total: number;
  correct: number;
  accuracy: number;
  failures: Array<{ input: string; expected: Category; actual: Category }>;
}

export async function runEvals(client: LlmClient): Promise<EvalResult> {
  const dataset: DatasetItem[] = JSON.parse(
    readFileSync(resolve('evals/dataset.json'), 'utf-8'),
  );

  const failures: EvalResult['failures'] = [];
  let correct = 0;

  for (const item of dataset) {
    const actual = await classifyTicket(item.input, client);
    if (exactMatch(actual, item.expected) === 1) {
      correct += 1;
    } else {
      failures.push({ input: item.input, expected: item.expected, actual });
    }
  }

  return {
    total: dataset.length,
    correct,
    accuracy: correct / dataset.length,
    failures,
  };
}

// Ejecución directa (npm run evals). Se compara la ruta decodificada para que
// funcione aunque el directorio tenga espacios (que la URL codificaría como %20).
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const result = await runEvals(new MockLlmClient());
  console.log(`\nEvals del clasificador de tickets`);
  console.log(`  Casos       : ${result.total}`);
  console.log(`  Correctos   : ${result.correct}`);
  console.log(`  Exactitud   : ${(result.accuracy * 100).toFixed(1)}%`);
  console.log(`  Umbral (gate): ${(ACCURACY_THRESHOLD * 100).toFixed(0)}%\n`);

  if (result.failures.length > 0) {
    console.log('  Casos fallidos:');
    for (const f of result.failures) {
      console.log(`    • "${f.input}"  esperado=${f.expected} obtenido=${f.actual}`);
    }
    console.log('');
  }

  if (result.accuracy < ACCURACY_THRESHOLD) {
    console.error(`❌ Gate FALLA: exactitud ${(result.accuracy * 100).toFixed(1)}% < umbral ${(ACCURACY_THRESHOLD * 100).toFixed(0)}%`);
    process.exit(1);
  }
  console.log(`✅ Gate OK: exactitud por encima del umbral.\n`);
}
