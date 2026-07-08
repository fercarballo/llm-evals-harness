/**
 * Scorers: distintas formas de puntuar la salida de un sistema con IA.
 *
 * Testear IA no es comparar por igualdad exacta: la salida es abierta y no
 * determinista. Se evalúan PROPIEDADES con scorers. Acá hay tres tipos, del más
 * estricto al más flexible.
 */

/** 1) Exact match: para tareas con respuesta única correcta (ej: clasificación). Devuelve 0 o 1. */
export function exactMatch(actual: string, expected: string): number {
  return actual.trim().toLowerCase() === expected.trim().toLowerCase() ? 1 : 0;
}

const tokenize = (text: string): string[] => text.toLowerCase().match(/\p{L}+/gu) ?? [];

/**
 * 2) Similitud semántica (aproximada, offline): coseno sobre bolsa de palabras.
 *
 * Para salidas abiertas (resúmenes, respuestas) donde no hay una única forma
 * correcta. Devuelve 0..1. En producción se usarían EMBEDDINGS reales; acá una
 * aproximación léxica determinista, suficiente para demostrar el concepto.
 */
export function semanticSimilarity(a: string, b: string): number {
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const vocab = new Set([...tokensA, ...tokensB]);
  const countIn = (tokens: string[], term: string) => tokens.filter((t) => t === term).length;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const term of vocab) {
    const va = countIn(tokensA, term);
    const vb = countIn(tokensB, term);
    dot += va * vb;
    normA += va * va;
    normB += vb * vb;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface JudgeRubric {
  mustInclude?: string[];
  maxWords?: number;
  forbid?: string[];
}

/**
 * 3) LLM-as-judge (mock determinista).
 *
 * Un juez puntúa una respuesta contra una rúbrica. En producción, el juez es OTRO
 * LLM con una rúbrica y ejemplos, calibrado contra evaluación humana. Acá una
 * heurística determinista que emula esa lógica, para poder testearla sin costo ni
 * no determinismo. Devuelve 0..1 (proporción de criterios de la rúbrica cumplidos).
 */
export function llmAsJudge(response: string, rubric: JudgeRubric): number {
  const text = response.toLowerCase();
  const checks: boolean[] = [];

  for (const term of rubric.mustInclude ?? []) {
    checks.push(text.includes(term.toLowerCase()));
  }
  for (const term of rubric.forbid ?? []) {
    checks.push(!text.includes(term.toLowerCase()));
  }
  if (rubric.maxWords !== undefined) {
    checks.push(tokenize(response).length <= rubric.maxWords);
  }

  if (checks.length === 0) return 1;
  return checks.filter(Boolean).length / checks.length;
}
